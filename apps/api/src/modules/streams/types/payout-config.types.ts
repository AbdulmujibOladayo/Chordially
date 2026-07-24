export interface PayoutPayeeInput {
  creatorId: string
  /** 0 < percentage <= 100; all payees for a config must sum to exactly 100. */
  percentage: number
}

export interface StreamPayoutConfigPayee {
  id: string
  payoutConfigId: string
  creatorId: string
  percentage: number
}

export interface StreamPayoutConfig {
  id: string
  streamId: string
  createdAt: Date
  updatedAt: Date
  payees: StreamPayoutConfigPayee[]
}

export interface SetPayoutConfigInput {
  streamId: string
  payees: PayoutPayeeInput[]
}

export interface StreamPayoutConfigResponse {
  id: string
  streamId: string
  payees: PayoutPayeeInput[]
}

export function toStreamPayoutConfigResponse(
  config: StreamPayoutConfig
): StreamPayoutConfigResponse {
  return {
    id: config.id,
    streamId: config.streamId,
    payees: config.payees.map((payee) => ({
      creatorId: payee.creatorId,
      percentage: payee.percentage,
    })),
  }
}
