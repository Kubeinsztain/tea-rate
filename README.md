# tea-rate

A personal tea journal with a shared tea catalog — the seed of a tea-rating
community. Built with **hexagonal architecture in a functional style** on the
[Effect](https://effect.website) ecosystem.

## Stack

- **TypeScript** + **Bun** (package manager & local runtime)
- **Turborepo** monorepo (apps / packages / tools)
- **Next.js** (App Router) + **Tailwind CSS v4** for the web app
- **Effect** for the pure core (domain + use cases)
- **PostgreSQL** + **Drizzle ORM** (stable 0.x, classic `pg` driver) for persistence
- **`@repo/env`** (Zod) for validated, fail-fast environment variables
- **Biome** for linting & formatting, **Vitest** for tests

## Layout

```
apps/
  web/          Next.js app (the driving adapter: UI + server actions)
packages/
  core/         Pure domain + application (ports + use cases) — no IO
  infra/        Driven adapters: Drizzle schema, Postgres repositories
  env/          Type-safe env validation (Zod) via createEnv
  typescript-config/
docs/
  context/      Architecture overview
  decisions/    ADRs
```

Dependencies point inward: `web → infra → core`.

## Getting started

```sh
bun install
just env                      # create .env from .env.example
just db-up                    # Postgres 18 (podman compose up)
just db-generate              # create SQL migrations from the schema
just db-migrate               # apply migrations
just db-seed                  # insert a few sample teas
just dev                      # start the web app on :3000
```

`@repo/env` validates `DATABASE_URL` and `NODE_ENV` at startup and fails fast
with a clear message if they're missing or invalid (set `SKIP_ENV_VALIDATION=true`
to bypass, e.g. during Docker builds). Run `just --list` for all recipes.

## Common commands

```sh
just dev           # run all dev servers
just check         # Biome lint + format check
just check-types   # TypeScript across the monorepo
just test          # Vitest
just build         # production build (Next.js standalone output)
just db-studio     # Drizzle Studio (schema browser)
```

## Architecture in one rule

Business logic lives only in `packages/core` as pure `Effect`s over ports
(`Context.Service` tags). The web server action is a thin shell:

```ts
const note = await Effect.runPromise(
  recordTasting({ teaId, rating, notes }).pipe(Effect.provide(AppLive)),
);
```

Because `core` is IO- and framework-free, the same use cases back the web app
today and a REST/RPC API (for the future mobile app) tomorrow, and run unchanged
on Vercel, Bun self-host, or the edge.

See the [documentation index](docs/README.md) — architecture in
[docs/architecture/](docs/architecture/), domain concepts in
[docs/domains/](docs/domains/), and the ADRs in
[docs/decisions/](docs/decisions/).
