# 09 — Docker Impact

## Goal
Document only the Docker changes the new app requires. Preserve the existing image pattern.

## Background
Current Dockerfile: `node:18`, `WORKDIR /app`, `COPY package*.json`, `npm install`,
`COPY . .`, `EXPOSE 3000`, `CMD ["node","app.js"]`. No `.dockerignore`. No compose. Stateless.

## Required Changes (minimal)

### Dockerfile
- **CMD** → `["node","src/server.js"]` (entrypoint moved into `src/`). *(Phase 8 only)*
- **PORT** → keep `EXPOSE 3000`; make the app read `process.env.PORT` with default 3000 so the
  exposed port and runtime port stay consistent. No Dockerfile arg change needed if default stays 3000.
- Everything else unchanged. Optionally pin `node:18-slim` for a smaller image (nice-to-have,
  not required).

Resulting Dockerfile (diff intent):
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "src/server.js"]   # was: ["node","app.js"]
```

### .dockerignore (NEW — closes an audited gap)
```
node_modules
npm-debug.log
.git
.gitignore
.env
*.log
docs
tests
public
README.md
USER_STORIES.md
```
Keeps the build context small and avoids shipping tests/docs into the image.

### docker-compose.yml (NEW — for local dev and EC2)
```yaml
services:
  app:
    build: .
    image: karthiksaravanan3/task-api:latest
    ports: ["3000:3000"]
    environment:
      - PORT=3000
      - REDIS_URL=redis://redis:6379
      - ADMIN_TOKEN=${ADMIN_TOKEN}
      - API_KEY_SALT=${API_KEY_SALT}
      - LOG_LEVEL=info
    depends_on:
      redis:
        condition: service_healthy
    restart: unless-stopped
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    restart: unless-stopped
```

## What Stays the Same
- Base image family (`node:18`), install/copy pattern, `EXPOSE 3000`.
- Image name `karthiksaravanan3/task-api` (so Jenkins build/push is untouched).
- Statelessness of the **app** image — persistence lives in the Redis service, not the app.

## New Service Introduced
- **Redis** (`redis:7-alpine`) — required at runtime. Not part of the pushed app image;
  it runs alongside via compose (local + EC2).

## Deliverables
- Exact Dockerfile change, new `.dockerignore`, new `docker-compose.yml`.

## Dependencies
- `05` (why Redis), `06` (env vars).

## Acceptance Criteria
- `docker build .` succeeds and the image boots the gateway on 3000.
- `docker compose up` brings up app + healthy Redis; `/health/ready` returns 200.
- Image name/tag scheme unchanged so the Jenkins push stage needs no edits.
