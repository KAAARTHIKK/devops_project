# 12 — Implementation Plan

## Goal
Turn the migration into small, independently completable steps an implementer (VS Code +
Claude Code) can execute one at a time, each ending in a verifiable state.

## Background
Follows the 10 phases in `01_MIGRATION_PLAN.md`. Each task below is sized to a single focused
edit + a quick manual check. Do them in order; commit at every ✅.

## Step-by-Step

### Phase 1 — Config & ignores
- [ ] Add `src/config/index.js` reading `PORT, REDIS_URL, ADMIN_TOKEN, API_KEY_SALT, LOG_LEVEL,
      RATE_LIMIT_ENABLED, RATE_LIMIT_FAIL_OPEN`; throw on missing required (`REDIS_URL`,
      `ADMIN_TOKEN`).
- [ ] Add `.env.example` with all vars (placeholders).
- [ ] Add `.dockerignore` (per `09`).
- ✅ Check: `node -e "require('./src/config')"` fails clearly when `ADMIN_TOKEN` unset.

### Phase 2 — Skeleton + health
- [ ] `npm i pino pino-http uuid`
- [ ] `lib/logger.js` (pino, redactions).
- [ ] `middleware/requestId.js`.
- [ ] `routes/health.js` (`/health`, `/health/ready` — ready stubbed to 200 for now).
- [ ] `src/app.js` (wire requestId + pino-http + health router; export app).
- [ ] `src/server.js` (load config, `app.listen(PORT)`, graceful shutdown on SIGTERM).
- ✅ Check: `node src/server.js`, then `curl /health` → ok with `X-Request-Id`.

### Phase 3 — Redis + compose
- [ ] `npm i ioredis`
- [ ] `lib/redis.js` (single client, `ping()`, load Lua later).
- [ ] Wire `/health/ready` to real Redis PING (503 when down).
- [ ] `docker-compose.yml` (app + redis, per `09`).
- ✅ Check: `docker compose up`; `/health/ready` 200; stop redis → 503.

### Phase 4 — API key service + admin routes
- [ ] `services/apiKeyService.js`: `create()`, `getById()`, `list()`, `revoke()`; hashing +
      Redis schema (per `05`/`06`).
- [ ] `middleware` admin guard (bearer `ADMIN_TOKEN`, timing-safe).
- [ ] `routes/keys.js` (`POST/GET/DELETE /admin/keys`).
- ✅ Check: create returns secret once; get never returns secret; bad admin token → 401.

### Phase 5 — Auth middleware
- [ ] `middleware/auth.js` (per `06` logic).
- [ ] Mount a temporary protected route to test.
- ✅ Check: no key → 401; unknown → 401; revoked → 403; valid → attaches `req.apiKey`.

### Phase 6 — Rate limiting
- [ ] `lib/tokenBucket.lua` (per `05`).
- [ ] Load script in `lib/redis.js`; expose `consume(id, capacity, refill, cost)`.
- [ ] `middleware/rateLimit.js` (headers + 429 + `Retry-After`; honor `RATE_LIMIT_ENABLED`
      and fail-open/closed policy).
- [ ] `routes/proxy.js` (`GET /v1/ping`, `GET /v1/echo`) behind auth + rateLimit.
- ✅ Check: burst beyond capacity yields 429s; headers correct.

### Phase 7 — Usage + analytics
- [ ] `middleware/usage.js` (increment counters, non-blocking).
- [ ] `services/analyticsService.js` (read/aggregate).
- [ ] `routes/analytics.js` (`GET /admin/analytics/:id`).
- ✅ Check: after N requests, analytics totals match; 429s counted as `rateLimited`.

### Phase 8 — Error handler + cutover
- [ ] `middleware/errorHandler.js` (structured JSON, no stack in body).
- [ ] `package.json`: `main`/`start`/`dev` → `src/server.js`; add deps.
- [ ] `Dockerfile` `CMD` → `["node","src/server.js"]`.
- [ ] Delete `app.js`; trim `public/` to a static status page (or remove).
- ✅ Check: `docker build .` boots gateway; old task endpoints gone.

### Phase 9 — Real test gate
- [ ] `npm i -D jest supertest ioredis-mock`
- [ ] Write tests per `08` (unit, middleware, integration, concurrency).
- [ ] `package.json` `test` → `jest --runInBand`.
- [ ] (Optional) commit `package-lock.json` + adjust `.gitignore` if using Option B in `10`.
- ✅ Check: `npm test` passes locally; a deliberately broken assertion fails the run.

### Phase 10 — Docs alignment
- [ ] Rewrite `README.md` to match the real Jenkinsfile (remove phantom Build/Deploy stages;
      document the gateway, env vars, compose, EC2 steps).
- [ ] Replace `USER_STORIES.md` with gateway stories (or archive the old one).
- [ ] Add `application/README.md` (already drafted).
- [ ] Fix the `public/index.html` typo if the page is kept (`Sucess` → `Success`).
- ✅ Check: README claims == Jenkinsfile reality.

## Deliverables
- Ordered checklist with per-step verification.

## Dependencies
- All prior docs.

## Acceptance Criteria
- Repo builds after each phase; old app runs until Phase 8.
- Final `npm test` is a real gate; final image boots the gateway.
