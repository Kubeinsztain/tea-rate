# ADR-0001: Effect-TS as the functional core

- Status: accepted
- Date: 2026-10-15

## Context

We want hexagonal architecture in a functional style (no classes for behavior,
typed errors, explicit dependency injection). Options considered:

- **Lightweight functional** (plain functions + `Result` + Zod)
- **Effect-TS**
- **fp-ts** (superseded by Effect)

## Decision

Use **Effect-TS** (`effect` v4) for `packages/core`.

- Ports are `Context.Service` services; adapters are `Layer`s.
- Use cases are `Effect.gen` functions; the `R` type parameter *is* the list of
  required ports.
- Domain errors are `Schema.TaggedError`, validation is `Schema`.

## Consequences

- Strong, compiler-enforced dependency injection with no DI container.
- Typed, composable error handling.
- A learning curve; mitigated by confining Effect to `core`/`infra` and keeping
  the web layer thin.

## See also

- [overview.md](../architecture/overview.md)
