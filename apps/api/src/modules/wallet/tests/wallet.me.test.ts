import request from "supertest"
import { describe, expect, it } from "vitest"
import { createApp } from "../../../app.js"
import { prisma } from "../../../shared/database/prisma.js"

const app = createApp()

async function registerAndLogin(email: string) {
  await request(app)
    .post("/api/auth/register")
    .send({ email, password: "Password1!" })

  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "Password1!" })

  return { token: res.body.token as string, userId: res.body.user.id as string }
}

describe("GET /api/wallet/me", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/wallet/me")
    expect(res.status).toBe(401)
  })

  it("returns the wallet created automatically at signup", async () => {
    const { token, userId } = await registerAndLogin("wallet-me@test.com")

    const res = await request(app)
      .get("/api/wallet/me")
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.publicKey).toMatch(/^G[A-Z0-9]{55}$/)
    expect(res.body.network).toBe("testnet")
    expect(typeof res.body.balance).toBe("string")

    const wallet = await prisma.wallet.findUnique({ where: { userId } })
    expect(wallet).not.toBeNull()
    expect(wallet?.publicKey).toBe(res.body.publicKey)
    // The secret must never be persisted in plaintext (Stellar secret keys
    // are 56-char strings starting with "S").
    expect(wallet?.encryptedSecret).not.toMatch(/^S[A-Z0-9]{55}$/)
  })

  it("persists a distinct wallet per user", async () => {
    const first = await registerAndLogin("wallet-a@test.com")
    const second = await registerAndLogin("wallet-b@test.com")

    const [resA, resB] = await Promise.all([
      request(app).get("/api/wallet/me").set("Authorization", `Bearer ${first.token}`),
      request(app).get("/api/wallet/me").set("Authorization", `Bearer ${second.token}`),
    ])

    expect(resA.body.publicKey).not.toBe(resB.body.publicKey)
  })
})
