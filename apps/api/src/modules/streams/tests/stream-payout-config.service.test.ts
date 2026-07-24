import { beforeEach, describe, expect, it } from "vitest"
import { prisma } from "../../../shared/database/prisma.js"
import { creatorService } from "../../creators/services/creator.service.js"
import { streamPayoutConfigService } from "../services/stream-payout-config.service.js"
import { streamService } from "../services/stream.service.js"

async function createCreator(email: string, displayName: string) {
  const user = await prisma.user.create({ data: { email, passwordHash: "hash" } })
  const creator = await creatorService.createCreatorProfile({ userId: user.id, displayName })
  return { user, creator }
}

beforeEach(async () => {
  await prisma.streamPayoutConfig.deleteMany()
  await prisma.stream.deleteMany()
  await prisma.creatorProfile.deleteMany()
  await prisma.user.deleteMany()
})

describe("streamPayoutConfigService.setPayoutConfig", () => {
  it("creates a config when percentages sum to 100", async () => {
    const { user: host, creator: alice } = await createCreator("alice@test.com", "Alice")
    const { creator: bob } = await createCreator("bob@test.com", "Bob")
    const { creator: carol } = await createCreator("carol@test.com", "Carol")
    const stream = await streamService.startStream(host.id)

    const config = await streamPayoutConfigService.setPayoutConfig(stream.id, host.id, [
      { creatorId: alice.id, percentage: 50 },
      { creatorId: bob.id, percentage: 30 },
      { creatorId: carol.id, percentage: 20 },
    ])

    expect(config.payees).toHaveLength(3)
    expect(config.payees.map((p) => p.percentage).sort()).toEqual([20, 30, 50])
  })

  it("rejects percentages that don't sum to 100", async () => {
    const { user: host, creator: alice } = await createCreator("alice2@test.com", "Alice")
    const { creator: bob } = await createCreator("bob2@test.com", "Bob")
    const stream = await streamService.startStream(host.id)

    await expect(
      streamPayoutConfigService.setPayoutConfig(stream.id, host.id, [
        { creatorId: alice.id, percentage: 50 },
        { creatorId: bob.id, percentage: 40 },
      ])
    ).rejects.toMatchObject({ statusCode: 400, code: "PAYOUT_PERCENTAGES_MUST_SUM_TO_100" })
  })

  it("rejects a duplicate creator in the payee list", async () => {
    const { user: host, creator: alice } = await createCreator("alice3@test.com", "Alice")
    const stream = await streamService.startStream(host.id)

    await expect(
      streamPayoutConfigService.setPayoutConfig(stream.id, host.id, [
        { creatorId: alice.id, percentage: 60 },
        { creatorId: alice.id, percentage: 40 },
      ])
    ).rejects.toMatchObject({ statusCode: 400, code: "PAYOUT_DUPLICATE_CREATOR" })
  })

  it("rejects an unknown payee creator", async () => {
    const { user: host, creator: alice } = await createCreator("alice4@test.com", "Alice")
    const stream = await streamService.startStream(host.id)

    await expect(
      streamPayoutConfigService.setPayoutConfig(stream.id, host.id, [
        { creatorId: alice.id, percentage: 50 },
        { creatorId: "does-not-exist", percentage: 50 },
      ])
    ).rejects.toMatchObject({ statusCode: 404, code: "PAYEE_CREATOR_NOT_FOUND" })
  })

  it("rejects a non-host trying to configure the stream", async () => {
    const { user: host, creator: alice } = await createCreator("alice5@test.com", "Alice")
    const { user: intruder } = await createCreator("intruder@test.com", "Intruder")
    const stream = await streamService.startStream(host.id)

    await expect(
      streamPayoutConfigService.setPayoutConfig(stream.id, intruder.id, [
        { creatorId: alice.id, percentage: 100 },
      ])
    ).rejects.toMatchObject({ statusCode: 403, code: "FORBIDDEN" })
  })

  it("replaces an existing config rather than accumulating payees", async () => {
    const { user: host, creator: alice } = await createCreator("alice6@test.com", "Alice")
    const { creator: bob } = await createCreator("bob6@test.com", "Bob")
    const stream = await streamService.startStream(host.id)

    await streamPayoutConfigService.setPayoutConfig(stream.id, host.id, [
      { creatorId: alice.id, percentage: 100 },
    ])

    const replaced = await streamPayoutConfigService.setPayoutConfig(stream.id, host.id, [
      { creatorId: alice.id, percentage: 60 },
      { creatorId: bob.id, percentage: 40 },
    ])

    expect(replaced.payees).toHaveLength(2)
  })
})
