import { beforeEach, describe, expect, it } from "vitest"
import { prisma } from "../../../shared/database/prisma.js"
import { creatorService } from "../../creators/services/creator.service.js"
import { streamService } from "../services/stream.service.js"

async function createCreator(email: string, displayName: string) {
  const user = await prisma.user.create({ data: { email, passwordHash: "hash" } })
  const creator = await creatorService.createCreatorProfile({ userId: user.id, displayName })
  return { user, creator }
}

beforeEach(async () => {
  await prisma.stream.deleteMany()
  await prisma.creatorProfile.deleteMany()
  await prisma.user.deleteMany()
})

describe("streamService.startStream", () => {
  it("starts a stream for a user with a creator profile", async () => {
    const { user, creator } = await createCreator("host@test.com", "Host One")

    const stream = await streamService.startStream(user.id, "Friday Set")

    expect(stream.creatorId).toBe(creator.id)
    expect(stream.title).toBe("Friday Set")
    expect(stream.endedAt).toBeNull()
  })

  it("rejects starting a stream for a user with no creator profile", async () => {
    const fan = await prisma.user.create({
      data: { email: "fan@test.com", passwordHash: "hash" },
    })

    await expect(streamService.startStream(fan.id)).rejects.toMatchObject({
      statusCode: 403,
      code: "CREATOR_PROFILE_REQUIRED",
    })
  })
})

describe("streamService.endStream", () => {
  it("marks the stream ended when the host owns it", async () => {
    const { user } = await createCreator("host2@test.com", "Host Two")
    const stream = await streamService.startStream(user.id)

    const ended = await streamService.endStream(stream.id, user.id)

    expect(ended.endedAt).not.toBeNull()
  })

  it("rejects ending a stream owned by someone else", async () => {
    const { user: hostA } = await createCreator("hosta@test.com", "Host A")
    const { user: hostB } = await createCreator("hostb@test.com", "Host B")
    const stream = await streamService.startStream(hostA.id)

    await expect(streamService.endStream(stream.id, hostB.id)).rejects.toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    })
  })

  it("throws 404 for an unknown stream", async () => {
    const { user } = await createCreator("host3@test.com", "Host Three")

    await expect(streamService.endStream("does-not-exist", user.id)).rejects.toMatchObject({
      statusCode: 404,
      code: "STREAM_NOT_FOUND",
    })
  })
})
