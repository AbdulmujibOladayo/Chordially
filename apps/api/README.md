# API application skeleton

This branch adds a standalone Express application structure that can be merged even before the database layer.

## Available routes

- `GET /health`
- `GET /system/ready`

## Local setup

1. Copy `.env.example` to `.env`
2. Run `pnpm install` inside `apps/api`
3. Run `pnpm check:env`
4. Run `pnpm dev`

## Notes

- Environment validation fails fast on boot so missing configuration is caught immediately.
- The route/module layout is intentionally small and safe to extend in later issues without restructuring again.
