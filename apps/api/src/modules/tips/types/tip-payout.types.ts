import type { TipStatus } from "./tip.types.js"

export interface TipPayout {
  id: string
  tipId: string
  creatorId: string
  percentage: number
  amount: string
  status: string
  txHash: string | null
  failureReason: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateTipPayoutInput {
  tipId: string
  creatorId: string
  percentage: number
  amount: string
}

export interface TipPayoutResponse {
  creatorId: string
  percentage: number
  amount: string
  status: TipStatus
  txHash: string | null
  failureReason: string | null
}

export function toTipPayoutResponse(payout: TipPayout): TipPayoutResponse {
  return {
    creatorId: payout.creatorId,
    percentage: payout.percentage,
    amount: payout.amount,
    status: payout.status as TipStatus,
    txHash: payout.txHash,
    failureReason: payout.failureReason,
  }
}
