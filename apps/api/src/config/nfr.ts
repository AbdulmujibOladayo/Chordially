/**
 * CHORD-016 — Non-Functional Requirements: Latency, Uptime & Transaction Reliability
 * Versioned budgets consumed by health checks, load tests, and alerting rules.
 */

export const NFR_VERSION = "1.0.0";

export interface LatencyBudget {
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
}

export interface UptimeBudget {
  targetPercent: number;   // e.g. 99.9
  maxMonthlyDowntimeMin: number;
}

export interface TxReliabilityBudget {
  confirmationMaxMs: number;
  maxRetries: number;
  successRatePercent: number;
}

export const LATENCY: Record<string, LatencyBudget> = {
  apiResponse:      { p50Ms: 80,   p95Ms: 200,  p99Ms: 500  },
  socketFanout:     { p50Ms: 50,   p95Ms: 120,  p99Ms: 300  },
  tipConfirmation:  { p50Ms: 3000, p95Ms: 6000, p99Ms: 10000 },
  pageLoad:         { p50Ms: 1500, p95Ms: 3000, p99Ms: 5000  },
};

export const UPTIME: UptimeBudget = {
  targetPercent: 99.9,
  maxMonthlyDowntimeMin: 43,
};

export const TX_RELIABILITY: TxReliabilityBudget = {
  confirmationMaxMs: 10_000,
  maxRetries: 3,
  successRatePercent: 99.5,
};

/** Validates a measured value against a named latency budget key and percentile. */
export function assertLatency(
  key: keyof typeof LATENCY,
  percentile: "p50Ms" | "p95Ms" | "p99Ms",
  measuredMs: number
): void {
  const budget = LATENCY[key];
  if (!budget) throw new Error(`Unknown latency key: ${key}`);
  if (measuredMs > budget[percentile]) {
    throw new Error(
      `Latency breach: ${key} ${percentile} ${measuredMs}ms > budget ${budget[percentile]}ms`
    );
  }
}
