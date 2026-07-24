import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  NetworkError,
  Networks,
  NotFoundError,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk'
import type { StellarPaymentClient } from './interfaces/index.js'
import type {
  StellarAccount,
  StellarAccountReference,
  StellarKeypair,
  StellarNetworkConfig,
  StellarPaymentInput,
  StellarPaymentResult,
} from './types/index.js'

const NATIVE_ASSET_TYPES = new Set(['native'])

const TRANSIENT_TRANSACTION_RESULT_CODES = new Set([
  'tx_bad_seq',
  'tx_too_late',
  'tx_insufficient_fee',
])

function networkPassphrase(network: StellarNetworkConfig['network']): string {
  return network === 'public' ? Networks.PUBLIC : Networks.TESTNET
}

function transactionResultCode(error: unknown): string | undefined {
  if (!(error instanceof Error)) {
    return undefined
  }

  const response = (error as { response?: { data?: unknown } }).response
  const data = response?.data as
    | { extras?: { result_codes?: { transaction?: string } } }
    | undefined

  return data?.extras?.result_codes?.transaction
}

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

  async submitPayment(input: StellarPaymentInput): Promise<StellarPaymentResult> {
    const sourceKeypair = Keypair.fromSecret(input.sourceSecretKey)
    const sourceAccount = await this.server.loadAccount(sourceKeypair.publicKey())

    const transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: networkPassphrase(this.config.network),
    })
      .addOperation(
        Operation.payment({
          destination: input.destinationPublicKey,
          asset: Asset.native(),
          amount: input.amount,
        })
      )
      .setTimeout(30)
      .build()

    transaction.sign(sourceKeypair)

    const result = await this.server.submitTransaction(transaction)

    return { hash: result.hash, ledger: result.ledger, successful: result.successful }
  }

  isTransientSubmissionError(error: unknown): boolean {
    if (error instanceof NetworkError) {
      const code = transactionResultCode(error)
      if (code) {
        return TRANSIENT_TRANSACTION_RESULT_CODES.has(code)
      }
      // A Horizon-side failure with no result code at all (e.g. a 5xx or a
      // connection-level failure surfaced through the SDK) is safe to retry.
      return true
    }

    return false
  }
}
