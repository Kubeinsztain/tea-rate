# Observability tooling — plan

> Phased rollout. Phases 1–2 need no new third-party services; each later
> phase is independent. Tool choices and alternatives are in
> [notes](observability-notes.md).

## Phase 1 — Effect logging (~0.5 day)

- Add `logLevel` to the app's `@repo/env` schema (preset already exists).
- Configure the runtime logger layer: `Logger.structured` in production
  (JSON → stdout), `Logger.pretty` in development.
- Rework `recordTastingAction`'s catch: log the full `Cause` (via
  `Effect.runPromiseExit` or a `Effect.catchAllCause`) before returning the
  generic message — today's failure path throws the error away.
- Add `Effect.log*` breadcrumbs to core use cases where decisions happen
  (e.g. invalid rating, tea not found → warn/debug, not error).
- Initialize once from `instrumentation.ts`.

**Done when:** a failing server action produces a structured JSON log line
with the cause visible in `bun run dev` / container stdout.

## Phase 2 — Health & uptime (~0.5 day)

- `/api/health` route handler: app version + `SELECT 1` through the `DB`
  service; 503 when the DB check fails.
- Docker `healthcheck:` for the app (and `pg_isready` for Postgres) in the
  compose file.
- Gatus container watching `health` endpoints of both; alert channel chosen
  and wired.

**Done when:** stopping Postgres flips the endpoint to 503 and an alert
arrives in the chosen channel.

## Phase 3 — Error tracking (~0.5 day)

- Self-host GlitchTip (2–3 containers, own compose file).
- `@sentry/nextjs` pointing at GlitchTip's DSN; `onRequestError` hook wired;
  release/version tag from the build.
- Keep Sentry-specific keys out of logs; respect the env-validation pattern
  (`@repo/env` schema entries with defaults).

**Done when:** deleting a row mid-request produces a grouped, searchable
issue in GlitchTip with a stack trace.

## Phase 4 — Deploy & backup ops (~1 day)

- Deploy workflow: build → `db:migrate` release step → deploy →
  smoke-check `/api/health`.
- `just db-backup` (`pg_dump -Fc`, timestamped, keep-N) + a scheduled runner;
  document (and once actually exercise) the restore path.

**Done when:** a push to `main` deploys through migrate + health-gate, and a
backup can be restored into `db-reset`'s fresh volume.

## Phase 5 — OpenTelemetry backend (when real traffic exists, ~1–2 days)

- `@effect/opentelemetry` `NodeSdk` layer + `instrumentation-pg` in
  `instrumentation.ts`; console exporter already gives dev value in Phase 1.
- Stand up SigNoz (or Grafana LGTM if preferred at that point); point the SDK
  at the collector.
- Charts for golden signals: request rate, error rate (tagged by `Cause`
  failures), p95 latency, DB pool saturation. Log search over Effect JSON
  logs via SigNoz logs or Loki.

**Done when:** a tasting request is traceable end-to-end
(HTTP span → server action span → pg span) in the backend UI.

## Ordering rules

- Phases are independent; never let Phase 5 block 1–4.
- Signal, then store, then alert, then optimize — Tier 0/1 first, always.
- Promote accepted decisions to ADR-0005 after Phases 1–3; then this
  directory empties out and goes away.

## Related

- [README](README.md) — effort overview, constraints, exit criteria
- [Notes](observability-notes.md) — tools, alternatives, comparisons
