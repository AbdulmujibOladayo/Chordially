import { env } from "../../../shared/config/env.js"
import { AppError } from "../../../shared/errors/app-error.js"
import { logger } from "../../../shared/logger/logger.js"
import { stellarClient } from "../../../shared/stellar/client.js"
import { walletRepository } from "../repositories/wallet.repository.js"
import type { Wallet, WalletMeResponse } from "../types/wallet.types.js"
import { encryptSecret } from "./wallet-crypto.service.js"

export const walletService = {
  async createWalletForUser(userId: string): Promise<Wallet> {
    const keypair = stellarClient.generateKeypair()
    const encrypted = await encryptSecret(keypair.secretKey)

    const wallet = await walletRepository.create({
      userId,
      publicKey: keypair.publicKey,
      network: env.STELLAR_NETWORK,
      ...encrypted,
    })

    // Friendbot is a testnet convenience faucet, not a core part of account
    // custody. If it's flaky or down we still want signup to succeed; the
    // account simply funds itself the first time someone sends it a payment.
    if (env.STELLAR_NETWORK === "testnet") {
      try {
        await stellarClient.fundTestnetAccount({ publicKey: keypair.publicKey })
      } catch (error) {
        logger.warn("Friendbot funding failed for new wallet", {
          userId,
          publicKey: keypair.publicKey,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return wallet
  },

  async getWalletForUser(userId: string): Promise<WalletMeResponse> {
    const wallet = await walletRepository.findByUserId(userId)

    if (!wallet) {
      throw new AppError(404, "WALLET_NOT_FOUND", "No wallet exists for this user")
    }

    let balance = "0"

    try {
      balance = await stellarClient.getNativeBalance({ publicKey: wallet.publicKey })
    } catch (error) {
      // The account may not exist on the ledger yet (e.g. Friendbot funding
      // failed or hasn't landed). Report a zero balance rather than erroring.
      if (!stellarClient.isAccountNotFoundError(error)) {
        throw error
      }
    }

    return { publicKey: wallet.publicKey, balance, network: wallet.network }
  },
}
