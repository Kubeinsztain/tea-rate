# Architecture Decision Records

Decisions that shape the `tea-rate` codebase, recorded in
[ADR](https://adr.github.io/) style. Each record explains the context, the
decision, and the consequences.

| Slug | Title | Summary |
| --- | --- | --- |
| [0001-effect-ts](./0001-effect-ts.md) | Effect-TS as the functional core | Effect-TS (v4) for the domain/application core — services, layers, and typed errors. |
| [0002-postgres-drizzle](./0002-postgres-drizzle.md) | PostgreSQL + Drizzle for persistence | PostgreSQL with Drizzle ORM on the stable 0.x line, wrapped in Effect. |
| [0003-nextjs-integration](./0003-nextjs-integration.md) | Next.js App Router as the driving adapter | Next.js App Router as the only driving adapter; thin server actions over `core` use cases. |
| [0004-env-validation](./0004-env-validation.md) | Validated environment variables with @repo/env | Fail-fast, type-safe env validation via a Zod-based `@repo/env` helper. |
| [0005-separate-auth-service](./0005-separate-auth-service.md) | Separate auth service with Better Auth on Hono | Better Auth as an internal-only Hono service proxied through Next.js; database-backed sessions, Drizzle adapter, generic SMTP. |
