import { AppError } from "../../../shared/errors/app-error.js"
import { creatorService } from "../../creators/services/creator.service.js"
import { streamPayoutConfigRepository } from "../repositories/stream-payout-config.repository.js"
import { streamService } from "./stream.service.js"
import type {
  PayoutPayeeInput,
  StreamPayoutConfig,
} from "../types/payout-config.types.js"

const PERCENTAGE_SUM_TOLERANCE = 0.001

function validatePayees(payees: PayoutPayeeInput[]): void {
  if (payees.length === 0) {
    throw new AppError(400, "PAYOUT_PAYEES_REQUIRED", "At least one payee is required")
  }

  const creatorIds = new Set(payees.map((payee) => payee.creatorId))
  if (creatorIds.size !== payees.length) {
    throw new AppError(
      400,
      "PAYOUT_DUPLICATE_CREATOR",
      "Each creator can only appear once in a payout config"
    )
  }

  for (const payee of payees) {
    if (payee.percentage <= 0 || payee.percentage > 100) {
      throw new AppError(
        400,
        "PAYOUT_INVALID_PERCENTAGE",
        "Each payee's percentage must be greater than 0 and at most 100"
      )
    }
  }

  const total = payees.reduce((sum, payee) => sum + payee.percentage, 0)
  if (Math.abs(total - 100) > PERCENTAGE_SUM_TOLERANCE) {
    throw new AppError(
      400,
      "PAYOUT_PERCENTAGES_MUST_SUM_TO_100",
      `Payee percentages must sum to 100, got ${total}`
    )
  }
}

export const streamPayoutConfigService = {
  findByStreamId(streamId: string): Promise<StreamPayoutConfig | null> {
    return streamPayoutConfigRepository.findByStreamId(streamId)
  },

  async setPayoutConfig(
    streamId: string,
    hostUserId: string,
    payees: PayoutPayeeInput[]
  ): Promise<StreamPayoutConfig> {
    const stream = await streamService.findById(streamId)
    if (!stream) {
      throw new AppError(404, "STREAM_NOT_FOUND", "Stream not found")
    }

    const host = await creatorService.findByUserId(hostUserId)
    if (!host || host.id !== stream.creatorId) {
      throw new AppError(
        403,
        "FORBIDDEN",
        "You do not have permission to configure this stream's payouts"
      )
    }

    validatePayees(payees)

    for (const payee of payees) {
      const creator = await creatorService.findById(payee.creatorId)
      if (!creator) {
        throw new AppError(
          404,
          "PAYEE_CREATOR_NOT_FOUND",
          `Creator ${payee.creatorId} does not exist`
        )
      }
    }

    return streamPayoutConfigRepository.set({ streamId, payees })
  },
}
