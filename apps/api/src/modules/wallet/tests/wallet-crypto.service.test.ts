import { randomBytes } from "node:crypto"
import { afterEach, describe, expect, it, vi } from "vitest"

// The global test setup mocks this whole module so registration tests don't
// need AWS credentials; unmock it here since this file tests the real logic.
vi.unmock("../services/wallet-crypto.service.js")

const sendMock = vi.fn()

vi.mock("@aws-sdk/client-kms", () => {
  class GenerateDataKeyCommand {
    constructor(public input: unknown) {}
  }
  class DecryptCommand {
    constructor(public input: unknown) {}
  }
  class KMSClient {
    send = sendMock
  }
  return { KMSClient, GenerateDataKeyCommand, DecryptCommand }
})

const { encryptSecret, decryptSecret } = await import("../services/wallet-crypto.service.js")

describe("wallet crypto envelope encryption", () => {
  afterEach(() => {
    sendMock.mockReset()
  })

  it("encrypts a secret using a KMS-issued data key and decrypts it back", async () => {
    const dataKey = randomBytes(32)

    sendMock.mockImplementation((command: { input: { CiphertextBlob?: Uint8Array } }) => {
      if ("CiphertextBlob" in command.input) {
        return Promise.resolve({ Plaintext: dataKey })
      }
      return Promise.resolve({ Plaintext: dataKey, CiphertextBlob: Buffer.from("wrapped-key") })
    })

    const secret = "SDNMCVXKW4XZOLXPYIBLK2QIF5NSXAOJXTIQBGOZAJIQ7WBHXKQXPZ4A"
    const encrypted = await encryptSecret(secret)

    expect(encrypted.encryptedSecret).not.toBe(secret)
    expect(encrypted.encryptedDataKey).toBe(Buffer.from("wrapped-key").toString("base64"))

    const decrypted = await decryptSecret(encrypted)
    expect(decrypted).toBe(secret)
  })

  it("throws when KMS returns no plaintext data key", async () => {
    sendMock.mockResolvedValue({})

    await expect(encryptSecret("some-secret")).rejects.toThrow(
      "KMS did not return a usable data key"
    )
  })
})
