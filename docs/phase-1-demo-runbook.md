# Phase 1 Demo Runbook

## Goal

Allow a contributor or judge to run a consistent story across landing, profile, artist, session, tip, and admin surfaces.

## Quick Start (Judges)

Navigate to `/demo` for the interactive demo guide — it lists all personas, credentials, and a step-by-step script.

## Demo Mode (Backup / Fallback)

If testnet is unstable, set `DEMO_MODE=true` in `apps/api/.env` and `apps/web/.env.local`.

- Payments are simulated via `MockStellarService` — no network calls are made.
- Mock records are tagged `mock: true` in API responses and are distinguishable from real records.
- A yellow banner appears on session and demo pages to clearly indicate mock mode.

## Recommended Demo Path

1. Open `/demo` — review personas and script.
2. Log in as **ops_lead** → `/admin` — platform overview metrics.
3. Log in as **ada_listener** → `/discover` — browse live sessions.
4. Open **Nova Chords** session → `/sessions/nova-chords` — submit a tip intent.
5. Switch to **nova_chords** → `/artist/dashboard` — see live session status.
6. Back to **ops_lead** → `/admin/bellabuks/users` — user management table.
7. Open `/admin/bellabuks/audit` — filter audit trail by actor.

## Demo Personas

| Role   | Username       | Email                        | Password   |
|--------|----------------|------------------------------|------------|
| Fan    | ada_listener   | ada@demo.chordially.io       | demo1234   |
| Artist | nova_chords    | nova@demo.chordially.io      | demo1234   |
| Admin  | ops_lead       | ops@demo.chordially.io       | demo1234   |

## Security Notes (Issue #127)

- CORS is restricted to `ALLOWED_ORIGINS` (default: `http://localhost:3000`).
- Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) are applied on all responses.
- CSRF is mitigated via Origin/Referer header validation on state-mutating requests.
- Residual risks accepted for hackathon scope: in-memory session store, SHA-256 password hashing, no rate limiting.

## Expected Working States

- Public landing renders
- Profile setup persists locally
- Artist onboarding persists locally
- Session dashboard changes state
- Discovery shows seeded sessions
- Tip intent is captured as draft (or mock-confirmed in demo mode)
- Admin overview, users, sessions, and audit trail are accessible after local login

## Known Gaps

- No real database-backed identity in all branches
- No real Stellar transaction submission in Phase 1
- No realtime delivery yet

