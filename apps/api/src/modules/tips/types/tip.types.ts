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
}

export function toTipResponse(tip: Tip): TipResponse {
  return {
    id: tip.id,
    creatorId: tip.creatorId,
    streamId: tip.streamId,
    amount: tip.amount,
    status: tip.status as TipStatus,
    txHash: tip.txHash,
    failureReason: tip.failureReason,
  }
}
