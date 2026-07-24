import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../../../app.js"
import { prisma } from "../../../shared/database/prisma.js"

const app = createApp()

async function registerAndLogin(email: string) {
  await request(app).post("/api/auth/register").send({ email, password: "Password1!" })
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "Password1!" })
  return { token: res.body.token as string }
}

beforeEach(async () => {
  await prisma.tip.deleteMany()
  await prisma.user.deleteMany()
})

describe("POST /api/reconciliation/run", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).post("/api/reconciliation/run")
    expect(res.status).toBe(401)
  })

  it("runs reconciliation and returns a summary", async () => {
    const { token } = await registerAndLogin("recon-route-fan@test.com")

    const res = await request(app)
      .post("/api/reconciliation/run")
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      scanned: expect.any(Number),
      confirmed: expect.any(Number),
      deadLettered: expect.any(Number),
      stillPending: expect.any(Number),
    })
  })
})
