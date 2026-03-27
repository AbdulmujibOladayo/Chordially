# API auth branch

This branch adds shared auth request and response contracts plus a standalone authentication flow.

## Endpoints

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/session`
- `GET /health`

## Notes

- Request body validation uses Zod-based middleware.
- Authentication uses an in-memory user store and signed bearer tokens so it remains merge-safe without a database branch.
