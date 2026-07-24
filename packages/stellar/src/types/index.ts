export interface StellarAccountReference {
  publicKey: string
}

export interface StellarNetworkConfig {
  network: 'testnet' | 'public'
  horizonUrl: string
  friendbotUrl?: string
}

export interface StellarKeypair {
  publicKey: string
  secretKey: string
}

export interface StellarAccountBalance {
  assetType: string
  assetCode?: string
  balance: string
}

export interface StellarAccount {
  publicKey: string
  sequence: string
  balances: StellarAccountBalance[]
}

export interface StellarPaymentInput {
  sourceSecretKey: string
  destinationPublicKey: string
  /** Decimal string amount of native XLM, e.g. "25" or "25.0000000". */
  amount: string
}

export interface StellarSplitPaymentDestination {
  destinationPublicKey: string
  /** Decimal string amount of native XLM, e.g. "25" or "25.0000000". */
  amount: string
}

export interface StellarSplitPaymentInput {
  sourceSecretKey: string
  /** One Payment operation per entry, submitted atomically in a single transaction. */
  payments: StellarSplitPaymentDestination[]
}

export interface StellarPaymentResult {
  hash: string
  ledger: number
  successful: boolean
}
