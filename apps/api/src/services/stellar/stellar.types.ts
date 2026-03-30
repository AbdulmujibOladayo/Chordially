export interface PrepareTipInput {
  amount: string;
  asset: "XLM" | "USDC";
  destination: string;
}

export interface PreparedTipIntent {
  id: string;
  network: "testnet";
  asset: "XLM" | "USDC";
  amount: string;
  destination: string;
  memo: string;
  submitMode: "manual";
  /** Present and true only when DEMO_MODE=true. Distinguishes mock from real records. */
  mock?: true;
}

export interface StellarService {
  prepareTipIntent(input: PrepareTipInput): PreparedTipIntent;
}
