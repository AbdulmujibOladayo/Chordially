# Environment Registry

This document is the source of truth for runtime configuration across Chordially applications.

## API

| Variable | Required | Example | Owner | Notes |
| --- | --- | --- | --- | --- |
| `NODE_ENV` | yes | `development` | backend | One of `development`, `test`, `production` |
| `PORT` | yes | `3001` | backend | HTTP listen port |
| `DATABASE_URL` | yes | `postgresql://postgres:postgres@localhost:5432/chordially?schema=public` | backend | Current branch uses Postgres for local persistence |
| `STELLAR_NETWORK` | yes | `testnet` | blockchain | One of `testnet`, `mainnet` |
| `STELLAR_HORIZON_URL` | yes | `https://horizon-testnet.stellar.org` | blockchain | Horizon endpoint for the configured network |
| `SESSION_SECRET` | yes | `change-me-for-local-dev` | backend | Minimum length enforced in the API env validator |
| `ALLOWED_ORIGINS` | no | `http://localhost:3000` | backend | Comma-separated CORS allowlist for browser clients |
| `DEMO_MODE` | no | `false` | backend | Enables mock payment fallback behavior |

## Web

| Variable | Required | Example | Owner | Notes |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | yes | `http://localhost:3001` | web | Base URL for API requests |
| `NEXT_PUBLIC_APP_ENV` | yes | `development` | web | Environment label exposed to the client |

## Mobile

| Variable | Required | Example | Owner | Notes |
| --- | --- | --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | yes | `http://localhost:3001` | mobile | Base URL for API requests |
| `EXPO_PUBLIC_APP_ENV` | yes | `development` | mobile | Environment label exposed to the client |

## Update Policy

- Add new variables here in the same change that introduces them.
- Update the relevant `.env.example` file in the same pull request.
- Document whether the variable is local-only, preview-only, or required in production.
- Treat undocumented environment changes as incomplete work.
