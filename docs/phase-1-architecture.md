# Phase 1 Architecture Reference

## Scope

This document defines the lowest-risk architecture for the Phase 1 MVP surface. It is written to support parallel work across web, API, admin, and future mobile branches.

## Bounded Areas

- Public web
  - landing page
  - discovery
  - session detail
- Artist web
  - onboarding
  - live session control
- Admin web
  - authentication entry
  - overview dashboard
- API
  - health
  - auth
  - profile
  - sessions
  - tips
  - audit

## Core Entities

- `User`
  - roles: fan, artist, admin
  - owns one profile
- `ArtistProfile`
  - public identity for a performer
  - referenced by sessions and tips
- `Session`
  - draft, live, ended lifecycle
  - connected to one artist
- `TipIntent`
  - client-created draft for payment preparation
  - becomes payment-ready in later phases
- `AuditEvent`
  - emitted for successful mutations
  - queried by admin surfaces

## Route Contract Baseline

### Web routes

- `/`
  - public landing
- `/discover`
  - public list of live or upcoming artists
- `/sessions/[slug]`
  - session detail and tip form
- `/profile`
  - user profile editing
- `/artist/onboarding`
  - artist setup
- `/artist/dashboard`
  - session controls
- `/admin/login`
  - admin entry
- `/admin`
  - admin overview

### API routes

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/session`
- `POST /profile`
- `PATCH /profile/:id`
- `POST /payments/prepare`
- `GET /audit`

## Integration Strategy

- Web branches should prefer local cookie-backed or in-memory data if a backend contract is not merged yet.
- API branches should prefer fake service implementations behind stable interfaces when external infrastructure is missing.
- Shared packages should publish request and response shapes, not framework-specific code.

## Sequence Notes

### Artist onboarding

1. User opens artist setup.
2. User enters stage name, slug, genres, and wallet.
3. Branch-local storage persists the draft immediately.
4. Later API integration swaps persistence without changing page shape.

### Session start

1. Artist dashboard edits a session draft.
2. User starts a session.
3. Session state flips to `live`.
4. Discovery and session detail branches consume the same stable fields.

### Tip intent

1. Fan opens session detail.
2. Fan submits amount, asset, and note.
3. Draft tip intent is stored.
4. Payment-preparation branches upgrade this flow to produce transaction payloads.

## Open Questions Deferred to Phase 2

- Wallet verification storage model
- Real Stellar transaction confirmation strategy
- Realtime delivery contract
- Admin moderation workflow specifics
