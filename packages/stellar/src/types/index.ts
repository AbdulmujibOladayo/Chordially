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
