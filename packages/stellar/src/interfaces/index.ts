import type {
  StellarAccount,
  StellarAccountReference,
  StellarKeypair,
  StellarPaymentInput,
  StellarPaymentResult,
} from '../types/index.js'

export interface StellarPaymentClient {
  /** Generates a new Stellar keypair. Does not touch the network. */
  generateKeypair(): StellarKeypair

  /** Fetches an account's current state (sequence number, balances) from Horizon. */
  getAccount(reference: StellarAccountReference): Promise<StellarAccount>

  /** Convenience helper returning the native XLM balance as a string, e.g. "0.0000000". */
  getNativeBalance(reference: StellarAccountReference): Promise<string>

  /** Funds a testnet account via Friendbot. Only valid on the testnet network. */
  fundTestnetAccount(reference: StellarAccountReference): Promise<void>

  /** True if the given error means the account doesn't exist on the ledger yet. */
  isAccountNotFoundError(error: unknown): boolean

  /**
   * Builds, signs, and submits a native XLM payment. Horizon's submit
   * endpoint blocks until the transaction has been applied to a ledger, so a
   * resolved promise means the payment is already confirmed.
   */
  submitPayment(input: StellarPaymentInput): Promise<StellarPaymentResult>

  /**
   * True if a submission failure is transient and safe to retry (timeouts,
   * network errors, stale sequence numbers). False for failures that will
   * never succeed on retry (insufficient balance, malformed transaction,
   * unknown destination, etc).
   */
  isTransientSubmissionError(error: unknown): boolean
}
