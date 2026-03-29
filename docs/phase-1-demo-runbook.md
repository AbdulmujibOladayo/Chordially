# Phase 1 Demo Runbook

## Goal

Allow a contributor or judge to run a consistent story across landing, profile, artist, session, tip, and admin surfaces.

## Recommended Demo Path

1. Open the landing page.
2. Show user profile setup.
3. Switch to artist onboarding.
4. Show the artist dashboard and mark a session live.
5. Open the discovery feed and choose a session.
6. Create a tip intent from the session detail page.
7. Open the admin login and overview shell.

## Demo Personas

- Fan: Ada Listener
- Artist: Nova Chords
- Admin: Ops Lead

## Demo Talking Points

- The web surfaces are intentionally contract-first.
- Where infrastructure is not merged yet, local state preserves the user flow.
- The backend uses fake or local service seams so external dependencies do not block the hackathon pace.

## Expected Working States

- Public landing renders
- Profile setup persists locally
- Artist onboarding persists locally
- Session dashboard changes state
- Discovery shows seeded sessions
- Tip intent is captured as draft
- Admin overview is accessible after local login

## Known Gaps

- No real database-backed identity in all branches
- No real Stellar transaction submission in Phase 1
- No realtime delivery yet
