# Coding Guidelines

> Conventions to follow when writing code in this repo.

## Functional style, no behavior classes

- **No behavior lives in classes.** `Context.Service` (ports) and
  `Schema.TaggedError` (domain errors) are the *only* classes — both required by
  Effect's API.
- **Use cases are `Effect.gen` functions**; their `R` type parameter lists the
  required ports. Prefer `Effect.fn` for reusable helper functions.
- **Domain errors are `Schema.TaggedError`**; validation uses `Schema`;
  literal unions use `Schema.Literals([...])`.

## Effect v4 terms only

Never use Effect v3 names. Ports are `Context.Service` tags (not
`Context.Tag`), adapters are `Layer`s, and dependency injection uses
`Effect.provide(...)`.

## Imports

- Use **`import type`** for type-only imports (Biome enforces this).
- Biome handles linting, formatting, and **import sorting** — run `just check`.

## Package consumption

- **Source-first packages** (`core`, `infra`) are consumed via
  `transpilePackages` — you edit their source and the app picks it up directly.
- **`env` is built** (tsdown) and consumed from its build output.

## Environment variables

- Read env **only via `@repo/env`** — never raw `process.env` in app code.
- Env is validated at startup and fails fast; `SKIP_ENV_VALIDATION=true`
  bypasses it (e.g. during Docker builds).

## Testing

- Unit-test the core against **in-memory fake `Layer`s** — no database.
- Keep the web layer thin; exercise use cases end-to-end through a server
  action.

## Related

- [Terminology](terminology.md) — the exact meaning of port, layer, use case.
- [Repository map](repository-map.md) — where each rule applies.
