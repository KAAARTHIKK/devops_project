# 11 — EC2 Deployment

## Goal
Document only the additional deployment steps the new app needs: Redis, env vars, Docker
updates, and health verification. Preserve the existing manual-deploy architecture.

## Background
Deployment today is manual on one EC2 instance: `docker pull karthiksaravanan3/task-api:latest`
then `docker run -p 3000:3000`. The new app adds one hard requirement: **a running Redis** and
**environment variables**. Simplest path: run both via `docker compose` on the instance.

## New Requirement: Redis
The app cannot serve gateway routes without Redis. Two options:

**Option 1 (recommended): compose on the instance.**
```bash
# on EC2, in the repo dir (or a dir holding docker-compose.yml + .env)
docker compose pull        # or `docker compose build`
docker compose up -d
```
Brings up `app` + `redis` with the healthcheck dependency. One command, reproducible.

**Option 2: standalone containers.**
```bash
docker network create gw
docker run -d --name redis --network gw redis:7-alpine
docker run -d --name api --network gw -p 3000:3000 \
  -e REDIS_URL=redis://redis:6379 \
  -e ADMIN_TOKEN=... -e API_KEY_SALT=... -e LOG_LEVEL=info \
  karthiksaravanan3/task-api:latest
```

## Environment Variables on EC2
Create `.env` on the instance (never commit it):
```
ADMIN_TOKEN=<long-random>
API_KEY_SALT=<random>
REDIS_URL=redis://redis:6379
PORT=3000
LOG_LEVEL=info
RATE_LIMIT_ENABLED=true
```
Compose reads `.env` automatically; standalone runs pass them via `-e`.

## Security Group / Networking
- Expose only what you need: keep `3000` open (or front it with nginx on 80/443).
- **Do not** expose Redis `6379` publicly — keep it on the internal Docker network only.
  Remove the `6379:6379` host mapping from compose in production; app reaches Redis by
  service name over the compose network.

## Docker Updates on Redeploy
```bash
docker compose pull        # get new :latest pushed by Jenkins
docker compose up -d        # recreate app; redis persists
```
Because the app is stateless and keys/usage live in Redis, redeploying the app container does
**not** lose data (unlike the old in-memory task app). If you want Redis data to survive a
Redis container restart too, add a volume:
```yaml
  redis:
    volumes: ["redis-data:/data"]
    command: ["redis-server","--appendonly","yes"]
volumes: { redis-data: {} }
```

## Health Verification (post-deploy)
```bash
curl -s localhost:3000/health           # {"status":"ok",...}
curl -s localhost:3000/health/ready     # {"status":"ready","redis":"up"}  → 200
# smoke test full pipeline:
ADMIN=...; KEY=$(curl -s -X POST localhost:3000/admin/keys \
  -H "Authorization: Bearer $ADMIN" -H 'Content-Type: application/json' \
  -d '{"name":"smoke","rateLimit":{"capacity":5,"refillPerSec":1}}' | jq -r .apiKey)
curl -s localhost:3000/v1/ping -H "x-api-key: $KEY"     # pong
```

## Deliverables
- Redis provisioning, env setup, redeploy commands, health checks, security notes.

## Dependencies
- `06` (env vars), `09` (compose).

## Acceptance Criteria
- `/health/ready` returns 200 on the instance after deploy.
- A smoke test issues a key and gets `pong` from `/v1/ping`.
- Redis is not reachable from the public internet.
- App redeploy preserves keys/usage (state in Redis).
