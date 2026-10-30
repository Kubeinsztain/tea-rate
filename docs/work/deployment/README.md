# Deployment & operations (effort)

> Status: **proposed** — direction and stack agreed, nothing implemented yet.

Temporary workspace for the "run for real" effort: make the app deployable and
diagnosable — first on the developer's own machine, later reachable by others
(community is the roadmap goal). Decisions are recorded in
[ADR-0008](../../decisions/0008-deployment-operations.md) (platform) and
[ADR-0009](../../decisions/0009-mail-delivery-seam.md) (mail seam).

## Direction in one line

Deploy on **podman** + `podman compose` with **nginx** as the reverse proxy and
**certbot** for TLS, while the app side ships OCI images with health checks,
Effect logging, a log-only mail mode, and consolidated env.

## Decided stack

| Concern          | Decision                                                                     |
| ---------------- | ---------------------------------------------------------------------------- |
| Orchestrator     | podman + `podman compose` (daemonless, no Docker Engine)                     |
| Reverse proxy    | nginx — routes to `web`, forwards `/api/auth/*` to the auth service          |
| TLS              | self-signed for IP-only local use now; Let's Encrypt via certbot once a domain exists |
| App images       | OCI images for `apps/web` (Next `standalone`) + `apps/auth` (Bun)            |
| Migrations       | Deploy step for both databases (journal + auth)                              |
| Email            | `MailSender` seam; `consoleMailSender` default, `smtpMailSender` later        |
| Secrets          | `.env` gitignored (dev) · GitHub Environments/Actions secrets (CI) · host `.env` / podman secrets (runtime) |
| Persistence      | Postgres volume + scheduled `pg_dump`                                        |
| Operability      | `/api/health` on both services + Effect structured logging                    |

## Two tracks

1. **App-side** (orchestrator-agnostic; all code): Dockerfiles for `web` and
   `auth`, `/api/health` endpoints, Effect structured logging, the
   `consoleMailSender`, env consolidation (12-factor), and a migrate step.
2. **Platform-side** (podman + nginx): a `podman compose` stack for web + auth +
   Postgres + a migrate step, an nginx config, and certbot for TLS.

## Sequence

Agreed order of execution:

1. **Small seams** (code): `consoleMailSender` + `MAIL_MODE`, `/api/health` on
   both services, Effect structured logging.
2. **Containerization** (code): Dockerfiles for `web` + `auth`, migrate step.
3. **Platform** (hands-on): `podman compose` stack, nginx reverse proxy,
   self-signed cert (Let's Encrypt later, once a domain exists).
4. **Ownership** — the next effort, after this one.

Steps 1–2 are code and go through the `tdd` + `implement` + reviewer workflow;
step 3 is operational on the deployment host.

## Open questions (resolve during planning)

- Postgres: reuse the `compose-db-local.yml` container vs a dedicated deployment
  volume in the new compose stack.
- nginx placement: a container inside the stack vs a host-level nginx install.
- Self-signed certificate specifics for IP-only local use (domain arrives later).
- Transactional email provider (Resend/Postmark/SES) — deferred until real email
  is needed, per ADR-0009.

## Out of scope (this effort)

- User ownership (`userId` scoping) — the **immediately following** effort.
- OpenTelemetry, GlitchTip, Gatus — stay in
  [observability](../observability/README.md) for when real traffic exists.

## Exit

When implemented, promote `docs/work/deployment/` into a permanent
`docs/features/deployment/` entry and delete this directory; the ADRs remain.
