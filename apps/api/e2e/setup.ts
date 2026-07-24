import { afterAll, vi } from "vitest"
import { prisma } from "../src/shared/database/prisma.js"

// Unlike tests/setup.ts, this suite deliberately does NOT mock the Stellar
// client — the whole point is to exercise real Horizon Testnet submissions,
// Friendbot funding, and ledger confirmation. KMS is still faked (we don't
// have real AWS credentials in this environment); that's purely an
// app-side encryption detail and has no bearing on what happens on-chain.
vi.mock("../src/modules/wallet/services/wallet-crypto.service.js", () => ({
  encryptSecret: vi.fn(async (plaintext: string) => ({
    encryptedSecret: Buffer.from(plaintext).toString("base64"),
    encryptedDataKey: "e2e-test-encrypted-data-key",
    iv: "e2e-test-iv",
    authTag: "e2e-test-auth-tag",
  })),
  decryptSecret: vi.fn(async (encrypted: { encryptedSecret: string }) =>
    Buffer.from(encrypted.encryptedSecret, "base64").toString("utf8")
  ),
}))

// Unlike tests/setup.ts, there's no per-test table wipe here: the demo
// spans multiple `it` blocks sharing state set up once in `beforeAll`
// (fresh, uniquely-emailed users each run), not one fixture per test.
afterAll(async () => {
  await prisma.$disconnect()
})
