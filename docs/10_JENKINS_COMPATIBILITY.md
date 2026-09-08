# 10 — Jenkins Compatibility

## Goal
Keep the existing Jenkinsfile working with **no stage edits**, and state exactly what (if
anything) is optional.

## Background
The pipeline: Clone `dev` → Install (no-op) → Run Tests (`npm test || echo ...`) → Build image
→ Push to DockerHub (`dockerhub` cred) → Clean Up. Image `karthiksaravanan3/task-api`,
tags `${BUILD_NUMBER}` + `latest`.

## Why It Keeps Working Unchanged
- **Clone** — still `dev`; we merge the new app into `dev`. ✔
- **Install** — no-op; deps install in Docker build as before. ✔
- **Run Tests** — runs `npm test`. After Phase 9, `npm test` is a real Jest run. The stage
  line is identical; its *meaning* upgrades for free. ✔
- **Build** — `docker build .` against the same Dockerfile path/name. ✔
- **Push** — same image name + `dockerhub` credential. ✔
- **Clean Up** — same two tags. ✔

**No stage needs to change.** The image name is preserved specifically so this holds.

## Optional (recommended) Change — make the gate strict
Currently `npm test || echo "No tests configured yet"` swallows failures. Once real tests
exist, you likely *want* failures to stop the build. Two options:

**Option A (zero Jenkinsfile change):** leave the `|| echo`. Tests run and log, but a failing
test won't fail the build. Simplest; keeps "no changes" promise. Weakest gate.

**Option B (one-line change, recommended for the resume story):**
```groovy
stage('Run Tests') {
    steps {
        echo '🧪 Running tests...'
        sh 'npm ci'          // ensure devDeps (jest) are present on the agent
        sh 'npm test'        // no `|| echo` → real failures fail the build
    }
}
```
Note: `npm ci` requires a committed `package-lock.json`. Current `.gitignore` **ignores**
`package-lock.json` — if you choose Option B, remove that line from `.gitignore` and commit
the lockfile, or use `npm install` instead of `npm ci`.

## Redis in CI (only if you want integration tests gated)
Unit + middleware tests need no Redis. If you want the concurrency/integration tests to run in
Jenkins, add a Redis service to the agent, e.g. run tests inside compose:
```groovy
sh 'docker compose up -d redis'
sh 'REDIS_URL=redis://localhost:6379 npm run test:integration'
sh 'docker compose down'
```
Otherwise keep the Jenkins gate on unit+middleware and run integration locally.

## Deliverables
- Confirmation of no-change compatibility + two clearly scoped optional upgrades.

## Dependencies
- `08_TESTING.md`, `09_DOCKER_IMPACT.md`.

## Acceptance Criteria
- Pipeline builds and pushes with the new app and an unmodified Jenkinsfile (Option A).
- If Option B is chosen, a lockfile is committed and a failing test fails the build.
