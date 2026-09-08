# Build Prompt — API Gateway Migration

## Ground rules
- All planning docs are in `docs/00_REPOSITORY_ANALYSIS.md` through `docs/13_FINAL_CHECKLIST.md`.
  Read the relevant doc(s) before writing any code for a phase — do not rely on memory of
  this conversation.
- Work strictly one phase at a time from `docs/12_IMPLEMENTATION_PLAN.md`. Do not start the
  next phase until I explicitly say "go" or "next phase."
- After finishing a phase: list the files you created/changed, run the phase's ✅ check
  yourself (show the command + output), then STOP and wait for me. Do not ask me trivial
  clarifying questions the docs already answer — if the docs are ambiguous, state your
  assumption and proceed.
- Do not modify `Jenkinsfile` unless the specific phase says to (Phase 10 only, and only if
  I ask for Option B from `docs/10_JENKINS_COMPATIBILITY.md`).
- Keep the repo buildable after every phase. `app.js` stays functional until Phase 8.
- Commit after each phase with a plain, factual commit message. No Co-Authored-By line.
- If something in the docs conflicts with the actual repo state, tell me — don't silently
  pick one.

## Phase 1 — start here
Read `docs/00_REPOSITORY_ANALYSIS.md`, `docs/01_MIGRATION_PLAN.md` (Phase 1 section),
`docs/03_PROJECT_STRUCTURE.md`, and `docs/12_IMPLEMENTATION_PLAN.md` (Phase 1 checklist).
Implement Phase 1 only. Then stop.
