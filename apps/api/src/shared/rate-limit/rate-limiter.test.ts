import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createRateLimiter } from "./rate-limiter.js"

describe("createRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("allows calls up to the max within the window", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 3 })

    expect(limiter.consume("a")).toBe(true)
    expect(limiter.consume("a")).toBe(true)
    expect(limiter.consume("a")).toBe(true)
    expect(limiter.consume("a")).toBe(false)
  })

  it("tracks separate keys independently", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 1 })

    expect(limiter.consume("a")).toBe(true)
    expect(limiter.consume("b")).toBe(true)
    expect(limiter.consume("a")).toBe(false)
    expect(limiter.consume("b")).toBe(false)
  })

  it("allows calls again once the window has elapsed", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 1 })

    expect(limiter.consume("a")).toBe(true)
    expect(limiter.consume("a")).toBe(false)

    vi.advanceTimersByTime(1001)

    expect(limiter.consume("a")).toBe(true)
  })
})
