import { Prisma } from "@prisma/client"
import { creatorService } from "../../creators/services/creator.service.js"
import { walletRepository } from "../../wallet/repositories/wallet.repository.js"
import { decryptSecret } from "../../wallet/services/wallet-crypto.service.js"
import { AppError } from "../../../shared/errors/app-error.js"
import { logger } from "../../../shared/logger/logger.js"
import { stellarClient } from "../../../shared/stellar/client.js"
import { tipRepository } from "../repositories/tip.repository.js"
import { toTipResponse, type CreateTipInput, type Tip, type TipResponse } from "../types/tip.types.js"

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

async function submitToStellar(tip: Tip): Promise<Tip> {
  const [fanWallet, creator] = await Promise.all([
    walletRepository.findByUserId(tip.fanUserId),
    creatorService.findById(tip.creatorId),
  ])

  if (!fanWallet) {
    return tipRepository.markFailed(tip.id, "Sender has no wallet", tip.attempts)
  }

  const creatorWallet = creator ? await walletRepository.findByUserId(creator.userId) : null
  if (!creatorWallet) {
    return tipRepository.markFailed(tip.id, "Creator has no wallet", tip.attempts)
  }

  await tipRepository.updateStatus(tip.id, "submitted")
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

      return tipRepository.markConfirmed(tip.id, result.hash, attempts)
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

  return tipRepository.markFailed(tip.id, errorMessage(lastError), attempts)
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

    const finalTip = await submitToStellar(tip)
    return toTipResponse(finalTip)
  },
}
