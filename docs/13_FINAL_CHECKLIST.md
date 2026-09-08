# 13 — Final Checklist

## Goal
A single pre-merge / pre-demo checklist proving the app-layer replacement is complete and the
DevOps story is intact.

## Background
Use this before merging `feature/api-gateway` → `dev` and before an interview demo.

## Application
- [ ] `src/` modular structure matches `03` (config/lib/middleware/services/routes).
- [ ] No module import cycles; routes never call Redis directly.
- [ ] All env access centralized in `src/config`.
- [ ] Health: `/health` 200; `/health/ready` 200 up / 503 when Redis down.
- [ ] API keys: created once, hash-only storage, revoke works, secret never re-returned.
- [ ] Auth: 401 missing/invalid, 403 revoked, valid attaches `req.apiKey`.
- [ ] Rate limit: atomic Lua bucket; 429 + `Retry-After`; `X-RateLimit-*` headers correct.
- [ ] Usage + analytics: counters increment; `/admin/analytics/:id` aggregates match.
- [ ] Logging: one structured completion line per request with requestId + latency + status;
      no secrets in logs.
- [ ] Error handler: structured JSON, no stack traces leaked.

## Security
- [ ] `.env` gitignored; `.env.example` present.
- [ ] No secrets committed or baked into the image.
- [ ] Admin token compared timing-safe.
- [ ] Redis not exposed publicly in production compose.

## Docker
- [ ] `.dockerignore` present and excludes node_modules/tests/docs/.env.
- [ ] Dockerfile `CMD` → `src/server.js`; `EXPOSE 3000`; app reads `PORT`.
- [ ] `docker compose up` → app + healthy redis; smoke test passes.
- [ ] Image name still `karthiksaravanan3/task-api`.

## Tests
- [ ] `npm test` exits non-zero on failure (no `|| echo` inside npm).
- [ ] Concurrency test proves exactly `capacity` requests allowed under a burst.
- [ ] Unit + middleware tests run without live Redis.

## CI/CD (Jenkins)
- [ ] Pipeline clones `dev` (new app merged there).
- [ ] Build + push stages unchanged and green.
- [ ] Decide Option A (soft) vs Option B (strict gate) from `10`; if B, lockfile committed.

## EC2
- [ ] Redis running (compose or standalone) on the instance.
- [ ] Env vars set on the instance.
- [ ] `/health/ready` 200 post-deploy; smoke test issues key + gets `pong`.
- [ ] App redeploy preserves keys/usage (state in Redis).

## Docs
- [ ] `README.md` matches the actual Jenkinsfile (no phantom stages).
- [ ] `USER_STORIES.md` reflects the gateway (or archived).
- [ ] `application/README.md` present.
- [ ] `index.html` typo fixed if page kept.

## Resume/Interview Readiness
- [ ] Can explain: token bucket vs fixed window, why Lua for atomicity, stateless-app +
      Redis scaling, hash-only key storage, 401 vs 403, fail-open vs fail-closed.
- [ ] Can demo end-to-end in <3 min: create key → call `/v1/ping` → trigger 429 → show analytics.

## Deliverables
- Verified, merge-ready application layer on top of the preserved DevOps pipeline.

## Acceptance Criteria
- Every box above checked before merge to `dev`.
