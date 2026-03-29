# Phase 1 API Reference

## Authentication

### `POST /auth/register`

Request body:

- `email`
- `username`
- `password`
- `role`

Response:

- `token`
- `user`

### `POST /auth/login`

Request body:

- `email`
- `password`

Response:

- `token`
- `user`

### `GET /auth/session`

Headers:

- `Authorization: Bearer <token>`

Response:

- `authenticated`
- `user`

## Profile

### `POST /profile`

Creates a demo profile record in local or in-memory implementations.

### `PATCH /profile/:id`

Updates an existing profile and should emit an audit event.

## Payments

### `POST /payments/prepare`

Request body:

- `amount`
- `asset`
- `destination`

Response:

- `id`
- `network`
- `asset`
- `amount`
- `destination`
- `memo`
- `submitMode`

## Audit

### `GET /audit`

Response:

- `items[]`
  - `id`
  - `actor`
  - `action`
  - `path`
  - `method`
  - `createdAt`
