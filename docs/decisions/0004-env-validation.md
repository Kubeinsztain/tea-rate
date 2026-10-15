# ADR-0004: Validated environment variables with @repo/env

- Status: accepted
- Date: 2026-10-16

## Context

The app originally read `DATABASE_URL` as `process.env.DATABASE_URL ?? ""` in
the DB layer and Drizzle config, with no validation. A missing or invalid value
failed lazily — a cryptic connection error deep inside a query, or a drizzle-kit
migration error — rather than a clear message at startup. We wanted type-safe,
fail-fast validation of environment variables before the app serves traffic.

## Decision

Validate environment variables with **`@repo/env`**, a Zod-based helper
(`createEnv` + `presets`), copied from another project and adapted.

- `packages/infra/src/env.ts` defines
  `env = createEnv({ server: { DATABASE_URL: z.string().url() }, shared: { NODE_ENV: presets.nodeEnv } })`.
- The DB layer reads `env.DATABASE_URL` instead of `process.env`.
- Validation runs at module load (when the server first imports `@repo/infra`),
  so the app fails fast with a clear `InvalidEnvironmentVariablesError`.
- `SKIP_ENV_VALIDATION=true` bypasses validation (e.g. during Docker builds).

Alternatives considered:

- **Effect `Config` + `Schema`** — idiomatic within the Effect stack, no new
  dependency; rejected because the user already had the `@repo/env` package and
  wanted to reuse it.
- **`@t3-oss/env-nextjs` (Zod)** — popular, but another dependency and heavier
  Next coupling.
- **`envalid`** — lightweight, but less flexible.
- **Hand-rolled validation** — reinventing what `@repo/env` already does.

## Consequences

- Fail-fast startup validation with clear messages.
- A Zod dependency in `packages/infra` alongside Effect Schema (env validation
  at the boundary; the domain/application layer still uses Effect Schema).
- `@repo/env` is a built package (tsdown → `dist/`); `loadEnvFiles` was split to
  a subpath (`@repo/env/load-env-files`) so `dotenv`/`node:fs` aren't bundled
  into the main entry (avoids a Turbopack whole-project-tracing warning).
- `turbo.json` `check-types` and `dev` depend on `^build` so `@repo/env` builds
  before its consumers.
- Only `DATABASE_URL` and `NODE_ENV` are validated today; extend the schema as
  new variables are added.

## See also

- [0001-effect-ts](./0001-effect-ts.md)
- [../features/env/README.md](../features/env/README.md)
- [../architecture/data-flow.md](../architecture/data-flow.md)
