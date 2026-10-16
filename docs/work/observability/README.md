# Observability tooling (effort)

> Status: **proposed** — direction agreed, nothing implemented yet.

Temporary workspace for the monitoring/logging/operations effort: make the
app diagnosable in production (self-hosted Docker, open-source-first posture).

## Contents

- [Tooling notes](observability-notes.md) — candidate tools, alternatives, and
  short comparisons per category (logging, errors, uptime, telemetry, servers,
  ops). The reference for choosing each piece.
- [Plan](observability-plan.md) — phased execution plan with effort estimates.

## Direction in one line

Effect-native structured logging + a `/api/health` endpoint first (no new
services), then GlitchTip/Gatus for errors and uptime, then OpenTelemetry into
a self-hosted backend (SigNoz or Grafana LGTM) when real traffic exists.

## Constraints (from the discussion)

- Deployment: **self-hosted Docker** (matches `output: "standalone"`, ADR-0003)
- Stack posture: **open-source first, self-hosted** where possible
- Effect is central — prefer Effect-native APIs over adding a second logging
  or telemetry framework

## Exit

When implemented, promote the decisions into `docs/decisions/0005-observability.md`
(ADR) and a permanent `docs/features/observability/` entry; delete this
directory. Useful reference tables in the notes can move into the ADR.
