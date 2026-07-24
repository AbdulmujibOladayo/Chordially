import { toTipPayoutResponse, type TipPayout, type TipPayoutResponse } from "./tip-payout.types.js"

export type TipStatus = "pending" | "submitted" | "confirmed" | "failed"

export interface Tip {
  id: string
  idempotencyKey: string
  fanUserId: string
  creatorId: string
  streamId: string | null
  amount: string
  status: string
  txHash: string | null
  failureReason: string | null
  attempts: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateTipInput {
  fanUserId: string
  creatorId: string
  amount: string
  idempotencyKey: string
  streamId?: string
}

export interface TipResponse {
  id: string
  creatorId: string
  streamId: string | null
  amount: string
  status: TipStatus
  txHash: string | null
  failureReason: string | null
  payouts?: TipPayoutResponse[]
}

export function toTipResponse(tip: Tip, payouts?: TipPayout[]): TipResponse {
  return {
    id: tip.id,
    creatorId: tip.creatorId,
    streamId: tip.streamId,
    amount: tip.amount,
    status: tip.status as TipStatus,
    txHash: tip.txHash,
    failureReason: tip.failureReason,
    ...(payouts && payouts.length > 0
      ? { payouts: payouts.map(toTipPayoutResponse) }
      : {}),
  }
}
