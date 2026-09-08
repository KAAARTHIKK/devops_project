# 01 — Migration Plan

## Goal
Replace the application layer incrementally, keeping the repo buildable and the Jenkins
pipeline green after every major step, with a rollback path at each phase.

## Background
The pipeline clones `dev`, builds a Docker image, pushes to DockerHub, and (manually)
deploys to EC2. We keep that spine intact. Work happens on a feature branch off `dev` and
merges back so the pipeline continues to clone `dev` unchanged.

## Branch Strategy
- Create `feature/api-gateway` from `dev`.
- Each phase = one or more commits; merge to `dev` only at green checkpoints.
- The Jenkinsfile still clones `dev`; nothing about the pipeline trigger changes.

---

## Phase 1 — Scaffolding & Config (no behavior change yet)
**New files:** `src/config/index.js`, `.env.example`, `.dockerignore`
**Refactored:** `package.json` (add `dotenv`; add `start`/`dev` pointing at `src/server.js`
later; keep old `app.js` running for now)
**Deleted:** none
**Risk:** Low
**Rollback:** revert commit; `app.js` still boots.
**Acceptance:** `node app.js` still runs; `.env.example` documents `PORT`, `REDIS_URL`,
`API_KEY_SALT`, `LOG_LEVEL`; `.dockerignore` excludes `node_modules`, `.git`, `*.log`,
`docs/`, tests.

## Phase 2 — Modular App Skeleton (parallel to old app)
**New files:** `src/app.js`, `src/server.js`, `src/routes/health.js`,
`src/middleware/requestId.js`, `src/lib/logger.js`
**Deps added:** `pino`, `pino-http` (or `morgan` if preferred), `uuid`
**Refactored:** none yet (old `app.js` untouched)
**Risk:** Low
**Rollback:** delete `src/`; entrypoint still `app.js`.
**Acceptance:** `node src/server.js` serves `GET /health` (liveness) and `GET /health/ready`
(readiness) with structured logs and a request ID per request.

## Phase 3 — Redis Layer + Local Compose
**New files:** `src/lib/redis.js`, `docker-compose.yml`
**Deps added:** `ioredis`
**Risk:** Medium (introduces an external dependency)
**Rollback:** app must **degrade gracefully** — if `REDIS_URL` unset in a non-gateway route,
health/liveness still returns 200; readiness returns 503 when Redis is down.
**Acceptance:** `docker compose up` starts `app` + `redis`; `GET /health/ready` returns 200
only when Redis PINGs; returns 503 when Redis is stopped.

## Phase 4 — API Key Management
**New files:** `src/services/apiKeyService.js`, `src/routes/keys.js`
**Risk:** Medium
**Rollback:** revert routes; health app still works.
**Acceptance:** `POST /admin/keys` issues a key (plaintext returned **once**), stores only a
hash in Redis; `GET /admin/keys/:id` returns metadata (never the secret); `DELETE`
revokes. Admin routes protected by `ADMIN_TOKEN`.

## Phase 5 — Auth Middleware
**New files:** `src/middleware/auth.js`
**Risk:** Medium
**Rollback:** remove middleware from the protected router.
**Acceptance:** requests to a protected sample route without a valid `x-api-key` get 401;
with a revoked key get 403; with a valid key proceed and attach `req.apiKey`.

## Phase 6 — Token-Bucket Rate Limiting
**New files:** `src/middleware/rateLimit.js`, `src/lib/tokenBucket.lua`
**Risk:** High (concurrency correctness; the headline feature)
**Rollback:** feature-flag `RATE_LIMIT_ENABLED=false` bypasses the middleware.
**Acceptance:** per-key limits enforced atomically via a Lua script; returns 429 with
`Retry-After` and `X-RateLimit-*` headers; concurrent requests never exceed the bucket
(verified by the concurrency test in `08_TESTING.md`).

## Phase 7 — Usage Logging & Analytics
**New files:** `src/middleware/usage.js`, `src/routes/analytics.js`
**Risk:** Low–Medium
**Rollback:** remove usage middleware; core gateway unaffected.
**Acceptance:** each request increments per-key counters (total, per-status-class, rate-limit
violations) in Redis; `GET /admin/analytics/:id` returns aggregates.

## Phase 8 — Cutover (retire old app)
**Refactored:** `package.json` `main`/`start` → `src/server.js`; `Dockerfile` `CMD` →
`["node","src/server.js"]`, `EXPOSE ${PORT}` (default 3000)
**Deleted:** `app.js` (task logic); trim/replace `public/`
**Risk:** Medium (entrypoint change touches Docker)
**Rollback:** git revert restores `app.js` + old `CMD` in one commit.
**Acceptance:** Docker image built from the Dockerfile boots the new gateway on port 3000;
pipeline's build/push stages unaffected.

## Phase 9 — Tests Become a Real Gate
**Refactored:** `package.json` `test` → `jest` (or `node --test`) with coverage
**Risk:** Low (but now failures actually stop the build)
**Rollback:** none needed; if flaky, gate on unit+middleware only, mark integration tests
`--runInBand` and Redis-guarded.
**Acceptance:** `npm test` exits non-zero on failure; Jenkins "Run Tests" stage now fails
the build on real regressions (the `|| echo` fallback can stay as a safety net or be removed
— see `10_JENKINS_COMPATIBILITY.md`).

## Phase 10 — Docs & Deployment Alignment
**Refactored:** `README.md` (accurate pipeline), `USER_STORIES.md` (new stories),
add `application/README.md`, `docs/11_EC2_DEPLOYMENT.md` steps.
**Risk:** Low
**Acceptance:** README matches the Jenkinsfile exactly; EC2 doc covers Redis + env vars.

---

## Deliverables
- Ten-phase incremental plan with per-phase file impact, risk, rollback, acceptance.

## Dependencies
- `00_REPOSITORY_ANALYSIS.md` preserve/remove/refactor lists.

## Acceptance Criteria
- Repo is buildable after each phase (old app runs until Phase 8 cutover).
- No phase requires editing Jenkins **stages**; only `package.json`/`Dockerfile` content
  changes, which the existing stages consume transparently.
- Every phase has an explicit rollback.
