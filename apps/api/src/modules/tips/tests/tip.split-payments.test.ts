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
  // Registration already provisions a wallet (see modules/wallet); we only
  // need to layer a creator profile on top of it here.
  const { token, userId } = await registerAndLogin(email)
  const creator = await prisma.creatorProfile.create({
    data: { userId, displayName: slug, slug },
  })
  return { token, userId, creator }
}

beforeEach(async () => {
  await prisma.tipPayout.deleteMany()
  await prisma.tip.deleteMany()
  await prisma.streamPayoutConfig.deleteMany()
  await prisma.stream.deleteMany()
  await prisma.creatorProfile.deleteMany()
  await prisma.user.deleteMany()
  vi.mocked(stellarClient.submitSplitPayment).mockClear()
})

describe("POST /api/tips with a split stream", () => {
  it("splits the tip across payees according to the payout config and confirms them together", async () => {
    const fan = await registerAndLogin("split-fan@test.com")
    const host = await createCreatorWithWallet("split-host@test.com", "split-host")
    const bob = await createCreatorWithWallet("split-bob@test.com", "split-bob")
    const carol = await createCreatorWithWallet("split-carol@test.com", "split-carol")

    const streamRes = await request(app)
      .post("/api/streams")
      .set("Authorization", `Bearer ${host.token}`)
      .send({})
    const streamId = streamRes.body.id as string

    await request(app)
      .put(`/api/streams/${streamId}/payout-config`)
      .set("Authorization", `Bearer ${host.token}`)
      .send({
        payees: [
          { creatorId: host.creator.id, percentage: 50 },
          { creatorId: bob.creator.id, percentage: 30 },
          { creatorId: carol.creator.id, percentage: 20 },
        ],
      })

    const tipRes = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${fan.token}`)
      .send({
        creatorId: host.creator.id,
        amount: "100",
        idempotencyKey: crypto.randomUUID(),
        streamId,
      })

    expect(tipRes.status).toBe(201)
    expect(tipRes.body.status).toBe("confirmed")
    expect(tipRes.body.payouts).toHaveLength(3)

    const byCreator = Object.fromEntries(
      (tipRes.body.payouts as { creatorId: string; amount: string; status: string }[]).map(
        (p) => [p.creatorId, p]
      )
    )
    expect(byCreator[host.creator.id]).toMatchObject({ amount: "50.0000000", status: "confirmed" })
    expect(byCreator[bob.creator.id]).toMatchObject({ amount: "30.0000000", status: "confirmed" })
    expect(byCreator[carol.creator.id]).toMatchObject({ amount: "20.0000000", status: "confirmed" })

    // One atomic transaction, one operation per payee.
    expect(vi.mocked(stellarClient.submitSplitPayment)).toHaveBeenCalledTimes(1)
    const call = vi.mocked(stellarClient.submitSplitPayment).mock.calls[0]![0]
    expect(call.payments).toHaveLength(3)

    const storedPayouts = await prisma.tipPayout.findMany({ where: { tipId: tipRes.body.id } })
    expect(storedPayouts).toHaveLength(3)
    expect(storedPayouts.every((p) => p.status === "confirmed")).toBe(true)
    expect(storedPayouts.every((p) => p.txHash === tipRes.body.txHash)).toBe(true)
  })

  it("fails every payout together when the split submission fails", async () => {
    const fan = await registerAndLogin("split-fail-fan@test.com")
    const host = await createCreatorWithWallet("split-fail-host@test.com", "split-fail-host")
    const bob = await createCreatorWithWallet("split-fail-bob@test.com", "split-fail-bob")

    const streamRes = await request(app)
      .post("/api/streams")
      .set("Authorization", `Bearer ${host.token}`)
      .send({})
    const streamId = streamRes.body.id as string

    await request(app)
      .put(`/api/streams/${streamId}/payout-config`)
      .set("Authorization", `Bearer ${host.token}`)
      .send({
        payees: [
          { creatorId: host.creator.id, percentage: 70 },
          { creatorId: bob.creator.id, percentage: 30 },
        ],
      })

    vi.mocked(stellarClient.submitSplitPayment).mockRejectedValueOnce(new Error("op_underfunded"))

    const tipRes = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${fan.token}`)
      .send({
        creatorId: host.creator.id,
        amount: "10",
        idempotencyKey: crypto.randomUUID(),
        streamId,
      })

    expect(tipRes.status).toBe(201)
    expect(tipRes.body.status).toBe("failed")
    expect(tipRes.body.payouts.every((p: { status: string }) => p.status === "failed")).toBe(true)
  })

  it("does not split a tip on a stream with no payout config", async () => {
    const fan = await registerAndLogin("nosplit-fan@test.com")
    const host = await createCreatorWithWallet("nosplit-host@test.com", "nosplit-host")

    const streamRes = await request(app)
      .post("/api/streams")
      .set("Authorization", `Bearer ${host.token}`)
      .send({})
    const streamId = streamRes.body.id as string

    const tipRes = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${fan.token}`)
      .send({
        creatorId: host.creator.id,
        amount: "10",
        idempotencyKey: crypto.randomUUID(),
        streamId,
      })

    expect(tipRes.status).toBe(201)
    expect(tipRes.body.payouts).toBeUndefined()
    expect(vi.mocked(stellarClient.submitSplitPayment)).not.toHaveBeenCalled()
  })
})
