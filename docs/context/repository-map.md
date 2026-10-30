# Repository Map

> What lives where. Dependencies point inward: `web → infra → core`, and `core`
> imports nothing from the repo.

```
tea-rate/
├── apps/
│   ├── web/                  Next.js driving adapter (UI + server actions, /api/auth/* proxy)
│   └── auth/                 internal auth service (Better Auth on Hono, Bun)
├── packages/
│   ├── core/                 pure domain + application (ports + use cases) — no I/O
│   ├── infra/                driven adapters: Drizzle schema, Postgres repos, env.ts
│   ├── env/                  @repo/env — validated env vars (built with tsdown)
│   └── typescript-config/    shared tsconfigs: base / library / nextjs / react-library
├── tools/                    (empty — reserved for repo tooling)
├── justfile                  task runner recipes
└── compose-db-local.yml      local Postgres 18
```

## `apps/web`

The **driving adapter**. A Next.js App Router app (`output: "standalone"`) whose
server action is a thin shell that runs the `recordTasting` use case with
`Effect.provide(AppLive)`. Contains no business logic. Also the **only public
surface**: it proxies `/api/auth/*` to the auth service and owns the httpOnly
session cookie.

## `apps/auth`

The **identity service** (Better Auth on Hono, Bun), internal-only. Owns `User`
and `Session` in its own Postgres database (Drizzle adapter); sessions are
database-backed and the auth service is the single source of truth. Sends
verification/reset email over SMTP (nodemailer). Env validated via `@repo/env`.
Sits beside the `web → infra → core` axis, not inside it — see
[ADR-0005](../decisions/0005-separate-auth-service.md).

## `packages/core`

The **pure domain + application**: `src/domain/` (schemas for `Tea` and
`TastingNote`, tagged errors) and `src/application/` (the `recordTasting` use
case and its `ports.ts`). No I/O, no framework — imports nothing from the repo.
Unit-tested with in-memory fake `Layer`s.

## `packages/infra`

The **driven adapters**: `src/db/` (Drizzle schema, `AppLive` layer, seed) and
`src/repositories/` (`tea-repository`, `journal-repository`) over PostgreSQL.
Also `env.ts`. Implements `core`'s ports.

## `packages/env`

**`@repo/env`** — validated, fail-fast environment variables (`DATABASE_URL`,
`NODE_ENV`) via Zod. The only package that reads `process.env`; everything else
imports from here. Built (not transpiled) with tsdown.

## `packages/typescript-config`

**Shared tsconfigs** consumed by every package: `base`, `library`, `nextjs`, and
`react-library`.

## `justfile`

Task runner (`set dotenv-load`). Recipes: `env`, `db-up`/`db-down`/`db-reset`,
`db-generate`/`db-migrate`/`db-seed`/`db-studio`, `dev`, `build`, `check`,
`check-types`, `test`, `clean`, `nuke`.

## `compose-db-local.yml`

Local **PostgreSQL 18** service with a persisted `pgdata` volume, exposed on
`5432`.

## Related

- [Tech stack](tech-stack.md) — the libraries behind each package.
- [Architecture](../architecture/README.md) — how the packages compose.
