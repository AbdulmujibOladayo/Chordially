import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createApp } from "../../../app.js"
import { prisma } from "../../../shared/database/prisma.js"
import { stellarClient } from "../../../shared/stellar/client.js"

const app = createApp()

async function registerAndLogin(email: string) {
  await request(app).post("/api/auth/register").send({ email, password: "Password1!" })
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "Password1!" })
  return { token: res.body.token as string, userId: res.body.user.id as string }
}

async function createCreatorWithWallet(email: string, slug: string) {
  const { userId } = await registerAndLogin(email)
  const creator = await prisma.creatorProfile.create({
    data: { userId, displayName: slug, slug },
  })
  return creator
}

beforeEach(async () => {
  await prisma.tip.deleteMany()
  await prisma.creatorProfile.deleteMany()
  await prisma.user.deleteMany()
  vi.mocked(stellarClient.submitPayment).mockClear()
})

describe("GET /api/tips/:id", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/tips/does-not-exist")
    expect(res.status).toBe(401)
  })

  it("returns 404 for a tip that isn't the caller's", async () => {
    const owner = await registerAndLogin("tipget-owner@test.com")
    const intruder = await registerAndLogin("tipget-intruder@test.com")
    const creator = await createCreatorWithWallet("tipget-creator@test.com", "tipget-creator")

    const tipRes = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ creatorId: creator.id, amount: "5", idempotencyKey: crypto.randomUUID() })

    const res = await request(app)
      .get(`/api/tips/${tipRes.body.id}`)
      .set("Authorization", `Bearer ${intruder.token}`)

    expect(res.status).toBe(404)
  })

  it("returns the tip's current state to its owner", async () => {
    const fan = await registerAndLogin("tipget-fan@test.com")
    const creator = await createCreatorWithWallet("tipget-fan-creator@test.com", "tipget-fan-creator")

    const tipRes = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${fan.token}`)
      .send({ creatorId: creator.id, amount: "5", idempotencyKey: crypto.randomUUID() })

    const res = await request(app)
      .get(`/api/tips/${tipRes.body.id}`)
      .set("Authorization", `Bearer ${fan.token}`)

    expect(res.status).toBe(200)
    expect(res.body.id).toBe(tipRes.body.id)
    expect(res.body.status).toBe("confirmed")
  })
})

describe("POST /api/tips/:id/retry", () => {
  it("rejects retrying a tip that isn't the caller's", async () => {
    const owner = await registerAndLogin("retry-owner@test.com")
    const intruder = await registerAndLogin("retry-intruder@test.com")
    const creator = await createCreatorWithWallet("retry-creator@test.com", "retry-creator")

    vi.mocked(stellarClient.submitPayment).mockRejectedValueOnce(new Error("op_underfunded"))
    const tipRes = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ creatorId: creator.id, amount: "5", idempotencyKey: crypto.randomUUID() })
    expect(tipRes.body.status).toBe("failed")

    const res = await request(app)
      .post(`/api/tips/${tipRes.body.id}/retry`)
      .set("Authorization", `Bearer ${intruder.token}`)

    expect(res.status).toBe(404)
  })

  it("rejects retrying a tip that isn't in a failed state", async () => {
    const fan = await registerAndLogin("retry-notfailed-fan@test.com")
    const creator = await createCreatorWithWallet(
      "retry-notfailed-creator@test.com",
      "retry-notfailed-creator"
    )

    const tipRes = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${fan.token}`)
      .send({ creatorId: creator.id, amount: "5", idempotencyKey: crypto.randomUUID() })
    expect(tipRes.body.status).toBe("confirmed")

    const res = await request(app)
      .post(`/api/tips/${tipRes.body.id}/retry`)
      .set("Authorization", `Bearer ${fan.token}`)

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe("TIP_NOT_RETRYABLE")
  })

  it("lets a fan safely retry a permanently failed tip as a brand-new tip", async () => {
    const fan = await registerAndLogin("retry-fan@test.com")
    const creator = await createCreatorWithWallet("retry-fan-creator@test.com", "retry-fan-creator")

    vi.mocked(stellarClient.submitPayment).mockRejectedValueOnce(new Error("op_underfunded"))
    const failedRes = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${fan.token}`)
      .send({ creatorId: creator.id, amount: "5", idempotencyKey: crypto.randomUUID() })
    expect(failedRes.body.status).toBe("failed")

    const retryRes = await request(app)
      .post(`/api/tips/${failedRes.body.id}/retry`)
      .set("Authorization", `Bearer ${fan.token}`)

    expect(retryRes.status).toBe(201)
    expect(retryRes.body.status).toBe("confirmed")
    expect(retryRes.body.id).not.toBe(failedRes.body.id)
    expect(retryRes.body.retriedFromTipId).toBe(failedRes.body.id)
    expect(retryRes.body.creatorId).toBe(failedRes.body.creatorId)
    expect(retryRes.body.amount).toBe(failedRes.body.amount)

    // The original failed tip is untouched — it stays as the visible
    // failure history, it isn't resubmitted or mutated.
    const original = await prisma.tip.findUniqueOrThrow({ where: { id: failedRes.body.id } })
    expect(original.status).toBe("failed")
  })
})
