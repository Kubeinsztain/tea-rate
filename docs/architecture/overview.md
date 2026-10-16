# Architecture Overview

> Hexagonal (ports & adapters) in a functional style, on the Effect ecosystem.

## Overview

tea-rate is a personal tea journal with a shared tea catalog — the seed of a
future tea-rating community. The codebase is split into a *pure* domain and
application core, with IO (HTTP, database, clock) pushed to the edges behind
interfaces ("ports"). Dependencies point inward, so the core never knows how it
is hosted or persisted.

Everything business-relevant is expressed in **Effect** (v4). The core holds no
classes for behavior: a use case is an `Effect.gen` function; its ports are
`Context.Service` tags; its errors are `Schema.TaggedError`s. Adapters are
`Layer`s wired together with `Effect.provide`.

## The one rule

> **Dependencies point inward. The core knows nothing about HTTP, DB, or clock.**

- `packages/core` imports only `effect`. It has no awareness of Next.js,
  Drizzle, `pg`, or even Node. It cannot accidentally reach for the database or
  the request.
- The outer layers depend on the inner ones, never the reverse:

```
            apps/web          (driving adapter — UI + server actions)
               │
        packages/infra        (driven adapters — Drizzle repositories, env)
               │
        packages/core         (domain + application — pure)
```

Supporting packages sit beside, not inside, the axis:

- `packages/env` — Zod env validation, consumed by `infra`.
- `packages/typescript-config` — shared tsconfigs, dev-time only.

Identity sits beside the axis too, as a separate bounded context:

- `apps/auth` — an internal-only auth service (Better Auth on Hono) that owns
  `User` and `Session`. It is **not** part of the `web → infra → core` chain;
  `apps/web` proxies `/api/auth/*` to it and forwards session checks, keeping
  auth as its own single source of truth. See
  [0005-separate-auth-service](../decisions/0005-separate-auth-service.md).

So there are **two deployables**: `apps/web` (the only public surface) and
`apps/auth` (internal, reached only through `apps/web`).

This direction is enforced by *imports alone*: `core`'s `package.json` lists only
`effect` as a dependency, so an inward-pointing import would fail to typecheck.

## How Effect maps onto the hexagon

Effect provides the functional mechanics for the hexagon, with v4 names:

| Hexagonal concept      | Effect v4 idiom                                                        |
| ---------------------- | ---------------------------------------------------------------------- |
| Port (driven interface) | `Context.Service` tag — e.g. `TeaRepository`, `JournalRepository`       |
| Adapter implementation | `Layer` implementing the tag — e.g. `TeaRepositoryLive`                  |
| Use case               | `Effect.gen` function whose `R` type lists the ports it needs            |
| Domain error           | `Schema.TaggedError` — typed, serializable (e.g. `TeaNotFound`)          |
| Dependency injection   | `Effect.provide(...)` — the compiler refuses to run an `Effect` until every port in `R` is provided |

There is **no DI container**: the `R` type parameter is the dependency list, and
`Effect.provide` is the only wiring mechanism. The compiler (not a runtime check)
guarantees a use case can never run with a missing port.

`Context.Service` and `Schema.TaggedError` are the *only* classes in the codebase
— both required by Effect's API. All behavior lives in functions and `Layer`s.

## Portability

Because the core is pure and the adapters are thin, the domain runs unchanged
across every target:

- **Node / Vercel (serverless)** — `apps/web` with `output: "standalone"`.
- **Bun (self-host)** — `apps/auth` is a `Bun.serve` server; `@repo/infra` uses
  the classic `pg` driver, which runs under Bun; `core` is runtime-agnostic.
- **Edge** — a different driving adapter can invoke the same use cases.

Only the adapter layer changes: swap the `pg` `Pool` for a serverless HTTP driver
(e.g. `@neondatabase/serverless`) or add a REST route handler — `core` and
`infra`'s repositories are untouched. See
[0003-nextjs-integration](../decisions/0003-nextjs-integration.md) and
[0002-postgres-drizzle](../decisions/0002-postgres-drizzle.md).

## Related documentation

- [modules.md](modules.md) — package-by-package breakdown
- [data-flow.md](data-flow.md) — the implemented vertical slice
- [../domains/tea-journal.md](../domains/tea-journal.md) — domain concepts
- [../context/terminology.md](../context/terminology.md) — glossary
- [../decisions/0001-effect-ts.md](../decisions/0001-effect-ts.md) — why Effect
