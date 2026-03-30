/**
 * #126 – Demo fallback: MockStellarService simulates a successful payment confirmation
 * without touching real testnet infrastructure.
 *
 * Enabled when DEMO_MODE=true. Records are tagged with mock:true so they are
 * distinguishable from real transactions in audit logs and API responses.
 */
import crypto from "node:crypto";
import type { PrepareTipInput, PreparedTipIntent, StellarService } from "./stellar.types.js";

export class MockStellarService implements StellarService {
  prepareTipIntent(input: PrepareTipInput): PreparedTipIntent & { mock: true } {
    return {
      id: crypto.randomUUID(),
      network: "testnet",
      asset: input.asset,
      amount: input.amount,
      destination: input.destination,
      memo: `demo:${input.destination.slice(0, 6)}`,
      submitMode: "manual",
      mock: true
    };
  }
}
