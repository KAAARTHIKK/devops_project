# Application — Rate-Limited API Gateway / API Key Management Service

Node/Express + Redis service that issues and validates API keys and enforces per-key
token-bucket rate limiting, with usage analytics and structured logging. Replaces the old
in-memory Task API while preserving the repo's Docker + Jenkins + EC2 pipeline.

## Setup (local, without Docker)
```bash
npm install
cp .env.example .env      # fill ADMIN_TOKEN, API_KEY_SALT
# needs a Redis running locally, e.g. docker run -d -p 6379:6379 redis:7-alpine
npm run dev               # starts src/server.js on PORT (default 3000)
```

## Setup (local, with Docker Compose — recommended)
```bash
cp .env.example .env      # fill ADMIN_TOKEN, API_KEY_SALT
docker compose up --build # app + redis, with healthcheck dependency
curl localhost:3000/health/ready   # expect {"status":"ready","redis":"up"}
```

## Environment Variables
| Var | Required | Default | Purpose |
|-----|----------|---------|---------|
| `REDIS_URL` | yes | — | Redis connection (`redis://redis:6379` in compose) |
| `ADMIN_TOKEN` | yes | — | Bearer token for `/admin/*` endpoints |
| `API_KEY_SALT` | recommended | — | Pepper added before hashing API keys |
| `PORT` | no | `3000` | HTTP listen port (keep 3000 to match Docker EXPOSE) |
| `LOG_LEVEL` | no | `info` | Pino log level |
| `RATE_LIMIT_ENABLED` | no | `true` | Feature-flag the limiter |
| `RATE_LIMIT_FAIL_OPEN` | no | `false` | Allow requests if Redis is down (else 503) |

`.env` is gitignored — never commit real secrets.

## Local Development
- Entry point: `src/server.js` (boot) → `src/app.js` (express app).
- Health: `GET /health`, `GET /health/ready`.
- Issue a key (admin):
  ```bash
  curl -X POST localhost:3000/admin/keys \
    -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' \
    -d '{"name":"dev","rateLimit":{"capacity":100,"refillPerSec":10}}'
  ```
  The `apiKey` in the response is shown **once**.
- Call a protected route:
  ```bash
  curl localhost:3000/v1/ping -H "x-api-key: sk_live_..."
  ```
- Analytics: `GET /admin/analytics/:id` (admin bearer).

Full endpoint contract: `docs/04_API_DESIGN.md`.

## Docker Build
```bash
docker build -t karthiksaravanan3/task-api:local .
```
The image name is intentionally unchanged so the Jenkins build/push stages work as-is.
Details: `docs/09_DOCKER_IMPACT.md`.

## Expected Jenkins Behavior
The existing `Jenkinsfile` needs **no stage changes**:
1. Clone `dev` — new app is merged into `dev`.
2. Install — no-op (deps install in Docker build).
3. Run Tests — now runs a real `jest` suite via `npm test`.
4. Build Docker Image — same command, same image name.
5. Push to DockerHub — same `dockerhub` credential and tags.
6. Clean Up — unchanged.

**Pipeline assumptions**
- `npm test` runs Jest. Unit + middleware tests need no Redis; integration/concurrency tests
  are Redis-guarded (skipped if `REDIS_URL` is absent on the agent).
- If you want a *strict* gate (failing tests fail the build), drop the `|| echo` in the Run
  Tests stage and commit a `package-lock.json` — see `docs/10_JENKINS_COMPATIBILITY.md`
  (Option B).

## Deployment Expectations (EC2)
- Redis must run alongside the app (compose recommended).
- Set env vars on the instance via `.env` / compose `environment:`.
- Redeploy: `docker compose pull && docker compose up -d`. App is stateless; keys/usage
  persist in Redis. Do not expose Redis (`6379`) publicly.
- Full steps + smoke test: `docs/11_EC2_DEPLOYMENT.md`.

## Troubleshooting
| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `/health/ready` returns 503 | Redis unreachable | check `REDIS_URL`, `docker compose ps`, redis healthcheck |
| All gateway calls 503 | fail-closed + Redis down | fix Redis, or set `RATE_LIMIT_FAIL_OPEN=true` for demo |
| 401 on valid-looking key | wrong/rotated `API_KEY_SALT` | keys hashed with old salt are invalid; reissue |
| 401 on admin routes | wrong `ADMIN_TOKEN` | verify env var on the running container |
| `npm ci` fails in Jenkins | no committed lockfile | commit `package-lock.json` or use `npm install` |
| Rate limit seems too loose | multiple app instances but shared Redis? | limits are global per key via Redis; verify all instances use same `REDIS_URL` |
| Keys lost after restart | Redis without persistence | add a redis volume + `--appendonly yes` (see EC2 doc) |

## Related Docs
Planning and design live in `docs/00`–`13`. Start with `12_IMPLEMENTATION_PLAN.md` to build.
