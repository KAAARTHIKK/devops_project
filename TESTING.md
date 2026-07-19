# Testing Guide

## Automated Tests

```bash
npm test                # jest --runInBand — unit + middleware always run;
                         # integration tests skip gracefully without a REDIS_URL
npm run test:unit        # unit + middleware only, no Redis required
npm run test:integration # requires a real Redis (REDIS_URL) — includes the
                          # rate-limit concurrency ("headline") test
```

Test layout:
- `tests/unit/` — `apiKeyService`, `tokenBucket` (Lua script), mocked via `ioredis-mock`
- `tests/middleware/` — `auth`, `rateLimit`, mocked collaborators
- `tests/integration/` — real Redis: key lifecycle round-trip, and the concurrency test that
  proves the token-bucket Lua script is atomic under a concurrent burst

See [`docs/08_TESTING.md`](docs/08_TESTING.md) for the full test plan and rationale.

## Manual Smoke Test

```bash
docker compose up --build   # app + redis
curl -s localhost:3000/health           # {"status":"ok",...}
curl -s localhost:3000/health/ready     # {"status":"ready","redis":"up"}

# issue a key
KEY=$(curl -s -X POST localhost:3000/admin/keys \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"smoke","rateLimit":{"capacity":5,"refillPerSec":1}}' | jq -r .apiKey)

# call a protected route
curl -s localhost:3000/v1/ping -H "x-api-key: $KEY"       # {"message":"pong",...}

# check analytics
curl -s localhost:3000/admin/analytics/<key-id> -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Error Cases to Check Manually

| Request | Expected |
|---------|----------|
| `GET /v1/ping` with no `x-api-key` | `401 MISSING_API_KEY` |
| `GET /v1/ping` with a bogus key | `401 INVALID_API_KEY` |
| `GET /v1/ping` with a revoked key | `403 KEY_REVOKED` |
| Requests beyond a key's `capacity` | `429 RATE_LIMITED` + `Retry-After` header |
| Admin routes with a wrong/missing bearer token | `401 UNAUTHORIZED` |
| `GET /admin/keys/:id` for an unknown id | `404 KEY_NOT_FOUND` |

Full endpoint contract: [`docs/04_API_DESIGN.md`](docs/04_API_DESIGN.md).
Setup and troubleshooting: [`application/README.md`](application/README.md).
