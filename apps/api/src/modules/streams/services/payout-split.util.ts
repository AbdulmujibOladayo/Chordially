const STELLAR_DECIMALS = 7
const SCALE = 10 ** STELLAR_DECIMALS

export interface PayoutShareInput {
  creatorId: string
  percentage: number
}

export interface PayoutShare {
  creatorId: string
  percentage: number
  amount: string
}

/**
 * Splits a decimal-string tip amount across payees by percentage, in
 * Stellar's 7-decimal-place stroop units to avoid floating point drift.
 * Rounds each share down, then hands the leftover remainder (a few stroops
 * at most) to the first payee, so the shares always sum to exactly the
 * input amount.
 */
export function splitAmount(totalAmount: string, payees: PayoutShareInput[]): PayoutShare[] {
  const totalStroops = Math.round(Number(totalAmount) * SCALE)

  const shares = payees.map((payee) => ({
    creatorId: payee.creatorId,
    percentage: payee.percentage,
    stroops: Math.floor((totalStroops * payee.percentage) / 100),
  }))

  const allocated = shares.reduce((sum, share) => sum + share.stroops, 0)
  const remainder = totalStroops - allocated
  if (shares.length > 0) {
    shares[0]!.stroops += remainder
  }

  return shares.map((share) => ({
    creatorId: share.creatorId,
    percentage: share.percentage,
    amount: (share.stroops / SCALE).toFixed(STELLAR_DECIMALS),
  }))
}
