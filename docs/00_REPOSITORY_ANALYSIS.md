# 00 — Repository Analysis

## Goal
Establish ground truth about the existing repository before any code changes, so the
migration replaces **only** the application layer and preserves the DevOps story.

## Background
`devops_project` is a small team DevOps course project: a Task Management REST API +
static frontend, containerized with Docker, built and pushed by a Jenkins pipeline,
deployed manually to a single AWS EC2 instance. The DevOps scaffolding is the strong
part; the application layer is intentionally trivial and is the weakness we are fixing.

This analysis was produced by inspecting the `dev` branch directly (not from second-hand
notes). `dev` is the newest code; `origin/main` differs from `dev` only in 2 lines of
`README.md` and contains **no application-code differences**.

## Current Architecture (verified)

```
repo root
├── app.js            # single-file Express 5 app, in-memory store, port 3000 hardcoded
├── package.json      # only dep: express ^5.2.1 ; test script = `exit 1`
├── Dockerfile        # node:18, npm install, EXPOSE 3000, CMD ["node","app.js"]
├── Jenkinsfile       # declarative, agent any, 7 stages (see below)
├── .gitignore        # ignores node_modules/, package-lock.json, .env, *.log, .DS_Store
├── README.md         # overstates pipeline (describes Build+Deploy stages that don't exist)
├── USER_STORIES.md   # aspirational spec (description/timestamp/.dockerignore) — STALE
├── TESTING.md        # manual test notes; agrees with actual code
└── public/           # vanilla JS frontend: index.html, script.js, style.css
```

**Application facts**
- Single-file Express app; no routing/controller/service split; no config layer; no logging; no auth.
- In-memory store (`let tasks = []`, `let nextId = 1`) — all state lost on restart/redeploy.
- Endpoints: `GET /tasks`, `POST /tasks` `{title}`, `PUT /tasks/:id`, `DELETE /tasks/:id`.
- Task shape `{ id, title, completed }`.
- Port `3000` hardcoded (not env-driven).
- Express **5**, not 4 (matters for middleware/error-handling syntax).

## Existing CI/CD Flow (Jenkinsfile = ground truth)
1. **Clone Repository** — hardcoded `git branch: 'dev'`.
2. **Install Dependencies** — no-op; deferred to Docker build.
3. **Run Tests** — `npm test || echo "No tests configured yet"`. Because `test` = `exit 1`,
   this **always passes via the fallback echo**. No real gate exists.
4. **Build Docker Image** — `docker build -t karthiksaravanan3/task-api:${BUILD_NUMBER} .`,
   also tags `:latest`. Image namespace hardcoded.
5. **Push to DockerHub** — pushes both tags via Jenkins credential id `dockerhub`.
6. **Clean Up** — removes the two local images just built.
7. **post** — success/failure echo only. No notifications, no deploy.

**Not present despite README claims:** a real "Build Application" stage and any EC2 deploy
stage. Deployment is manual (SSH → `docker pull` → `docker run`). No compose / Terraform /
Ansible anywhere.

## Existing Docker Setup
- `node:18` base, `WORKDIR /app`, `COPY package*.json`, `npm install`, `COPY . .`,
  `EXPOSE 3000`, `CMD ["node","app.js"]`.
- Stateless image, no volumes anywhere.
- No `.dockerignore` (so `node_modules`, `.git` etc. are sent to build context).

## Existing Deployment
- Manual on one EC2 instance: pull `:latest`, `docker run -p 3000:3000`.
- No orchestration, no persistence, no reverse proxy documented.

## Application Weaknesses (what we are fixing)
- Trivial CRUD; no backend-engineering depth (no auth, middleware, persistence, logging).
- No real tests → the pipeline's test stage is decorative.
- Stateless with no persistence story.
- Hardcoded config (port, image name).

## Components to PRESERVE (do not touch unnecessarily)
- `Jenkinsfile` — keep all 7 stages and the `dockerhub` credential flow. The test stage
  becomes real simply by making `npm test` pass/fail meaningfully; **no stage edits required**.
- `Dockerfile` base pattern (`node:18`, install, copy, EXPOSE, CMD) — only the entrypoint
  and exposed port may change, and only if we keep them equivalent.
- DockerHub namespace `karthiksaravanan3/task-api` (image name stays; the app inside changes).
  *(Optional cosmetic rename discussed in 10_JENKINS_COMPATIBILITY.md — not required.)*
- `.gitignore` (already ignores `.env`, `node_modules`, `*.log` — perfect for this app).
- Branch model and `dev`-based clone.
- `public/` can be kept as a minimal landing page or removed; not load-bearing.

## Components to REMOVE
- `app.js` in-memory task logic (replaced, not extended).
- Task-specific frontend behavior in `public/script.js` (optional; can be reduced to a
  static status page or dropped).
- `USER_STORIES.md` task-app content — replace with API-gateway stories (or archive).

## Components to REFACTOR
- `package.json` — new name/description, add deps (`ioredis`, `dotenv`, `pino`,
  `express-async-errors` or equivalent), real `test`/`start`/`dev` scripts.
- `Dockerfile` — env-driven `PORT`, add `.dockerignore`, keep everything else.
- `README.md` — correct the pipeline description to match reality + document new app.

## Components to ADD
- Modular Express app under `src/` (routes / middleware / services / config / lib).
- Redis (token-bucket rate limiting + API-key + usage counters).
- `docker-compose.yml` (app + redis) for local dev and EC2.
- `.dockerignore`.
- Real test suite (unit + middleware + rate-limit + concurrency + Redis integration).
- `application/README.md` (setup, env, Jenkins expectations).

## Migration Principle
**Refactor over rewrite; keep the repo buildable after each major step; change the
pipeline as little as possible.** The DevOps layer already tells a good story — we make the
existing "Run Tests" stage *mean something* and add a Redis service rather than reworking
the pipeline.

## Deliverables
- This verified analysis (the basis for all subsequent docs).

## Dependencies
- Read access to `dev` branch (done).

## Acceptance Criteria
- Every claim here is verified against the actual files on `dev`.
- Preserve/remove/refactor/add lists are unambiguous and drive `01_MIGRATION_PLAN.md`.
