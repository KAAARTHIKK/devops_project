# 06 — Authentication & Auth Middleware

## Goal
Plan API-key generation, hashing/storage, the validation middleware, and secrets/env
management so keys are never stored or logged in plaintext.

## Background
Two auth mechanisms: **admin** (static `ADMIN_TOKEN` bearer, for management endpoints) and
**API key** (`x-api-key`, for gateway endpoints). Only the API-key path is dynamic.

## API Key Generation
- Format: `sk_live_<32+ random bytes, base62/hex>`. Use `crypto.randomBytes(32)`.
- A separate `id` (`key_<random>`) identifies the key in URLs/logs — never the secret.
- Secret is returned **once** at creation and never retrievable again.

## Hashing & Storage
- Store `sha256(secret)` (hex) — fast deterministic hash is acceptable here because the
  secret is high-entropy (32 random bytes), so brute force is infeasible; bcrypt is
  unnecessary and too slow for per-request auth. Document this reasoning.
- Optionally add a static app-level pepper via `API_KEY_SALT` env, concatenated before
  hashing, so a Redis dump alone can't be checked against precomputed tables.
- Redis: `apikey:{id}` hash holds `hash`, metadata; `apikey:lookup:{sha256}` → `{id}` for
  O(1) reverse lookup during auth. Plaintext secret is never persisted.

## Validation Middleware (`middleware/auth.js`)
```
1. read x-api-key; if absent → 401 MISSING_API_KEY
2. compute sha256 (with pepper); GET apikey:lookup:{hash}
3. if no id → 401 INVALID_API_KEY
4. HGETALL apikey:{id}; if status==revoked → 403 KEY_REVOKED
5. attach req.apiKey = { id, name, capacity, refillPerSec }; next()
```
- Never log the raw key; log only `req.apiKey.id`.
- Use `crypto.timingSafeEqual` when comparing the admin bearer token to avoid timing leaks.

## Admin Auth (`Authorization: Bearer <ADMIN_TOKEN>`)
- Single shared secret from env for this course-scale project.
- Middleware guards all `/admin/*` routes; 401 on mismatch.
- Rotate by changing the env var and redeploying.

## Secrets Management / Env Vars
| Var | Purpose | Required | Example |
|-----|---------|----------|---------|
| `ADMIN_TOKEN` | admin endpoint bearer | yes | long random string |
| `API_KEY_SALT` | pepper for key hashing | recommended | random string |
| `REDIS_URL` | redis connection | yes | `redis://redis:6379` |
| `PORT` | listen port | no (default 3000) | `3000` |
| `LOG_LEVEL` | pino level | no (default info) | `info` |
| `RATE_LIMIT_ENABLED` | feature flag | no (default true) | `true` |
| `RATE_LIMIT_FAIL_OPEN` | policy on Redis down | no (default false) | `false` |

- `.env` is gitignored (already). `.env.example` documents all vars with placeholder values.
- On EC2, env vars are passed via `docker run -e` / compose `environment:` (see `11`).
- Never bake secrets into the image or commit them.

## Deliverables
- Key lifecycle, hashing rationale, middleware logic, env/secrets table.

## Dependencies
- `04_API_DESIGN.md`, `05_REDIS_AND_RATE_LIMITING.md`.

## Acceptance Criteria
- No endpoint returns a stored secret after creation.
- No log line contains a raw key or the admin token.
- Auth middleware distinguishes 401 (missing/invalid) vs 403 (revoked) correctly.
