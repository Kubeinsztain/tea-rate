# ADR-0002: PostgreSQL + Drizzle for persistence

- Status: accepted
- Date: 2026-10-15

## Context

The app needs a catalog of teas plus per-user journal entries, and must run both
serverless and self-hosted.

## Decision

Use **PostgreSQL** with **Drizzle ORM** (`drizzle-orm@0.45.x`, the stable 0.x
line) over the classic `pg` driver, wrapped in `Effect.tryPromise` inside the
repositories.

- Postgres is portable across Vercel/Neon (serverless), a Docker container
  (self-hosted), and scales to the future community features (ratings, likes,
  relationships).
- Drizzle is SQL-first, TypeScript-first, and has no runtime codegen.
- Migrations via `drizzle-kit`.

We deliberately chose the stable 0.x line + `pg` driver over Drizzle's new v1.0
native Effect driver (`drizzle-orm/effect-postgres`), which is still in
release-candidate and was compiled against an Effect beta
(`effect@4.0.0-beta.83`) that predates the `Schema.TaggedErrorClass` →
`Schema.TaggedError` rename in stable `effect@4.0.5`. That mismatch breaks at
build time. The classic `pg` driver keeps both Drizzle and Effect on stable
versions; we can adopt the native driver later once Drizzle 1.0 stabilizes
against Effect 4.0.x.

## Consequences

- A real database is required to run the app end-to-end (local dev uses the
  `docker-compose.yml` Postgres 18 container).
- The domain is isolated from SQL; a different database would only touch
  `packages/infra`.
- The `pg` `Pool` is created once per runtime; on serverless each cold start
  opens a fresh pool (the standard tradeoff — a serverless HTTP driver such as
  `@neondatabase/serverless` can be swapped in later without touching `core`).
