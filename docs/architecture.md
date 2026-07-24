# Architecture

## Monorepo layout

Chordially is a pnpm + Turborepo workspace.

```txt
chordially/
├── apps/
│   ├── api/      @chordially/api    – Express modular monolith
│   ├── web/      @chordially/web    – Next.js web app
│   └── mobile/   @chordially/mobile – React Native / Expo app
│
├── packages/
│   ├── shared/   @chordially/shared – shared types and zod validation schemas
│   └── stellar/  @chordially/stellar – Stellar SDK / Horizon wallet client
│
├── .github/workflows/  – per-package CI
└── docs/                – this documentation
```

`packages/shared` is consumed directly from its TypeScript source (no build
step required) by both `apps/api` and `apps/web` via workspace dependencies.

## Backend: modular monolith

`apps/api` is an Express app organized as a **modular monolith**. Each domain
lives in its own module under `src/modules/<domain>/`, with a consistent
internal structure:

```txt
src/modules/<domain>/
├── controllers/   – request/response handling, calls into services
├── services/       – business logic
├── repositories/    – persistence (Prisma) – only where the module owns data
├── validators/      – request validation (zod schemas)
├── routes/           – Express routers
├── types/            – module-local types and DTOs
└── tests/            – module tests (vitest + supertest)
```

Cross-cutting concerns live under `src/shared/`:

```txt
src/shared/
├── config/      – environment loading and validation (zod)
├── database/     – Prisma client singleton
├── errors/        – AppError and other error types
├── logger/         – application logger
├── middleware/      – Express middleware (auth, error handling)
└── types/            – global type augmentations (e.g. Express Request)
```

### Current modules

- **`modules/auth`** – registration and login (`POST /api/auth/register`,
  `POST /api/auth/login`). Issues JWTs and validates credentials.
- **`modules/users`** – owns the `User` persistence layer (Prisma
  repository + service) that `modules/auth` depends on.
- **`modules/creators`** – creator profile persistence and routes
  (`POST /api/creators`, `GET /api/creators/:slug`, etc.).
- **`modules/fans`** – owns the fan profile persistence layer, consumed by
  `modules/users` (no dedicated routes of its own).
- **`modules/wallet`** – provisions a custodial Stellar wallet for every user
  at signup and exposes `GET /api/wallet/me`. See "Wallet: modules/wallet"
  below.

### Adding a new module

1. Create `src/modules/<domain>/` with the structure above (only add the
   subdirectories the module actually needs — e.g. a module with no
   persistence of its own can omit `repositories/`).
2. Define request/response types in `types/` and validation schemas in
   `validators/` (reuse `@chordially/shared` schemas where the same shape is
   used by the frontend).
3. Implement business logic in `services/`, calling into other modules'
   services (not their repositories) for cross-module data access.
4. Wire up `routes/` and mount the router in `src/app.ts`.
5. Add tests under `tests/` following the existing auth module tests as a
   template.

## Frontend: apps/web

`apps/web` is a Next.js (App Router) app. Routes that need authentication
state read from `AuthProvider` / `useAuth` (`lib/auth-context.tsx`), and API
calls go through `lib/auth-client.ts`. Form inputs are validated client-side
using the same zod schemas (`@chordially/shared`) that the API uses
server-side.

## Mobile: apps/mobile

`apps/mobile` is a React Native (Expo) + TypeScript foundation. The `src/`
directory is pre-structured for future feature work
(`components/`, `screens/`, `navigation/`, `hooks/`, `services/`, `utils/`,
`assets/`). `CreatorProfileScreen` and `ProfileImagePicker` exist as
early building blocks with their own tests, but are not yet mounted by
`App.tsx` — there is no navigation setup or authentication flow yet.

## Stellar: packages/stellar

`packages/stellar` wraps the Stellar SDK's Horizon client behind a
`StellarPaymentClient` interface (`HorizonStellarClient`). It exposes:

- `generateKeypair()` – local keypair generation, no network call.
- `getAccount()` / `getNativeBalance()` – reads account state and XLM
  balance from Horizon.
- `fundTestnetAccount()` – funds a new account via Friendbot (testnet only).
- `isAccountNotFoundError()` – lets callers distinguish "account not yet on
  the ledger" from other Horizon errors.

Future payment/tipping features should build on this client rather than
calling the Stellar SDK directly, so wallet logic stays reusable and
isolated from module-specific business logic.

## Wallet: modules/wallet

Every user gets a custodial Stellar wallet created automatically during
`authService.register` (`apps/api/src/modules/auth/services/auth.service.ts`):

1. A keypair is generated via `@chordially/stellar`.
2. The secret key is envelope-encrypted
   (`modules/wallet/services/wallet-crypto.service.ts`): AWS KMS mints a
   one-time AES-256 data key, the secret is encrypted locally with it, and
   only the ciphertext plus the KMS-wrapped data key are persisted — the
   plaintext secret and plaintext data key never touch disk. Decrypting the
   secret always requires a round trip to KMS.
3. On testnet, the new account is funded via Friendbot. This is best-effort:
   a Friendbot outage is logged but does not fail signup, since it's a
   testnet convenience faucet rather than part of account custody.

`GET /api/wallet/me` (requires auth) returns the caller's `publicKey`,
`network`, and current native `balance` (read live from Horizon; an account
that isn't on the ledger yet reports a balance of `"0"` instead of erroring).

Relevant env vars (`apps/api/.env.example`): `AWS_KMS_KEY_ID`,
`STELLAR_NETWORK`, `STELLAR_HORIZON_URL`, `STELLAR_FRIENDBOT_URL`.
