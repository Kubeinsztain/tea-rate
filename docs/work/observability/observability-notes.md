# Observability tooling — notes

> Candidate tools per category, with alternatives and short comparisons.
> Constraints: self-hosted Docker, open-source-first, Effect-centric stack
> (see [README](README.md)). Choice per section feeds the phased
> [plan](observability-plan.md).

## Current gaps (as of Oct 2026)

| Area              | State                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Logging           | `console.log` in the seed script only; server actions swallow errors into a generic `"Something went wrong"` with no log |
| Error tracking    | none                                                                                                                     |
| Tracing / metrics | none (despite Effect's built-in spans/metrics)                                                                           |
| Health checks     | none — no endpoint, no Docker healthcheck                                                                                |
| Deploy ops        | migrations manual; no deploy workflow; no DB backups                                                                     |
| Groundwork        | `@repo/env` already ships an unused `logLevel` preset                                                                    |

---

## 1. Logging

### Effect built-in `Logger` — **chosen direction**

Effect ships logging, diagnostics and `Cause` handling in the core library.
`Effect.log*` calls in use cases become structured entries; logging spans
annotate automatically at runtime. Config: `Logger.structured` (JSON to
stdout) in production, `Logger.pretty` for the dev console. Level controlled
by wiring the existing `@repo/env` `logLevel` preset into the runtime layer.

- Pro: zero new dependencies; one mental model across `core`/`infra`/`web`;
  errors logged with full `Cause` (defects, stack, fiber context) instead of
  a bare `catch (error)`.
- Con: only covers code paths running as Effects; plain TS code (seed,
  scripts) still needs a fallback logger.

### Alternatives

| Option      | What it is                                                                                                                                           | vs Effect Logger                                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **pino**    | The de-facto fastest TS structured logger (JSON, stdout); used by Fastify etc. Best if we wanted non-Effect-wide logging or need extreme throughput. | Second logging system next to the one Effect already provides — a smell; worker/thread transport complicates Next.js standalone. |
| **tslog**   | Pretty TypeScript-native logger, class/style-first.                                                                                                  | Nice dev UX, but adds a dependency for what Effect gives free; less standard.                                                    |
| **winston** | Old-guard general-purpose logger.                                                                                                                    | Heavier object API, no benefit over pino, and same duplication problem.                                                          |

**Decision:** Effect `Logger` everywhere, logs to stdout as an event stream
(12-factor). Apps/scripts outside Effects use `console` until they move into
Effects. Revisit pino only if non-Effect logging dominates one day.

---

## 2. Error tracking

Errors aggregated, de-duplicated, alerting with stack traces and release
versions. This is the highest-ROI runtime tool — today a production 500 is
invisible.

### Options

| Option                                       | What it is                                                                                                                                                                  | Operational weight                                                         | Fit                                                                                 |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Sentry (self-hosted edition)**             | The TS-ecosystem standard; `@sentry/nextjs` auto-instruments server actions, React components, the `onRequestError` hook. Self-hosted edition is the full official product. | Heavy: ~10+ containers (Kafka, ClickHouse, …), several GB RAM.             | Best client; heavy to carry solo.                                                   |
| **GlitchTip** — **chosen**                   | Open-source Sentry-compatible; speaks the Sentry SDK protocol, so we still use `@sentry/nextjs` and can migrate to hosted Sentry by changing a DSN.                         | Light: 2–3 containers (web + worker + Postgres we already run / separate). | ~90% of the value at ~10% of the ops cost.                                          |
| **OTel-only (no error tool)**                | Rely on logged exceptions + Loki/ClickHouse search.                                                                                                                         | None beyond Tier-2 telemetry.                                              | Fallback option, not a first choice — alerting & dedup are what errors get lost in. |
| **Rollbar / Honeybadger / Bugsnag** (hosted) | Commercial SaaS.                                                                                                                                                            | None, but violates self-host posture.                                      | Out of scope per constraints.                                                       |

**Decision:** `@sentry/nextjs` pointing at **GlitchTip** self-hosted.
Client stays Sentry-protocol compatible either way. Initialize once from
Next.js `instrumentation.ts`; wire the `onRequestError` hook so both server
actions (our thin shell) and render errors reach it.

---

## 3. Health endpoint & uptime

### Health endpoint (prerequisite for everything here)

- `/api/health` route handler in `apps/web`: returns ok + app version, and
  executes a `SELECT 1` through the existing `DB` service (not "just serve
  200") so a DB outage flips it to unhealthy.
- Docker `healthcheck:` in the app service hits that endpoint; Postgres
  service gets its own `pg_isready` healthcheck.
- Next.js `instrumentation.ts` is also where logging/Sentry/OTel init lives,
  covering both serverless and standalone-server cold starts.

### Uptime monitors (watch the health endpoint, alert when it degrades)

| Option                       | What it is                                                           | Operational weight | Fit                                                                                  |
| ---------------------------- | -------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------ |
| **Gatus** — **chosen**       | Health checks as code (YAML), Prometheus-style metrics, 1 container. | Trivial.           | Config-as-code fits the repo; easy to version alongside compose.                     |
| **Uptime Kuma**              | Popular polished UI, many notifier types, 1 container.               | Trivial.           | Better UX, but UI-configured state isn't in version control.                         |
| **Compose healthcheck only** | No external watcher.                                                 | None.              | Detects container death but doesn't alert a human — not enough once the app matters. |

**Decision:** Gatus container watching `/api/health` + Postgres; alerts to
the channel we actually read (email/Telegram/Discord). Compose healthchecks
are a given regardless.

---

## 4. Tracing & metrics (OpenTelemetry)

OpenTelemetry is the vendor-neutral standard Next.js explicitly recommends,
and Effect integrates with it natively via `@effect/opentelemetry` (Effect
traces/metrics/logs become OTel data through an `NodeSdk` layer).

### Instrumentation — **chosen**

- `@effect/opentelemetry` `NodeSdk` layer in `instrumentation.ts` — covers
  all Effect code for free (spans around use cases, log correlation).
- `@opentelemetry/instrumentation-pg` auto-spans every Drizzle query.
- Next.js's own built-in OTel instrumentation hooks into the same SDK where
  available.
- Dev: OTel SDK's console exporter only — no backend needed to start.

### Backends (only when real traffic exists)

| Option                                                  | What it is                                                                     | Operational weight                               | Fit                                                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **SigNoz** — **leaning**                                | Traces + metrics + logs in one UI, ClickHouse storage, one compose stack.      | Medium: collector + ClickHouse + query services. | Single system for all three signals; OSS-first; simplest "one thing to run".                                              |
| **Grafana LGTM stack** (Loki + Grafana + Tempo + Mimir) | Per-signal OS components behind one Grafana UI.                                | Medium-high: 4+ services to keep aligned.        | Best if we prefer best-of-breed per signal and already like Grafana; Grafana Cloud free tier is the managed escape hatch. |
| **HyperDX / Uptrace**                                   | Newer all-in-one OSS observability UIs (HyperDX also does log search UX well). | Medium.                                          | Viable alternatives; younger projects, fewer eyes.                                                                        |
| **Jaeger only**                                         | Classic tracing-only backend.                                                  | Low.                                             | Fine when starting traces-only, but we'd outgrow it (no metrics/logs).                                                    |

**Decision:** instrument with OTel now (console exporter in dev), defer the
backend until usage justifies it. Default pick then: **SigNoz**; LGTM stack
is the alternative if we ever prefer per-signal specialization.

### Log shipping / storage

| Option                                           | Note                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| **Loki** (with Alloy/Promtail) — if Grafana path | Ships container stdout (our Effect JSON logs) cheaply; label-indexed. |
| **SigNoz logs** (ClickHouse) — if SigNoz path    | One system already ingests OTel logs, including Effect's.             |
| Plain `docker logs` + `grep`                     | Fine at day-1 scale; replaced by the above at Tier 2.                 |

---

## 5. Operations hygiene

### Deploy workflow with a migration release step

- GitHub Actions workflow (or the same for a server pull-deploy): build image
  → run `drizzle-kit migrate` against the target DB → deploy new version →
  smoke-check `/api/health`.
- Alternative considered: "run server actions boot-time checks" or manual SSH
  — manual is the current state; it doesn't scale and skips the health gate.

### Database backups — **chosen: `pg_dump` now, WAL later if needed**

| Option                                                                       | What it is                                                     | When                                                   |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| `just db-backup` recipe (`pg_dump -Fc`, timestamped, keep-N) + scheduled run | Dead simple, human-restorable, zero infra. — **chosen**        | Now.                                                   |
| pgBackRest                                                                   | Incremental + WAL archiving, industry standard for serious PG. | When data becomes precious / restore-time RPO matters. |
| WAL-G                                                                        | Similar purpose, different tooling.                            | Same trigger as above.                                 |

### ADR

When first phases land, record the decisions as
`docs/decisions/0005-observability.md` (why, alternatives, consequences),
matching ADR-0001…0004 convention.

---

## 6. Deliberately not adopted (yet)

| Tool                                 | Why not                                                           |
| ------------------------------------ | ----------------------------------------------------------------- |
| pino / winston / tslog               | Effect Logger already covers the app; two loggers is duplication. |
| Datadog / New Relic / Axiom hosted   | SaaS + cost, violates self-host/OSS posture.                      |
| Sentry (self-hosted full edition)    | Too heavy to operate while GlitchTip covers the protocol.         |
| Storybook / Chromatic / perf benches | Deferred per ADR-0003; unrelated to runtime observability.        |

## Summary table

| Category          | Primary                                      | Alternative            | SaaS escape hatch     |
| ----------------- | -------------------------------------------- | ---------------------- | --------------------- |
| Logging           | Effect `Logger` (structured, stdout)         | pino                   | —                     |
| Error tracking    | GlitchTip + `@sentry/nextjs`                 | Sentry self-hosted     | hosted Sentry         |
| Health/uptime     | `/api/health` + Gatus                        | Uptime Kuma            | Better Stack          |
| Tracing/metrics   | `@effect/opentelemetry`                      | `@sentry/nextjs` perf  | Grafana Cloud         |
| Telemetry backend | SigNoz                                       | Grafana LGTM / HyperDX | Grafana Cloud / Axiom |
| Logs storage      | SigNoz logs or Loki (follows backend choice) | —                      | Grafana Cloud         |
| Backups           | `pg_dump` recipe + schedule                  | pgBackRest / WAL-G     | managed PG            |

## Related

- [Plan](observability-plan.md) — phased rollout order
- ADR-0001 (Effect), ADR-0003 (Next.js/Web layer pattern), ADR-0004 (env
  validation) — constraints applied above
