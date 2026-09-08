# 05 — Redis & Rate Limiting

## Goal
Specify the token-bucket algorithm, Redis schema, atomicity, expiration, and concurrency
handling so the rate limiter is correct under load.

## Background
Per-key rate limiting must be race-free. A naive GET-then-SET in Node is not atomic across
concurrent requests. We enforce the whole bucket update inside a single **Lua script**, which
Redis runs atomically.

## Token Bucket — concept
Each key has a bucket with:
- `capacity` — max tokens (burst size).
- `refillPerSec` — tokens added per second.
- `tokens` — current tokens (float).
- `lastRefill` — timestamp (ms) of last refill.

On each request: refill based on elapsed time, then try to remove 1 token. If ≥1 token
remains, **allow** and decrement; else **deny** (429).

## Redis Schema
| Key pattern | Type | Fields / value | TTL |
|-------------|------|----------------|-----|
| `apikey:{id}` | hash | `hash`, `name`, `status`, `capacity`, `refillPerSec`, `createdAt` | none |
| `apikey:lookup:{sha256(secret)}` | string | `{id}` (reverse lookup for auth) | none |
| `bucket:{id}` | hash | `tokens`, `lastRefill` | idle expiry (e.g. 1h) |
| `usage:{id}` | hash | `requests`, `allowed`, `rateLimited`, `2xx`, `4xx`, `5xx`, `lastSeenAt` | none |

## Atomic Token-Bucket Lua (`lib/tokenBucket.lua`)
Inputs: `KEYS[1]=bucket:{id}`, `ARGV = capacity, refillPerSec, nowMs, cost(=1)`.
Logic (pseudocode):
```
tokens, last = HGET bucket tokens/lastRefill  (default: capacity, nowMs)
elapsed = max(0, nowMs - last) / 1000
tokens = min(capacity, tokens + elapsed * refillPerSec)
if tokens >= cost:
    tokens = tokens - cost
    allowed = 1
else:
    allowed = 0
HSET bucket tokens=tokens lastRefill=nowMs
PEXPIRE bucket <idleMs>
retryAfter = allowed==1 ? 0 : ceil((cost - tokens) / refillPerSec)
return { allowed, floor(tokens), retryAfter }
```
Because this runs server-side in one shot, concurrent requests are serialized by Redis — no
lost updates.

## Response Header Mapping
- `X-RateLimit-Limit` = `capacity`
- `X-RateLimit-Remaining` = returned `floor(tokens)`
- `X-RateLimit-Reset` = seconds until bucket is full again = `ceil((capacity - tokens)/refillPerSec)`
- On deny: `Retry-After` = returned `retryAfter`, status `429`.

## Expiration Strategy
- Buckets carry an idle TTL (refreshed on each use) so inactive keys don't accumulate memory.
- API-key and usage records persist (no TTL) — they're the source of truth.

## Concurrency Handling
- All bucket math is inside the Lua script → atomic per key.
- `redis.call('TIME')` may be used for `nowMs` to avoid clock skew across app instances
  (preferred over passing app-side time); pass app time only if you need testability and
  document the trade-off.
- Multiple app instances share one Redis → limits are global per key, not per instance.

## Failure Mode
- If Redis is down: `readiness` returns 503; the rate-limit middleware **fails closed**
  (deny with 503) by default. A `RATE_LIMIT_FAIL_OPEN=true` env can flip to fail-open for
  demos — document whichever you choose.

## Deliverables
- Algorithm, schema, Lua contract, header mapping, expiry, concurrency + failure policy.

## Dependencies
- `02_NEW_ARCHITECTURE.md`, `04_API_DESIGN.md`.

## Acceptance Criteria
- Bucket updates are atomic (Lua), verified by the concurrency test in `08`.
- Header math matches the schema.
- A documented, deliberate Redis-down policy exists.
