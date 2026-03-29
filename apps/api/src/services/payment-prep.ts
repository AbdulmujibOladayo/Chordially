import crypto from "node:crypto";

export interface PreparedPayment {
  id: string;
  amount: string;
  asset: "XLM" | "USDC";
  destination: string;
  network: "testnet";
  status: "ready";
  memo: string;
}

export function preparePayment(input: {
  amount: string;
  asset: "XLM" | "USDC";
  destination: string;
}) {
  return {
    id: crypto.randomUUID(),
    amount: input.amount,
    asset: input.asset,
    destination: input.destination,
    network: "testnet",
    status: "ready",
    memo: `tip:${input.destination.slice(0, 6)}`
  } satisfies PreparedPayment;
}
