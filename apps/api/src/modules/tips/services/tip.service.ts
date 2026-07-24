import { Prisma } from "@prisma/client"
import { creatorService } from "../../creators/services/creator.service.js"
import { splitAmount } from "../../streams/services/payout-split.util.js"
import { streamPayoutConfigService } from "../../streams/services/stream-payout-config.service.js"
import { streamService } from "../../streams/services/stream.service.js"
import { walletRepository } from "../../wallet/repositories/wallet.repository.js"
import { decryptSecret } from "../../wallet/services/wallet-crypto.service.js"
import { AppError } from "../../../shared/errors/app-error.js"
import { logger } from "../../../shared/logger/logger.js"
import { tipEventBus } from "../../../shared/realtime/tip-event-bus.js"
import { stellarClient } from "../../../shared/stellar/client.js"
import { tipPayoutRepository } from "../repositories/tip-payout.repository.js"
import { tipRepository } from "../repositories/tip.repository.js"
import { toTipPayoutResponse, type TipPayout } from "../types/tip-payout.types.js"
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

function publishTipEvent(tip: Tip, payouts: TipPayout[]): void {
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
    ...(payouts.length > 0 ? { payouts: payouts.map(toTipPayoutResponse) } : {}),
  })
}

/**
 * Every state transition below moves the Tip row and (for a split tip) all
 * of its TipPayout rows together, then publishes one feed event carrying
 * both. This helper keeps those three steps in lockstep so a split tip's
 * payouts can never drift out of sync with its parent tip's status.
 */
async function transition(
  tip: Tip,
  isSplit: boolean,
  applyToTip: () => Promise<Tip>,
  applyToPayouts: () => Promise<unknown>
): Promise<{ tip: Tip; payouts: TipPayout[] }> {
  const [updatedTip] = await Promise.all([
    applyToTip(),
    isSplit ? applyToPayouts() : Promise.resolve(),
  ])
  const payouts = isSplit ? await tipPayoutRepository.findByTipId(tip.id) : []
  publishTipEvent(updatedTip, payouts)
  return { tip: updatedTip, payouts }
}

interface PayoutDestination {
  destinationPublicKey: string
  amount: string
}

/** Resolves each payee's wallet, or returns null if any payee has none (the whole split can't be submitted). */
async function resolvePayoutDestinations(
  payouts: TipPayout[]
): Promise<PayoutDestination[] | null> {
  const destinations: PayoutDestination[] = []

  for (const payout of payouts) {
    const creator = await creatorService.findById(payout.creatorId)
    const wallet = creator ? await walletRepository.findByUserId(creator.userId) : null
    if (!wallet) {
      return null
    }
    destinations.push({ destinationPublicKey: wallet.publicKey, amount: payout.amount })
  }

  return destinations
}

async function submitToStellar(tip: Tip, initialPayouts: TipPayout[]): Promise<Tip> {
  const isSplit = initialPayouts.length > 0
  const fanWallet = await walletRepository.findByUserId(tip.fanUserId)

  if (!fanWallet) {
    const { tip: failed } = await transition(
      tip,
      isSplit,
      () => tipRepository.markFailed(tip.id, "Sender has no wallet", tip.attempts),
      () => tipPayoutRepository.markFailedForTip(tip.id, "Sender has no wallet")
    )
    return failed
  }

  const singleCreator = isSplit ? null : await creatorService.findById(tip.creatorId)
  const singleWallet =
    !isSplit && singleCreator ? await walletRepository.findByUserId(singleCreator.userId) : null
  const destinations = isSplit ? await resolvePayoutDestinations(initialPayouts) : null

  if (isSplit && !destinations) {
    const reason = "One or more payees has no wallet"
    const { tip: failed } = await transition(
      tip,
      isSplit,
      () => tipRepository.markFailed(tip.id, reason, tip.attempts),
      () => tipPayoutRepository.markFailedForTip(tip.id, reason)
    )
    return failed
  }

  if (!isSplit && !singleWallet) {
    const { tip: failed } = await transition(
      tip,
      isSplit,
      () => tipRepository.markFailed(tip.id, "Creator has no wallet", tip.attempts),
      () => Promise.resolve()
    )
    return failed
  }

  await transition(
    tip,
    isSplit,
    () => tipRepository.updateStatus(tip.id, "submitted"),
    () => tipPayoutRepository.updateStatusForTip(tip.id, "submitted")
  )

  const sourceSecretKey = await decryptSecret(fanWallet)

  let attempts = tip.attempts
  let lastError: unknown

  while (attempts < MAX_SUBMISSION_ATTEMPTS) {
    attempts += 1

    try {
      const result = destinations
        ? await stellarClient.submitSplitPayment({ sourceSecretKey, payments: destinations })
        : await stellarClient.submitPayment({
            sourceSecretKey,
            destinationPublicKey: singleWallet!.publicKey,
            amount: tip.amount,
          })

      const { tip: confirmed } = await transition(
        tip,
        isSplit,
        () => tipRepository.markConfirmed(tip.id, result.hash, attempts),
        () => tipPayoutRepository.markConfirmedForTip(tip.id, result.hash)
      )
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

  const reason = errorMessage(lastError)
  const { tip: failed } = await transition(
    tip,
    isSplit,
    () => tipRepository.markFailed(tip.id, reason, attempts),
    () => tipPayoutRepository.markFailedForTip(tip.id, reason)
  )
  return failed
}

export const tipService = {
  async submitTip(input: CreateTipInput): Promise<TipResponse> {
    const existing = await tipRepository.findByIdempotencyKey(
      input.fanUserId,
      input.idempotencyKey
    )

    if (existing) {
      const payouts = await tipPayoutRepository.findByTipId(existing.id)
      return toTipResponse(existing, payouts)
    }

    const creator = await creatorService.findById(input.creatorId)
    if (!creator) {
      throw new AppError(404, "CREATOR_NOT_FOUND", "Creator profile not found")
    }

    let payoutConfig = null
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
      payoutConfig = await streamPayoutConfigService.findByStreamId(input.streamId)
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
          const payouts = await tipPayoutRepository.findByTipId(winner.id)
          return toTipResponse(winner, payouts)
        }
      }
      throw error
    }

    let payouts: TipPayout[] = []
    if (payoutConfig) {
      const shares = splitAmount(
        tip.amount,
        payoutConfig.payees.map((payee) => ({
          creatorId: payee.creatorId,
          percentage: payee.percentage,
        }))
      )
      payouts = await tipPayoutRepository.createMany(
        shares.map((share) => ({
          tipId: tip.id,
          creatorId: share.creatorId,
          percentage: share.percentage,
          amount: share.amount,
        }))
      )
    }

    publishTipEvent(tip, payouts)

    const finalTip = await submitToStellar(tip, payouts)
    const finalPayouts = await tipPayoutRepository.findByTipId(tip.id)
    return toTipResponse(finalTip, finalPayouts)
  },
}
