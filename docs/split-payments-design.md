# Split Payments for Multi-Performer Streams — Design

## Problem

A stream can involve multiple performers who agreed on a payout split ahead
of time (e.g. Alice 50%, Bob 30%, Carol 20%). A fan tipping that stream
should have their tip divided automatically according to that split, with no
extra step on the fan's side.

## Transaction strategy

### Option A — multiple payment operations in one Stellar transaction

The fan's account signs a single transaction containing one `Payment`
operation per payee. Stellar transactions are atomic: either every operation
applies, or none do.

**Pros**
- Atomic and immediate — there is no window where some payees are paid and
  others aren't, no intermediate custody step, and confirmation happens on
  the same timescale as a normal single-recipient tip.
- No new custody surface: the platform never holds fan or creator funds
  in an intermediate account.

**Cons**
- Transaction size limits — Stellar caps a transaction at 100 operations.
  Not a practical concern for the payout splits this issue targets (a
  handful of co-performers), but it does mean this approach doesn't scale to
  arbitrarily large payee lists.
- Slightly more complex transaction construction (N operations instead of
  1), and a failure is coarser-grained: if any single operation would fail
  (e.g. one payee's account doesn't exist), the whole transaction — and
  every payee's share — fails together.

### Option B — collection wallet + scheduled payout

The fan pays a single platform-controlled "collection" account for the full
tip amount. A separate scheduled job later reads the stream's payout config
and issues individual payments out of the collection wallet to each payee.

**Pros**
- Simpler per-transaction construction (every tip is still a plain
  single-recipient payment).
- Retryable per payee — since each payout is its own later transaction, one
  payee's payout can be retried or reattempted independently of the others.

**Cons**
- Delayed settlement — payees aren't paid until the scheduled job runs,
  which is a materially worse experience than the instant confirmation the
  rest of this platform's tipping flow provides.
- Requires the platform to custody fan funds off-chain (in the collection
  account) between the tip and the payout job running, which is an
  off-chain settlement / custody model — **explicitly out of scope** for
  this issue.

## Decision: Option A

We implement split payments as a single atomic multi-operation Stellar
transaction, for two reasons specific to this issue's scope:

1. Off-chain settlement (the collection-wallet holding period in Option B)
   is explicitly out of scope, which rules out Option B as designed.
2. The payout splits this issue targets are small (a handful of
   co-performers on one stream), well within Stellar's 100-operation
   transaction limit, so Option A's scaling ceiling isn't a real constraint
   here.

### Reconciling "atomic transaction" with "individual payee state"

The acceptance criteria ask for **each payee to have an individual payment
state** while the **overall transaction stays consistent**. With a single
atomic transaction, every payee's on-chain outcome is necessarily the same
(all succeed together, or all fail together) — that *is* the "overall
consistency." What "individual state" buys us here is bookkeeping and
display, not independent on-chain outcomes:

- A `TipPayout` row is created per payee per tip, snapshotting that payee's
  percentage and computed amount at the time the tip was submitted (so a
  later change to the stream's payout config never rewrites the meaning of
  a historical tip).
- Each `TipPayout` row carries its own `status`/`txHash`/`failureReason`,
  mirroring the parent tip's outcome. This is what the live feed reads to
  show each creator's share and status individually, and it's also the
  natural extension point if a future issue needs per-payee retry (e.g. a
  destination account disappearing) without redesigning the schema.

## Data model

```
StreamPayoutConfig        (one per Stream)
├── id
├── streamId (unique)
└── payees: StreamPayoutConfigPayee[]
      ├── creatorId
      └── percentage        (all payees for a config must sum to 100)

TipPayout                  (one per payee, per Tip — snapshotted at tip time)
├── id
├── tipId
├── creatorId
├── percentage              (snapshot from StreamPayoutConfig at tip time)
├── amount                  (this payee's computed share, decimal string)
├── status                  (pending -> submitted -> confirmed | failed)
├── txHash
└── failureReason
```

## Amount splitting

Given a tip amount and a set of payee percentages (summing to 100), each
payee's share is `amount * percentage / 100`, rounded down to Stellar's
7-decimal precision. Rounding can leave a small remainder (a few stroops)
unassigned; that remainder is added to the first payee (by insertion order)
so the payouts always sum to exactly the tip amount — no dust is lost and no
more than the tip amount is ever paid out.

## Execution flow

1. `POST /api/tips` is submitted with a `streamId`. If that stream has a
   `StreamPayoutConfig`, the tip is a split tip.
2. The service computes each payee's amount, creates the `Tip` row and one
   `TipPayout` row per payee (status `pending`), and publishes a `pending`
   feed event carrying the payout breakdown.
3. It builds one Stellar transaction with one `Payment` operation per payee
   destination, signs it with the fan's key, and submits it — the same
   retry policy (transient vs. permanent failures) from the single-recipient
   tip flow applies to the whole transaction.
4. On success, the `Tip` and every `TipPayout` row move to `confirmed` with
   the shared transaction hash; on failure, they all move to `failed` with
   the same failure reason. Each transition publishes a feed event with the
   full payout breakdown, so viewers see every creator's share update in
   lockstep.

## Out of scope (per the issue)

- Tax handling, currency conversion, and off-chain settlement are not
  addressed here. In particular, "off-chain settlement" ruled out Option B
  above.
