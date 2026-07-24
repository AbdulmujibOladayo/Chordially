import { describe, expect, it } from "vitest"
import { splitAmount } from "../services/payout-split.util.js"

describe("splitAmount", () => {
  it("splits an amount evenly by percentage", () => {
    const shares = splitAmount("100", [
      { creatorId: "alice", percentage: 50 },
      { creatorId: "bob", percentage: 30 },
      { creatorId: "carol", percentage: 20 },
    ])

    expect(shares).toEqual([
      { creatorId: "alice", percentage: 50, amount: "50.0000000" },
      { creatorId: "bob", percentage: 30, amount: "30.0000000" },
      { creatorId: "carol", percentage: 20, amount: "20.0000000" },
    ])
  })

  it("assigns the rounding remainder to the first payee so shares sum to the total exactly", () => {
    const shares = splitAmount("10", [
      { creatorId: "alice", percentage: 33.34 },
      { creatorId: "bob", percentage: 33.33 },
      { creatorId: "carol", percentage: 33.33 },
    ])

    const total = shares.reduce((sum, share) => sum + Number(share.amount), 0)
    expect(total.toFixed(7)).toBe("10.0000000")
    expect(shares[0]!.amount).toBe("3.3340000")
  })

  it("handles a single payee taking the full amount", () => {
    const shares = splitAmount("42.5", [{ creatorId: "alice", percentage: 100 }])
    expect(shares).toEqual([{ creatorId: "alice", percentage: 100, amount: "42.5000000" }])
  })

  it("never loses or creates value across many small shares", () => {
    const payees = Array.from({ length: 7 }, (_, i) => ({
      creatorId: `p${i}`,
      percentage: 100 / 7,
    }))

    const shares = splitAmount("1", payees)
    const total = shares.reduce((sum, share) => sum + Number(share.amount), 0)
    expect(total.toFixed(7)).toBe("1.0000000")
  })
})
