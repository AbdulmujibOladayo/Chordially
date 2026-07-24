import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../../app.js"
import { prisma } from "../database/prisma.js"
import { metrics } from "./metrics.js"

const app = createApp()

async function registerAndLogin(email: string) {
  await request(app).post("/api/auth/register").send({ email, password: "Password1!" })
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "Password1!" })
  return { token: res.body.token as string }
}

beforeEach(async () => {
  await prisma.user.deleteMany()
  metrics.reset()
})

describe("GET /api/metrics", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/metrics")
    expect(res.status).toBe(401)
  })

  it("returns the current counters and histogram summaries", async () => {
    const { token } = await registerAndLogin("metrics-fan@test.com")

    metrics.incrementCounter("tip_confirmed_total", 2)
    metrics.observeLatency("tip_confirmation_latency_ms", 150)

    const res = await request(app).get("/api/metrics").set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.counters.tip_confirmed_total).toBe(2)
    expect(res.body.histograms.tip_confirmation_latency_ms.count).toBe(1)
  })
})
