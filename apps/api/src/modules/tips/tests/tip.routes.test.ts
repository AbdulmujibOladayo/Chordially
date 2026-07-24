import { NetworkError } from "@chordially/stellar"
import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createApp } from "../../../app.js"
import { prisma } from "../../../shared/database/prisma.js"
import { stellarClient } from "../../../shared/stellar/client.js"
import { walletService } from "../../wallet/services/wallet.service.js"

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

async function createCreatorWithWallet(email: string, slug: string) {
  const user = await prisma.user.create({ data: { email, passwordHash: "hash" } })
  const creator = await prisma.creatorProfile.create({
    data: { userId: user.id, displayName: slug, slug },
  })
  await walletService.createWalletForUser(user.id)
  return creator
}

beforeEach(async () => {
  await prisma.tip.deleteMany()
  await prisma.creatorProfile.deleteMany()
  await prisma.user.deleteMany()
  vi.mocked(stellarClient.submitPayment).mockClear()
})

describe("POST /api/tips", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app)
      .post("/api/tips")
      .send({ creatorId: "x", amount: "5", idempotencyKey: crypto.randomUUID() })
    expect(res.status).toBe(401)
  })

  it("rejects an invalid body", async () => {
    const { token } = await registerAndLogin("fan-invalid@test.com")

    const res = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${token}`)
      .send({ creatorId: "x", amount: "not-a-number", idempotencyKey: "not-a-uuid" })

    expect(res.status).toBe(400)
  })

  it("returns 404 for an unknown creator", async () => {
    const { token } = await registerAndLogin("fan-nocreator@test.com")

    const res = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${token}`)
      .send({ creatorId: "does-not-exist", amount: "5", idempotencyKey: crypto.randomUUID() })

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe("CREATOR_NOT_FOUND")
  })

  it("submits and confirms a tip", async () => {
    const { token } = await registerAndLogin("fan-happy@test.com")
    const creator = await createCreatorWithWallet("creator-happy@test.com", "happy-creator")

    const res = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${token}`)
      .send({ creatorId: creator.id, amount: "25", idempotencyKey: crypto.randomUUID() })

    expect(res.status).toBe(201)
    expect(res.body.status).toBe("confirmed")
    expect(typeof res.body.txHash).toBe("string")

    const stored = await prisma.tip.findUnique({ where: { id: res.body.id } })
    expect(stored?.status).toBe("confirmed")
    expect(stored?.attempts).toBe(1)
  })

  it("never double-submits a duplicate idempotency key", async () => {
    const { token } = await registerAndLogin("fan-idem@test.com")
    const creator = await createCreatorWithWallet("creator-idem@test.com", "idem-creator")
    const idempotencyKey = crypto.randomUUID()

    const first = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${token}`)
      .send({ creatorId: creator.id, amount: "10", idempotencyKey })

    const second = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${token}`)
      .send({ creatorId: creator.id, amount: "10", idempotencyKey })

    expect(first.body.id).toBe(second.body.id)
    expect(first.body.txHash).toBe(second.body.txHash)
    expect(vi.mocked(stellarClient.submitPayment)).toHaveBeenCalledTimes(1)

    const tips = await prisma.tip.findMany({ where: { idempotencyKey } })
    expect(tips).toHaveLength(1)
  })

  it("never double-submits concurrent duplicate requests", async () => {
    const { token } = await registerAndLogin("fan-race@test.com")
    const creator = await createCreatorWithWallet("creator-race@test.com", "race-creator")
    const idempotencyKey = crypto.randomUUID()
    const body = { creatorId: creator.id, amount: "10", idempotencyKey }

    const [first, second] = await Promise.all([
      request(app).post("/api/tips").set("Authorization", `Bearer ${token}`).send(body),
      request(app).post("/api/tips").set("Authorization", `Bearer ${token}`).send(body),
    ])

    expect(first.body.id).toBe(second.body.id)
    expect(vi.mocked(stellarClient.submitPayment)).toHaveBeenCalledTimes(1)

    const tips = await prisma.tip.findMany({ where: { idempotencyKey } })
    expect(tips).toHaveLength(1)
  })

  it("retries a transient Horizon failure and then confirms", async () => {
    const { token } = await registerAndLogin("fan-retry@test.com")
    const creator = await createCreatorWithWallet("creator-retry@test.com", "retry-creator")

    vi.mocked(stellarClient.submitPayment)
      .mockRejectedValueOnce(
        new NetworkError("bad seq", {
          data: { extras: { result_codes: { transaction: "tx_bad_seq" } } },
        })
      )
      .mockResolvedValueOnce({ hash: "retried-hash", ledger: 7, successful: true })

    const res = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${token}`)
      .send({ creatorId: creator.id, amount: "5", idempotencyKey: crypto.randomUUID() })

    expect(res.status).toBe(201)
    expect(res.body.status).toBe("confirmed")
    expect(res.body.txHash).toBe("retried-hash")

    const stored = await prisma.tip.findUnique({ where: { id: res.body.id } })
    expect(stored?.attempts).toBe(2)
  })

  it("fails without retrying a permanent Horizon error", async () => {
    const { token } = await registerAndLogin("fan-permfail@test.com")
    const creator = await createCreatorWithWallet("creator-permfail@test.com", "permfail-creator")

    vi.mocked(stellarClient.submitPayment).mockRejectedValueOnce(
      new Error("op_underfunded")
    )

    const res = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${token}`)
      .send({ creatorId: creator.id, amount: "5", idempotencyKey: crypto.randomUUID() })

    expect(res.status).toBe(201)
    expect(res.body.status).toBe("failed")
    expect(res.body.failureReason).toContain("op_underfunded")

    const stored = await prisma.tip.findUnique({ where: { id: res.body.id } })
    expect(stored?.attempts).toBe(1)
  })

  it("rate-limits a fan sending too many tips too quickly", async () => {
    const { token } = await registerAndLogin("fan-ratelimit@test.com")
    const creator = await createCreatorWithWallet("creator-ratelimit@test.com", "ratelimit-creator")

    // Default limit is 5 tips per 10s per fan (TIP_RATE_LIMIT_PER_FAN).
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post("/api/tips")
        .set("Authorization", `Bearer ${token}`)
        .send({ creatorId: creator.id, amount: "1", idempotencyKey: crypto.randomUUID() })
      expect(res.status).toBe(201)
    }

    const limited = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${token}`)
      .send({ creatorId: creator.id, amount: "1", idempotencyKey: crypto.randomUUID() })

    expect(limited.status).toBe(429)
    expect(limited.body.error.code).toBe("RATE_LIMITED")
  })
})
