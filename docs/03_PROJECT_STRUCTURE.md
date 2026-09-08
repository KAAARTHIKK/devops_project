# 03 — Project Structure

## Goal
Give the exact file tree so an implementer (VS Code + Claude Code) can create files in order
without guessing names or responsibilities.

## Background
Structure mirrors `02_NEW_ARCHITECTURE.md`. Repo-root infra files (Dockerfile, Jenkinsfile,
.gitignore) stay where they are; new application code lives under `src/`.

## Target Tree
```
devops_project/
├── Dockerfile                 # refactored: env PORT, CMD → src/server.js (Phase 8)
├── Jenkinsfile                # UNCHANGED stages
├── docker-compose.yml         # NEW: app + redis
├── .dockerignore              # NEW
├── .gitignore                 # unchanged (already ignores .env, node_modules, *.log)
├── .env.example               # NEW: documents all env vars
├── package.json               # refactored: deps + real scripts
├── README.md                  # refactored: accurate pipeline description
├── USER_STORIES.md            # rewritten for the gateway (or archived)
├── application/
│   └── README.md              # NEW: app setup, env, Jenkins expectations
├── docs/                      # these planning docs
├── public/                    # trimmed to a static status page (optional)
└── src/
    ├── server.js              # boot + graceful shutdown
    ├── app.js                 # express app (no listen) — exported for tests
    ├── config/
    │   └── index.js           # env parsing/validation
    ├── lib/
    │   ├── logger.js          # pino
    │   ├── redis.js           # ioredis client + loaded Lua
    │   └── tokenBucket.lua    # atomic token-bucket script
    ├── middleware/
    │   ├── requestId.js
    │   ├── auth.js
    │   ├── rateLimit.js
    │   ├── usage.js
    │   └── errorHandler.js
    ├── services/
    │   ├── apiKeyService.js    # create/get/revoke; hashing; Redis schema for keys
    │   └── analyticsService.js # counter reads/writes + aggregation
    └── routes/
        ├── health.js          # /health, /health/ready
        ├── keys.js            # /admin/keys ...
        ├── analytics.js       # /admin/analytics/:id
        └── proxy.js           # /v1/* sample protected route(s)
└── tests/
    ├── unit/
    │   ├── apiKeyService.test.js
    │   └── tokenBucket.test.js
    ├── middleware/
    │   ├── auth.test.js
    │   └── rateLimit.test.js
    └── integration/
        ├── redis.test.js
        └── rateLimit.concurrency.test.js
```

## Build Order (matches migration phases)
1. `config/index.js`, `.env.example`, `.dockerignore`
2. `lib/logger.js`, `middleware/requestId.js`, `routes/health.js`, `src/app.js`, `src/server.js`
3. `lib/redis.js`, `docker-compose.yml`
4. `services/apiKeyService.js`, `routes/keys.js`
5. `middleware/auth.js`
6. `lib/tokenBucket.lua`, `middleware/rateLimit.js`, `routes/proxy.js`
7. `middleware/usage.js`, `services/analyticsService.js`, `routes/analytics.js`
8. `middleware/errorHandler.js`, cutover Dockerfile/package.json
9. tests + `package.json` test script
10. docs alignment

## Deliverables
- Complete tree + creation order.

## Dependencies
- `01_MIGRATION_PLAN.md`, `02_NEW_ARCHITECTURE.md`.

## Acceptance Criteria
- Every file in the tree maps to a phase in the migration plan.
- No file lives outside a documented responsibility.
