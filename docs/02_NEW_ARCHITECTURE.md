# 02 — New Architecture

## Goal
Define a production-style, modular Node/Express backend for a **Rate-Limited API Gateway /
API Key Management Service** that drops into the existing repo with minimal DevOps friction.

## Background
We stay on Node/Express (not FastAPI) deliberately: the Dockerfile, Jenkinsfile, and EC2
docs all assume Node, and the brief says favor refactoring over rewriting. Express **5** is
already the installed major version — error handling and async route support reflect that.

## High-Level Design
A single stateless Express service backed by Redis. Redis holds three things:
1. **API keys** — hash + metadata, keyed by key id.
2. **Rate-limit buckets** — one token bucket per API key.
3. **Usage counters** — per-key aggregates for analytics.

The service is horizontally scalable because all state lives in Redis, not process memory.

```
Client ──x-api-key──> [Express Gateway] ──> Redis
                          │
     request lifecycle:   ▼
   requestId → logger → auth → rateLimit → usage → route handler → error handler
```

## Folder Structure (see 03 for the full tree)
```
src/
├── server.js          # boot: load config, connect redis, listen, graceful shutdown
├── app.js             # express app: middleware wiring + routers (no listen)
├── config/            # env parsing + validation (single source of truth)
├── lib/               # logger, redis client, token-bucket loader
├── middleware/        # requestId, auth, rateLimit, usage, errorHandler
├── services/          # apiKeyService, analyticsService (business logic)
└── routes/            # health, keys (admin), analytics (admin), proxy/sample
```

## Package Responsibilities
- **config** — reads `process.env`, applies defaults, fails fast on missing required vars.
  Nothing else in the app reads `process.env` directly.
- **lib/logger** — Pino instance; child loggers carry `requestId`.
- **lib/redis** — single ioredis client; exposes `ping()` and the loaded Lua script.
- **middleware** — thin, composable, each does one job; ordering is fixed in `app.js`.
- **services** — all Redis reads/writes for keys and analytics; routes never touch Redis
  directly (keeps handlers testable and Redis schema in one place).
- **routes** — HTTP shape only: parse input, call a service, format response.

## Dependency Flow (inward)
```
routes → services → lib/redis
   │        │
   └────────┴──> config, lib/logger
middleware → services (auth, rateLimit, usage) + lib/logger
```
No cycles. `services` never import `routes` or `middleware`.

## Request Lifecycle (protected route)
1. **requestId** — assign `req.id` (uuid), set `X-Request-Id` response header.
2. **logger (pino-http)** — start timer, bind child logger with `req.id`.
3. **auth** — read `x-api-key`; hash; look up in Redis; 401 if missing/invalid, 403 if
   revoked; attach `req.apiKey = { id, ... }`.
4. **rateLimit** — run token-bucket Lua for `req.apiKey.id`; 429 + `Retry-After` if empty;
   else set `X-RateLimit-*` headers.
5. **usage** — increment counters (fire-and-forget, non-blocking; failures logged not thrown).
6. **handler** — do the work, respond.
7. **errorHandler** — catch anything thrown; structured error JSON + correct status; logs
   at error level with `req.id`.

Health routes bypass auth/rateLimit/usage.

## Why This Shape (interview talking points)
- Stateless app + Redis = real horizontal-scaling story.
- Atomic rate limiting via Lua = correct under concurrency (no read-modify-write race).
- Hash-only key storage = secrets never persisted in plaintext.
- Middleware pipeline = clean separation, each layer unit-testable in isolation.

## Deliverables
- Architecture, package responsibilities, dependency flow, request lifecycle.

## Dependencies
- `00_REPOSITORY_ANALYSIS.md`.

## Acceptance Criteria
- No module imports create cycles.
- All env access is centralized in `config/`.
- Routes contain no direct Redis calls.
