# Demo: Payment Reliability & Reconciliation (Stellar Testnet)

This is the end-to-end demo required by "Payment Reliability &
Reconciliation." It runs against **real** Stellar Testnet infrastructure
(Horizon + Friendbot) rather than mocks, and covers the full chain:

1. **Signup** — registers a fan and two creators (`POST /api/auth/register`).
2. **Wallet provisioning** — registration itself generates a real Stellar
   keypair per user and funds it via Friendbot (see
   [`architecture.md`](./architecture.md#wallet-moduleswallet)).
3. **Live tip** — the fan tips the host creator through a stream
   (`POST /api/tips` with a `streamId`).
4. **Split payment** — the host configures a 60/40 payout split with a
   co-host (`PUT /api/streams/:id/payout-config`), then the fan tips again;
   the payment is submitted as one atomic multi-operation transaction (see
   [`split-payments-design.md`](./split-payments-design.md)).
5. **Ledger confirmation** — verified independently of our own database: the
   test reads each recipient's balance directly from Horizon before and
   after each tip and asserts it moved by the expected amount.
6. **Reconciliation** — the test manufactures the exact failure mode
   reconciliation exists for: it submits a real payment directly (bypassing
   the app, simulating a worker crash right after Horizon accepted the
   transaction but before the local DB write landed), inserts a `Tip` row
   stuck in `submitted`, then runs `reconciliationService.run()` and asserts
   it finds the real on-chain transaction and confirms the tip with the
   correct hash.

## Running it

```sh
cd apps/api
pnpm test:e2e:testnet
```

This is a separate command from `pnpm test` on purpose: it needs outbound
network access to `horizon-testnet.stellar.org` and `friendbot.stellar.org`,
and it waits on real ledger close times (a few seconds per transaction), so
a full run takes roughly 30–60 seconds. It is excluded from the normal test
run (`apps/api/vitest.config.ts` excludes `e2e/**`; `apps/api/e2e/` has its
own `vitest.e2e.config.ts` and `e2e/setup.ts`).

Everything talks to the real `HorizonStellarClient` — nothing Stellar-related
is mocked. The one thing that *is* faked is AWS KMS (`e2e/setup.ts` mocks the
same envelope-encryption module the unit tests mock), since this environment
has no real AWS credentials; that's purely an app-side encryption detail with
no bearing on what happens on-chain, and every wallet secret it "encrypts" is
still a real Stellar secret key used for real signing.

## What a passing run demonstrates

- A brand-new user can sign up and immediately have a funded Testnet account
  with no manual steps.
- A tip submitted through the API is confirmed on the real ledger within a
  single request/response cycle.
- A multi-performer split is a single atomic transaction — both payees'
  balances move together, from one signature.
- Reconciliation can recover a payment that truly landed on-chain when the
  local process never got to record it — the specific failure mode this
  issue is about — without needing to fake Horizon's behavior.

## Observability while running the demo

`GET /api/metrics` (see [`architecture.md`](./architecture.md#observability-reconciliation--dead-letter-recovery-modulesreconciliation--modulestips))
returns the counters and latency histograms recorded during the run:
`tip_confirmed_total`, `tip_submission_latency_ms`,
`tip_confirmation_latency_ms`, `tip_retry_total`,
`reconciliation_runs_total`, `reconciliation_repaired_total`, and
`reconciliation_deadlettered_total`. Structured JSON logs are printed to
stdout for every tip finalization and every reconciliation run/outcome.
