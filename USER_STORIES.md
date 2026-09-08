# User Stories – Rate-Limited API Gateway

## Project Context

This project implements a Rate-Limited API Gateway / API Key Management Service: Node/Express
+ Redis, with API key issuance, per-key token-bucket rate limiting, usage analytics,
structured logging, Docker containerization, CI/CD automation via Jenkins, and deployment on
AWS EC2.

The following user stories capture both functional requirements and DevOps implementation
requirements.

---

# Functional User Stories

---

## US-1: Issue an API Key

**As an admin**,
I want to issue a new API key with a name and a rate-limit configuration,
so that a client can be onboarded to the gateway with its own quota.

### Acceptance Criteria

- `POST /admin/keys` with `Authorization: Bearer $ADMIN_TOKEN`
- Request body includes `name` and `rateLimit: { capacity, refillPerSec }`
- A unique key id (`key_...`) and secret (`sk_live_...`) are generated
- The secret is returned **once**, in the `201` response, and never again
- Only a hash of the secret is stored in Redis
- `400 VALIDATION_ERROR` if required fields are missing; `401 UNAUTHORIZED` for a bad admin token

---

## US-2: Inspect and List Keys

**As an admin**,
I want to view a key's metadata or list all keys,
so that I can audit what's been issued without ever seeing the secret again.

### Acceptance Criteria

- `GET /admin/keys/:id` returns metadata (`id`, `name`, `status`, `rateLimit`, `createdAt`)
- `GET /admin/keys` returns `{ keys: [...], count }`
- Neither response includes the secret or its hash
- `404 KEY_NOT_FOUND` for an unknown id

---

## US-3: Revoke a Key

**As an admin**,
I want to revoke a key,
so that a compromised or decommissioned client immediately loses access.

### Acceptance Criteria

- `DELETE /admin/keys/:id` sets status to `revoked`
- Subsequent gateway requests using that key get `403 KEY_REVOKED`
- `404 KEY_NOT_FOUND` for an unknown id

---

## US-4: Authenticate Gateway Requests

**As a client**,
I want to call gateway routes with my API key,
so that my requests are attributed to my account.

### Acceptance Criteria

- Requests send `x-api-key: <secret>`
- Missing header → `401 MISSING_API_KEY`
- Unknown key → `401 INVALID_API_KEY`
- Revoked key → `403 KEY_REVOKED`
- Valid key → request proceeds with `req.apiKey` attached

---

## US-5: Stay Within My Rate Limit

**As a client**,
I want my requests to be rate-limited fairly and correctly under concurrent load,
so that no client can exceed its configured quota, even under a burst.

### Acceptance Criteria

- Each key has a token bucket (`capacity`, `refillPerSec`) enforced atomically via a Redis
  Lua script
- Responses include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Exceeding the bucket returns `429 RATE_LIMITED` with a `Retry-After` header
- Under N+K concurrent requests against a capacity-N bucket, exactly N are allowed — proven
  by a concurrency test (`tests/integration/rateLimit.concurrency.test.js`)

---

## US-6: View My Usage

**As an admin**,
I want to see aggregate usage for a given key,
so that I can understand traffic patterns and rate-limit impact.

### Acceptance Criteria

- `GET /admin/analytics/:id` (admin bearer) returns `totals` (requests/allowed/rateLimited),
  `byStatusClass` (2xx/4xx/5xx), and `lastSeenAt`
- Counters increment on every gateway request, including ones rejected by the rate limiter
- `404 KEY_NOT_FOUND` for an unknown id

---

# DevOps User Stories

---

## US-7: Git Repository and Branching Strategy

**As a developer**,
I want a properly structured Git repository with branch protection,
so that the team can collaborate efficiently.

### Acceptance Criteria

- GitHub repository created
- Branches: `main` (production), `dev` (development), `feature/*` (feature branches)
- Pull requests required for merging into `dev` and `main`
- Proper commit history maintained
- `.gitignore` file configured
- `README.md` and documentation added

---

## US-8: Docker Containerization

**As a DevOps engineer**,
I want the application and its Redis dependency containerized,
so that it runs consistently across environments.

### Acceptance Criteria

- `Dockerfile` builds the gateway image; `.dockerignore` keeps the build context lean
- `docker-compose.yml` brings up `app` + `redis` together, with a healthcheck dependency
- Application accessible on port 3000 once Redis is healthy

---

## US-9: Continuous Integration Pipeline

**As a DevOps engineer**,
I want a Jenkins pipeline that builds, tests, and publishes the image,
so that every change to `dev` produces a verified, deployable artifact.

### Acceptance Criteria

- `Jenkinsfile` present in the repository with these stages: Clone Repository, Install
  Dependencies, Run Tests, Build Docker Image, Push to DockerHub, Clean Up
- `npm test` runs a real Jest suite (unit + middleware always; Redis-guarded integration
  tests run when Redis is available)
- Pipeline status visible in the Jenkins dashboard

---

## US-10: DockerHub Integration

**As a DevOps engineer**,
I want the Docker image pushed to DockerHub on every build,
so that it can be deployed from a central registry.

### Acceptance Criteria

- Image tagged with both `${BUILD_NUMBER}` and `latest`
- Pushed automatically via Jenkins using the `dockerhub` credential
- Image name (`karthiksaravanan3/task-api`) unchanged across the migration

---

## US-11: Manual Deployment on AWS EC2

**As a DevOps engineer**,
I want to deploy the containerized gateway (with Redis) on AWS EC2,
so that it is accessible over the internet.

### Acceptance Criteria

- `docker compose pull && docker compose up -d` brings up app + Redis on the instance
- Environment variables (`ADMIN_TOKEN`, `API_KEY_SALT`, `REDIS_URL`, ...) set via an
  uncommitted `.env` on the instance
- Redis's port is not exposed to the public internet
- `/health/ready` returns `200` post-deploy; a smoke test issues a key and gets `pong` from
  `/v1/ping`

---

# Collaboration & Quality Stories

---

## US-12: Pull Request and Code Review Workflow

**As a team member**,
I want all changes to go through pull requests,
so that code quality and collaboration standards are maintained.

### Acceptance Criteria

- All features developed in `feature/*` branches
- Pull request required before merge
- At least one review before merge
- CI pipeline must pass before merging
- Merge history visible in repository

---

# Summary

This project integrates:

- API key issuance/management with hash-only secret storage
- Atomic, Redis-backed token-bucket rate limiting
- Per-key usage analytics and structured request logging
- Git-based collaboration
- Docker + Docker Compose containerization (app + Redis)
- Jenkins CI/CD automation
- DockerHub image management
- Manual AWS EC2 deployment

The user stories above define the complete scope of the project.
