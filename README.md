# Rate-Limited API Gateway — DevOps Project

## Overview

This project is a Node.js/Express **API Gateway and API Key Management Service** backed by
Redis: it issues API keys, enforces per-key token-bucket rate limiting (atomic via a Lua
script), tracks per-key usage analytics, and logs every request in structured JSON.

It replaces an earlier Task Management REST API that lived in this repo. The DevOps layer —
Docker, Jenkins CI/CD, DockerHub publishing, and manual EC2 deployment — is unchanged from
that earlier version; only the application inside the container changed.

---

## Team Members

- Darun Kumar M M – Backend Development
- Akshata Ramgopal – Docker Containerization
- Karthik Saravanan – Jenkins CI/CD Pipeline
- Lokesh Kumar G R – AWS EC2 Deployment

---

## Technology Stack

- Runtime: Node.js, Express 5
- Data store: Redis (API keys, rate-limit buckets, usage counters — the app itself is stateless)
- Logging: Pino (structured JSON, request-scoped)
- Tests: Jest + Supertest + ioredis-mock
- Containerization: Docker, Docker Compose (app + redis)
- CI/CD: Jenkins
- Container Registry: DockerHub
- Cloud Platform: AWS EC2
- Default Port: 3000

---

## Project Structure

```
devops_project/
├── src/
│   ├── server.js        # boot + graceful shutdown
│   ├── app.js            # express app (exported, no listen)
│   ├── config/            # env parsing/validation
│   ├── lib/                # logger, redis client, token-bucket Lua
│   ├── middleware/         # requestId, auth, rateLimit, usage, errorHandler
│   ├── services/            # apiKeyService, analyticsService
│   └── routes/               # health, keys, analytics, proxy (/v1)
├── tests/                # unit, middleware, integration (Jest)
├── application/README.md  # app-focused setup/ops guide
├── docs/                   # planning docs (00–13)
├── Dockerfile
├── docker-compose.yml     # app + redis, for local dev and EC2
├── Jenkinsfile
├── package.json
└── .gitignore
```

---

## Architecture

```
Client ──x-api-key──> [Express Gateway] ──> Redis
                          │
   requestId → logger → auth → rateLimit → usage → route handler → error handler
```

- **Stateless app + Redis** — horizontally scalable; all state (keys, buckets, usage) lives
  in Redis, not process memory.
- **Atomic rate limiting** — token-bucket math runs inside a single Lua script per request,
  so concurrent requests can't race past the limit.
- **Hash-only key storage** — API key secrets are shown once at creation and never persisted
  in plaintext.

Full design: [`docs/02_NEW_ARCHITECTURE.md`](docs/02_NEW_ARCHITECTURE.md).

---

## API Endpoints (summary)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/health` | none | liveness |
| GET | `/health/ready` | none | readiness (Redis PING) |
| POST | `/admin/keys` | `Authorization: Bearer $ADMIN_TOKEN` | issue an API key (secret shown once) |
| GET | `/admin/keys` / `/admin/keys/:id` | admin | list / inspect keys (no secret) |
| DELETE | `/admin/keys/:id` | admin | revoke a key |
| GET | `/admin/analytics/:id` | admin | per-key usage totals |
| GET | `/v1/ping`, `/v1/echo` | `x-api-key` | sample rate-limited gateway routes |

Full contract with request/response bodies and error codes:
[`docs/04_API_DESIGN.md`](docs/04_API_DESIGN.md).

---

## Running Locally

See [`application/README.md`](application/README.md) for setup (with or without Docker
Compose), the full environment variable table, example `curl` calls, and troubleshooting.

Quick start with Compose (recommended — brings up app + Redis together):
```bash
cp .env.example .env      # fill ADMIN_TOKEN, API_KEY_SALT
docker compose up --build
curl localhost:3000/health/ready   # {"status":"ready","redis":"up"}
```

---

## Docker

```bash
docker build -t karthiksaravanan3/task-api .
docker compose up -d      # app + redis together
```

The image name (`karthiksaravanan3/task-api`) is unchanged from the original project so the
Jenkins build/push stages work without modification. Details:
[`docs/09_DOCKER_IMPACT.md`](docs/09_DOCKER_IMPACT.md).

---

## Jenkins CI/CD Pipeline

Pipeline stages (as defined in `Jenkinsfile` — unchanged from the original project):

1. **Clone Repository** — clones the `dev` branch.
2. **Install Dependencies** — no-op; dependencies install during the Docker build.
3. **Run Tests** — `npm test`, now a real Jest suite (unit + middleware always run;
   Redis-dependent integration tests skip gracefully if no Redis is available on the agent).
4. **Build Docker Image** — tags `${BUILD_NUMBER}` and `latest`.
5. **Push to DockerHub** — via the `dockerhub` credential.
6. **Clean Up** — removes the local images built in this run.

Deployment to EC2 is **manual** (see below) — there is no automated deploy stage in the
pipeline.

---

## AWS EC2 Deployment

1. On the instance: `docker compose pull && docker compose up -d` (brings up app + Redis).
2. Set `ADMIN_TOKEN`, `API_KEY_SALT`, etc. via a `.env` file next to `docker-compose.yml`
   (never committed).
3. Verify: `curl localhost:3000/health/ready` → `200`.

Do not expose Redis's port publicly. Full steps and a post-deploy smoke test:
[`docs/11_EC2_DEPLOYMENT.md`](docs/11_EC2_DEPLOYMENT.md).

---

## Git Workflow

### Branch Strategy

- `main` – production-ready
- `dev` – development branch
- `feature/*` – feature branches

### Feature Development

```bash
git checkout dev
git checkout -b feature/<feature-name>
git add .
git commit -m "Descriptive commit message"
git push origin feature/<feature-name>
```

Pull Request Flow: `feature/<feature-name>` → `dev` → `main`

---

## License

ISC
