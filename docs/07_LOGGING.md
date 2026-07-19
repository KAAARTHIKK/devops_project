# 07 — Logging

## Goal
Plan structured logging with request IDs, per-key usage, latency, status codes, and
rate-limit violations.

## Background
The current app has zero logging. Structured JSON logs are a concrete backend-engineering
signal and make the analytics story credible. Use **Pino** + **pino-http**.

## Logger (`lib/logger.js`)
- Pino root logger; level from `LOG_LEVEL` (default `info`).
- JSON output to stdout (Docker/EC2 friendly; captured by `docker logs`).
- Redact fields: `req.headers["x-api-key"]`, `req.headers.authorization` → never logged.

## Request ID (`middleware/requestId.js`)
- Generate `uuid` per request → `req.id`; set `X-Request-Id` response header.
- If an incoming `X-Request-Id` is present (from a proxy), reuse it for traceability.

## HTTP Logging (pino-http)
Each request emits one structured line including:
- `requestId`
- `method`, `url`
- `statusCode`
- `responseTime` (ms latency)
- `keyId` (from `req.apiKey.id` when authenticated; omitted otherwise)

Example:
```json
{"level":"info","time":"...","requestId":"a1b2...","method":"GET","url":"/v1/ping",
 "statusCode":200,"responseTime":4,"keyId":"key_9f3a...","msg":"request completed"}
```

## Rate-Limit Violation Logging
- On 429, log at `warn` with `requestId`, `keyId`, `retryAfter`, and current `remaining`.
- These are the events analytics counts as `rateLimited`.

## Error Logging
- `errorHandler` logs at `error` with `requestId`, `err.message`, `err.stack`, `statusCode`.
- Never leak stack traces in the HTTP response body (only `code`+`message`+`requestId`).

## What NOT to log
- Raw API keys, admin token, full request bodies for admin key creation.

## Deliverables
- Logger config, request-ID strategy, field list, violation + error logging rules.

## Dependencies
- `06_AUTH_MIDDLEWARE.md`.

## Acceptance Criteria
- Every request produces exactly one completion log line with latency + status + requestId.
- No secret material appears in any log.
- 429s are logged at warn and are countable for analytics.
