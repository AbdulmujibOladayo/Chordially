import { Horizon, Keypair, NotFoundError } from '@stellar/stellar-sdk'
import type { StellarPaymentClient } from './interfaces/index.js'
import type {
  StellarAccount,
  StellarAccountReference,
  StellarKeypair,
  StellarNetworkConfig,
} from './types/index.js'

const NATIVE_ASSET_TYPES = new Set(['native'])

export class HorizonStellarClient implements StellarPaymentClient {
  private readonly server: Horizon.Server
  private readonly config: StellarNetworkConfig

  constructor(config: StellarNetworkConfig) {
    this.config = config
    this.server = new Horizon.Server(config.horizonUrl)
  }

  generateKeypair(): StellarKeypair {
    const keypair = Keypair.random()
    return { publicKey: keypair.publicKey(), secretKey: keypair.secret() }
  }

  async getAccount(reference: StellarAccountReference): Promise<StellarAccount> {
    const account = await this.server.loadAccount(reference.publicKey)

    return {
      publicKey: account.accountId(),
      sequence: account.sequence,
      balances: account.balances.map((balance) => ({
        assetType: balance.asset_type,
        assetCode: 'asset_code' in balance ? balance.asset_code : undefined,
        balance: balance.balance,
      })),
    }
  }

  async getNativeBalance(reference: StellarAccountReference): Promise<string> {
    const account = await this.getAccount(reference)
    const native = account.balances.find((balance) => NATIVE_ASSET_TYPES.has(balance.assetType))
    return native?.balance ?? '0'
  }

  async fundTestnetAccount(reference: StellarAccountReference): Promise<void> {
    if (this.config.network !== 'testnet') {
      throw new Error('fundTestnetAccount can only be used on the testnet network')
    }

    if (!this.config.friendbotUrl) {
      throw new Error('friendbotUrl is not configured')
    }

    const response = await fetch(
      `${this.config.friendbotUrl}?addr=${encodeURIComponent(reference.publicKey)}`
    )

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Friendbot funding failed (${response.status}): ${body}`)
    }
  }

  isAccountNotFoundError(error: unknown): boolean {
    return error instanceof NotFoundError
  }
}
