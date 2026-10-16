# Architecture

How tea-rate is structured. Permanent knowledge about the shape of the codebase:
hexagonal (ports & adapters) in a functional style on the Effect ecosystem.

## Documents

- [overview.md](overview.md) — the one dependency rule, the `web → infra → core`
  package graph, the auth service beside the axis, how Effect maps onto the
  hexagon, and portability.
- [modules.md](modules.md) — one section per package (`web`, `auth`, `core`,
  `infra`, `env`, `typescript-config`): responsibilities, key files,
  dependencies.
- [data-flow.md](data-flow.md) — the implemented vertical slice (form → server
  action → use case → ports → Drizzle → Postgres), plus env validation at
  startup, the DB layer, and the auth flow (proxy → auth service → Postgres).

## Related documentation

- Domain concepts: [`../domains/tea-journal.md`](../domains/tea-journal.md)
- Glossary & terminology: [`../context/terminology.md`](../context/terminology.md)
- Tech stack: [`../context/tech-stack.md`](../context/tech-stack.md)
- Decisions (ADRs): [`../decisions/`](../decisions/)
  - [0001-effect-ts](../decisions/0001-effect-ts.md) — why Effect for the core
  - [0002-postgres-drizzle](../decisions/0002-postgres-drizzle.md) — why Postgres + Drizzle
  - [0003-nextjs-integration](../decisions/0003-nextjs-integration.md) — why Next.js App Router as the driving adapter
  - [0004-env-validation](../decisions/0004-env-validation.md) — why `@repo/env`
  - [0005-separate-auth-service](../decisions/0005-separate-auth-service.md) — why auth is a separate internal service
