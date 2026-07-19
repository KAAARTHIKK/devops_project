# 04 — API Design

## Goal
Specify every endpoint — request, response, errors, status codes — before implementation.

## Background
Two audiences: **admin** endpoints (protected by `ADMIN_TOKEN`, for issuing/managing keys and
reading analytics) and **gateway** endpoints (protected by `x-api-key`, rate-limited). Health
endpoints are public.

## Conventions
- JSON in/out. Errors: `{ "error": { "code": "STRING", "message": "..." }, "requestId": "..." }`.
- Auth header for gateway routes: `x-api-key: <secret>`.
- Auth header for admin routes: `Authorization: Bearer <ADMIN_TOKEN>`.
- Rate-limit headers on gateway responses: `X-RateLimit-Limit`, `X-RateLimit-Remaining`,
  `X-RateLimit-Reset`; on 429 also `Retry-After` (seconds).

---

## Health

### GET /health  (liveness) — public
`200` `{ "status": "ok", "uptime": 1234.5 }`

### GET /health/ready  (readiness) — public
- `200` `{ "status": "ready", "redis": "up" }` when Redis PINGs.
- `503` `{ "status": "not_ready", "redis": "down" }` when Redis is unreachable.

---

## Admin — API Keys  (Bearer ADMIN_TOKEN)

### POST /admin/keys
Create a key. **Secret is returned once and never again.**
Request:
```json
{ "name": "mobile-app", "rateLimit": { "capacity": 100, "refillPerSec": 10 } }
```
`201`:
```json
{
  "id": "key_9f3a...",
  "name": "mobile-app",
  "apiKey": "sk_live_3b8e0c...ONLY_SHOWN_NOW",
  "rateLimit": { "capacity": 100, "refillPerSec": 10 },
  "createdAt": "2026-07-18T10:00:00.000Z",
  "status": "active"
}
```
Errors: `400 VALIDATION_ERROR` (bad body), `401 UNAUTHORIZED` (bad admin token).

### GET /admin/keys/:id
`200` metadata (no secret, no hash):
```json
{ "id": "key_9f3a...", "name": "mobile-app", "status": "active",
  "rateLimit": { "capacity": 100, "refillPerSec": 10 },
  "createdAt": "2026-07-18T10:00:00.000Z" }
```
Errors: `404 KEY_NOT_FOUND`, `401 UNAUTHORIZED`.

### GET /admin/keys
`200` `{ "keys": [ { ...metadata } ], "count": 3 }`

### DELETE /admin/keys/:id  (revoke)
`200` `{ "id": "key_9f3a...", "status": "revoked" }`
Errors: `404 KEY_NOT_FOUND`, `401 UNAUTHORIZED`.

---

## Admin — Analytics  (Bearer ADMIN_TOKEN)

### GET /admin/analytics/:id
`200`:
```json
{
  "id": "key_9f3a...",
  "totals": { "requests": 5231, "allowed": 5100, "rateLimited": 131 },
  "byStatusClass": { "2xx": 5000, "4xx": 200, "5xx": 31 },
  "lastSeenAt": "2026-07-18T10:05:12.000Z"
}
```
Errors: `404 KEY_NOT_FOUND`, `401 UNAUTHORIZED`.

---

## Gateway — Protected Sample  (x-api-key, rate-limited)

### GET /v1/ping
Demonstrates the full auth + rate-limit + usage pipeline.
`200`:
```json
{ "message": "pong", "keyId": "key_9f3a...", "requestId": "..." }
```
Response headers include `X-RateLimit-Limit/Remaining/Reset`.

Errors:
- `401 MISSING_API_KEY` — no `x-api-key`.
- `401 INVALID_API_KEY` — key not found.
- `403 KEY_REVOKED` — key exists but revoked.
- `429 RATE_LIMITED` — bucket empty; body `{ "error": {...}, "retryAfter": 3 }` + `Retry-After: 3`.

### GET /v1/echo?msg=hello
`200` `{ "echo": "hello", "keyId": "..." }` — second protected route to show the middleware
is reusable across a router, not hardcoded to one path.

---

## Status Code Summary
| Code | Meaning in this API |
|------|---------------------|
| 200  | success |
| 201  | key created |
| 400  | validation error |
| 401  | missing/invalid credential |
| 403  | revoked key |
| 404  | key not found |
| 429  | rate limit exceeded |
| 503  | not ready (Redis down) |
| 500  | unhandled (via errorHandler) |

## Deliverables
- Full endpoint contract for admin, analytics, gateway, health.

## Dependencies
- `02_NEW_ARCHITECTURE.md`.

## Acceptance Criteria
- Every endpoint lists success + all error responses with codes.
- Secret key material appears only in the `POST /admin/keys` 201 response.
