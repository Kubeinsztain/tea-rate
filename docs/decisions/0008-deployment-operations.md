# ADR-0008: Self-hosted deployment on podman with nginx

- Status: accepted
- Date: 2026-10-30

## Context

The app needs to run "for real": first on the developer's own machine, later
reachable by others (community is the roadmap goal). Today there is only a
Postgres-only compose file and manual `just` recipes — no app containers, no
health checks, no structured logging, and the auth service hard-requires SMTP.
We had to pick an orchestrator, reverse-proxy, and TLS path, and we wanted the
work to remain useful whether it ends up running on a laptop or a VPS.

## Decision

Deploy on **podman** with **`podman compose`**, using **nginx** as the reverse
proxy and **certbot** for TLS.

- **Containers**: OCI images (Dockerfiles) for `apps/web` (Next `standalone`) and
  `apps/auth` (Bun), orchestrated with `podman compose`. No Docker Engine
  anywhere.
- **Reverse proxy**: nginx routes to the web app and forwards `/api/auth/*`
  through to the auth service.
- **TLS**: a self-signed certificate for local/IP-only use now (no domain yet);
  **Let's Encrypt via certbot** once a domain exists, scriptable for CI/CD.
- **Migrations** run as a deploy step for both databases (journal and auth), not
  interactively.
- **Secrets** live outside the repo at every layer: a gitignored `.env` for local
  dev (already protected by the agent deny rules, repo scope, and command
  gating), GitHub Environments/Actions secrets for CI, and a host `.env`
  (`chmod 600`) or podman secrets for runtime.

Considered and rejected:

- **Docker + Docker Compose** — the more common path, but Docker's daemon is a
  persistent system dependency; podman is daemonless and matches the local dev
  setup already in use. Rejected.

## Consequences

- The whole stack is **podman-only**: no Docker Engine or daemon on the dev
  machine or the deployment host.
- Reverse-proxy and TLS configuration is **hand-written** (nginx + certbot),
  which teaches the primitives but carries per-deploy ceremony and no managed
  backups or rollbacks.
- The app-side work (images, health endpoints, structured logging, mail mock,
  env consolidation, migrate step) is orchestrator-agnostic and unchanged.
- User ownership (`userId` scoping) remains the **next** effort, unchanged by
  this decision.

## See also

- [ADR-0003](./0003-nextjs-integration.md) — `output: "standalone"`, the basis
  for the web image.
- [ADR-0004](./0004-env-validation.md) — fail-fast env, extended for deployment.
- [ADR-0005](./0005-separate-auth-service.md) — the second deployable being
  containerized.
- [ADR-0006](./0006-secrets-in-tracked-docs.md) — secrets stay out of tracked docs.
- [ADR-0009](./0009-mail-delivery-seam.md) — the mail seam that makes SMTP optional.
