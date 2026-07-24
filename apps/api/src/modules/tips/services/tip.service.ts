import { Prisma } from "@prisma/client"
import { creatorService } from "../../creators/services/creator.service.js"
import { streamService } from "../../streams/services/stream.service.js"
import { walletRepository } from "../../wallet/repositories/wallet.repository.js"
import { decryptSecret } from "../../wallet/services/wallet-crypto.service.js"
import { AppError } from "../../../shared/errors/app-error.js"
import { logger } from "../../../shared/logger/logger.js"
import { tipEventBus } from "../../../shared/realtime/tip-event-bus.js"
import { stellarClient } from "../../../shared/stellar/client.js"
import { tipRepository } from "../repositories/tip.repository.js"
import {
  toTipResponse,
  type CreateTipInput,
  type Tip,
  type TipResponse,
  type TipStatus,
} from "../types/tip.types.js"

const MAX_SUBMISSION_ATTEMPTS = 3
const RETRY_BASE_DELAY_MS = 200

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isUniqueConstraintViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function publishTipEvent(tip: Tip): void {
  if (!tip.streamId) {
    return
  }

  tipEventBus.publish({
    streamId: tip.streamId,
    tipId: tip.id,
    creatorId: tip.creatorId,
    fanUserId: tip.fanUserId,
    amount: tip.amount,
    status: tip.status as TipStatus,
    txHash: tip.txHash,
    failureReason: tip.failureReason,
  })
}

async function submitToStellar(tip: Tip): Promise<Tip> {
  const [fanWallet, creator] = await Promise.all([
    walletRepository.findByUserId(tip.fanUserId),
    creatorService.findById(tip.creatorId),
  ])

  if (!fanWallet) {
    const failed = await tipRepository.markFailed(tip.id, "Sender has no wallet", tip.attempts)
    publishTipEvent(failed)
    return failed
  }

  const creatorWallet = creator ? await walletRepository.findByUserId(creator.userId) : null
  if (!creatorWallet) {
    const failed = await tipRepository.markFailed(tip.id, "Creator has no wallet", tip.attempts)
    publishTipEvent(failed)
    return failed
  }

  const submitted = await tipRepository.updateStatus(tip.id, "submitted")
  publishTipEvent(submitted)
  const sourceSecretKey = await decryptSecret(fanWallet)

  let attempts = tip.attempts
  let lastError: unknown

  while (attempts < MAX_SUBMISSION_ATTEMPTS) {
    attempts += 1

    try {
      const result = await stellarClient.submitPayment({
        sourceSecretKey,
        destinationPublicKey: creatorWallet.publicKey,
        amount: tip.amount,
      })

      const confirmed = await tipRepository.markConfirmed(tip.id, result.hash, attempts)
      publishTipEvent(confirmed)
      return confirmed
    } catch (error) {
      lastError = error

      const transient = stellarClient.isTransientSubmissionError(error)
      logger.warn("Tip submission attempt failed", {
        tipId: tip.id,
        attempt: attempts,
        transient,
        error: errorMessage(error),
      })

      if (!transient || attempts >= MAX_SUBMISSION_ATTEMPTS) {
        break
      }

      await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempts - 1))
    }
  }

  const failed = await tipRepository.markFailed(tip.id, errorMessage(lastError), attempts)
  publishTipEvent(failed)
  return failed
}

export const tipService = {
  async submitTip(input: CreateTipInput): Promise<TipResponse> {
    const existing = await tipRepository.findByIdempotencyKey(
      input.fanUserId,
      input.idempotencyKey
    )

    if (existing) {
      return toTipResponse(existing)
    }

    const creator = await creatorService.findById(input.creatorId)
    if (!creator) {
      throw new AppError(404, "CREATOR_NOT_FOUND", "Creator profile not found")
    }

    if (input.streamId) {
      const stream = await streamService.findById(input.streamId)
      if (!stream) {
        throw new AppError(404, "STREAM_NOT_FOUND", "Stream not found")
      }
      if (stream.creatorId !== creator.id) {
        throw new AppError(
          400,
          "STREAM_CREATOR_MISMATCH",
          "This stream does not belong to the given creator"
        )
      }
    }

    let tip: Tip

    try {
      tip = await tipRepository.create(input)
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        // Lost a race with a concurrent request using the same idempotency
        // key; return its result instead of submitting a second payment.
        const winner = await tipRepository.findByIdempotencyKey(
          input.fanUserId,
          input.idempotencyKey
        )
        if (winner) {
          return toTipResponse(winner)
        }
      }
      throw error
    }

    publishTipEvent(tip)

    const finalTip = await submitToStellar(tip)
    return toTipResponse(finalTip)
  },
}
