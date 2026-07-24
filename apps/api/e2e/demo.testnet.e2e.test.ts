/**
 * End-to-end demo against real Stellar Testnet infrastructure (Horizon +
 * Friendbot). See docs/demo-e2e.md for how and why to run this.
 *
 * Covers, in one pass: signup -> wallet provisioning -> a live tip ->
 * a split payment -> independently-verified ledger confirmation ->
 * reconciliation of a manufactured stuck payment.
 *
 * This is opt-in (pnpm test:e2e:testnet) because it needs real network
 * access and real ledger-close time (several seconds per transaction) —
 * it is deliberately excluded from the normal `pnpm test` run.
 */
import crypto from "node:crypto"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { createApp } from "../src/app.js"
import { prisma } from "../src/shared/database/prisma.js"
import { stellarClient } from "../src/shared/stellar/client.js"
import { decryptSecret } from "../src/modules/wallet/services/wallet-crypto.service.js"
import { walletRepository } from "../src/modules/wallet/repositories/wallet.repository.js"
import { reconciliationService } from "../src/modules/reconciliation/services/reconciliation.service.js"

const app = createApp()

async function registerAndLogin(email: string) {
  await request(app).post("/api/auth/register").send({ email, password: "Password1!" })
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "Password1!" })
  return { token: res.body.token as string, userId: res.body.user.id as string }
}

async function createCreator(email: string, slug: string) {
  const { token, userId } = await registerAndLogin(email)
  const creator = await prisma.creatorProfile.create({
    data: { userId, displayName: slug, slug },
  })
  return { token, userId, creator }
}

async function waitForFunding(publicKey: string, attempts = 10): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    try {
      await stellarClient.getNativeBalance({ publicKey })
      return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }
  throw new Error(`Account ${publicKey} never became visible on Horizon`)
}

async function balanceOf(userId: string): Promise<number> {
  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId } })
  const balance = await stellarClient.getNativeBalance({ publicKey: wallet.publicKey })
  return Number(balance)
}

describe("Demo: signup -> wallet -> live tip -> split payment -> confirmation -> reconciliation", () => {
  let fan: Awaited<ReturnType<typeof registerAndLogin>>
  let host: Awaited<ReturnType<typeof createCreator>>
  let cohost: Awaited<ReturnType<typeof createCreator>>
  let streamId: string

  beforeAll(async () => {
    // 1. Signup + 2. wallet provisioning (registration triggers keypair
    // generation, envelope encryption, and real Friendbot funding).
    fan = await registerAndLogin(`e2e-fan-${Date.now()}@test.com`)
    host = await createCreator(`e2e-host-${Date.now()}@test.com`, `e2e-host-${Date.now()}`)
    cohost = await createCreator(`e2e-cohost-${Date.now()}@test.com`, `e2e-cohost-${Date.now()}`)

    const fanWallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: fan.userId } })
    const hostWallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: host.userId } })
    const cohostWallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: cohost.userId } })

    await Promise.all([
      waitForFunding(fanWallet.publicKey),
      waitForFunding(hostWallet.publicKey),
      waitForFunding(cohostWallet.publicKey),
    ])

    const streamRes = await request(app)
      .post("/api/streams")
      .set("Authorization", `Bearer ${host.token}`)
      .send({ title: "E2E demo stream" })
    streamId = streamRes.body.id as string
  })

  it("3. confirms a live tip on real Testnet", async () => {
    const hostBalanceBefore = await balanceOf(host.userId)

    const tipRes = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${fan.token}`)
      .send({
        creatorId: host.creator.id,
        amount: "5",
        idempotencyKey: crypto.randomUUID(),
        streamId,
      })

    expect(tipRes.status).toBe(201)
    expect(tipRes.body.status).toBe("confirmed")
    expect(tipRes.body.txHash).toMatch(/^[0-9a-f]{64}$/i)

    // 5. Ledger confirmation, verified independently of our own DB: read
    // the recipient's balance straight from Horizon and check it actually
    // moved by the tipped amount.
    const hostBalanceAfter = await balanceOf(host.userId)
    expect(hostBalanceAfter - hostBalanceBefore).toBeCloseTo(5, 5)
  })

  it("4. splits a tip across payees on real Testnet", async () => {
    await request(app)
      .put(`/api/streams/${streamId}/payout-config`)
      .set("Authorization", `Bearer ${host.token}`)
      .send({
        payees: [
          { creatorId: host.creator.id, percentage: 60 },
          { creatorId: cohost.creator.id, percentage: 40 },
        ],
      })

    const hostBalanceBefore = await balanceOf(host.userId)
    const cohostBalanceBefore = await balanceOf(cohost.userId)

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
    expect(tipRes.body.status).toBe("confirmed")
    expect(tipRes.body.payouts).toHaveLength(2)
    expect(tipRes.body.payouts.every((p: { status: string }) => p.status === "confirmed")).toBe(
      true
    )

    const hostBalanceAfter = await balanceOf(host.userId)
    const cohostBalanceAfter = await balanceOf(cohost.userId)
    expect(hostBalanceAfter - hostBalanceBefore).toBeCloseTo(6, 5)
    expect(cohostBalanceAfter - cohostBalanceBefore).toBeCloseTo(4, 5)
  })

  it("6. reconciles a payment that landed on-chain but was never marked confirmed locally", async () => {
    // Simulate a worker crashing right after Horizon accepted the
    // transaction but before the local DB write landed: submit a real
    // payment directly (bypassing tipService), then create a Tip row stuck
    // in "submitted" for it.
    const fanWallet = await walletRepository.findByUserId(fan.userId)
    const hostWallet = await walletRepository.findByUserId(host.userId)
    if (!fanWallet || !hostWallet) {
      throw new Error("expected fan and host wallets to exist")
    }

    const sourceSecretKey = await decryptSecret(fanWallet)
    const amount = "1.5000000"

    const result = await stellarClient.submitPayment({
      sourceSecretKey,
      destinationPublicKey: hostWallet.publicKey,
      amount,
    })
    expect(result.successful).toBe(true)

    const orphanedTip = await prisma.tip.create({
      data: {
        fanUserId: fan.userId,
        creatorId: host.creator.id,
        amount,
        idempotencyKey: crypto.randomUUID(),
        status: "submitted",
        attempts: 1,
      },
    })
    await prisma.tip.update({
      where: { id: orphanedTip.id },
      data: { updatedAt: new Date(Date.now() - 10 * 60_000) },
    })

    const summary = await reconciliationService.run()
    expect(summary.confirmed).toBeGreaterThanOrEqual(1)

    const reconciled = await prisma.tip.findUniqueOrThrow({ where: { id: orphanedTip.id } })
    expect(reconciled.status).toBe("confirmed")
    expect(reconciled.txHash).toBe(result.hash)
  })
})
