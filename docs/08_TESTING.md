# 08 — Testing

## Goal
Plan unit, middleware, Redis-integration, concurrency, and rate-limit tests, and make
`npm test` a **real** pass/fail gate the Jenkins pipeline can rely on.

## Background
Today `package.json` `test` = `exit 1` and the Jenkinsfile masks it with `|| echo`. The new
suite makes the existing "Run Tests" stage meaningful without changing the stage itself.

## Tooling
- **Jest** (or Node's built-in `node --test`). Jest chosen for mocking + coverage ergonomics.
- **supertest** for HTTP-level assertions against `src/app.js` (exported without `listen`).
- **ioredis-mock** for fast unit tests; a **real Redis** (via compose) for integration.

## Test Layers

### Unit — `tests/unit/`
- `apiKeyService.test.js`: key generation format, hash stored (not plaintext), revoke sets
  status, get returns metadata without secret.
- `tokenBucket.test.js`: refill math (elapsed → tokens), cap at capacity, deny at 0.

### Middleware — `tests/middleware/`
- `auth.test.js`: 401 no header, 401 unknown key, 403 revoked, pass-through attaches
  `req.apiKey`. Uses mocked service.
- `rateLimit.test.js`: allows within capacity, sets `X-RateLimit-*` headers, 429 + `Retry-After`
  when empty (mocked bucket result).

### Integration — `tests/integration/` (requires Redis)
- `redis.test.js`: real client connects, key create → lookup → revoke round-trips through Redis.
- `rateLimit.concurrency.test.js`: **the headline test.** Configure capacity=N; fire N+K
  concurrent requests with the same key via `Promise.all`; assert exactly N allowed (200) and
  K denied (429). Proves the Lua script is atomic.

## Concurrency Test Detail
```
capacity = 20, refillPerSec = 0 (no refill during the burst)
send 50 concurrent GET /v1/ping with the same key
assert: count(200) === 20 && count(429) === 30
```
If the limiter were non-atomic, you'd see >20 allowed — the test would fail.

## Redis Availability in CI
- Unit + middleware tests: no Redis needed (mocked) → always run in Jenkins.
- Integration tests: guarded by `REDIS_URL`. If absent, `describe.skip` with a logged notice
  so the pipeline stays green on a Jenkins agent without Redis, and runs fully in compose/local.
- Recommended: run integration locally / in compose; keep the Jenkins gate on unit+middleware
  unless a Redis service container is added to the agent (see `10`).

## Scripts (`package.json`)
```json
"scripts": {
  "start": "node src/server.js",
  "dev": "node src/server.js",
  "test": "jest --runInBand",
  "test:unit": "jest tests/unit tests/middleware",
  "test:integration": "jest tests/integration --runInBand"
}
```
`--runInBand` avoids parallel workers fighting over the same Redis keys.

## Coverage Target
- ≥70% lines on `services/` and `middleware/` (the logic that matters). Don't chase 100%.

## Deliverables
- Layered test plan, concurrency test spec, CI-safe Redis strategy, scripts.

## Dependencies
- `05`, `06`, `07`.

## Acceptance Criteria
- `npm test` exits non-zero on any real failure (no `|| echo` masking inside npm).
- Concurrency test proves atomic limiting (exactly capacity allowed).
- Unit+middleware tests run without a live Redis.
