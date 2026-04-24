# API Standards

This document defines the baseline API versioning and error-envelope contract for Chordially.

## Versioning Strategy

- Chordially uses path-based versioning for externally consumed HTTP APIs.
- The initial stable base path is `/api/v1`.
- Existing unversioned phase scaffolding routes may remain temporarily during migration, but new public endpoints should be added under `/api/v1`.
- Backward-incompatible changes require a new versioned path such as `/api/v2`.

## Response Envelope

Successful responses may return plain resource payloads for now, but all error responses must conform to the standard error envelope below.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "field": "email"
    }
  },
  "meta": {
    "requestId": "req_123",
    "apiVersion": "v1"
  }
}
```

## Error Code Rules

- `code` must be a stable machine-readable identifier.
- `message` must be safe to log and safe to expose to clients.
- `details` is optional and should only contain structured debugging context, never secrets.
- `meta.requestId` should be propagated from request tracing middleware when available.
- `meta.apiVersion` should reflect the versioned route namespace.

## Baseline Error Codes

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `RATE_LIMITED`
- `INTERNAL_ERROR`
- `DEPENDENCY_ERROR`

## Migration Guidance

- When upgrading existing routes, preserve current success payloads unless there is a compelling consumer benefit in wrapping them.
- Normalize all new and migrated error paths to the shared envelope.
- Publish shared response shapes through `packages/types` so clients do not re-declare them inconsistently.
