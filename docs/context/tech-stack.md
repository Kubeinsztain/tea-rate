# Tech Stack

> The stack as built (Oct 2026). One line of rationale each.

## Language & tooling

- **TypeScript 7.0.2** — typed functional core; Effect's API is designed around
  TypeScript's type system.
- **Bun 1.4.2** — package manager and local runtime in one fast tool.
- **Turborepo 2.11.8** — monorepo orchestration with task caching.

## Web

- **Next.js 16.3.8** (App Router, `output: "standalone"`) — the driving adapter;
  server actions run use cases, standalone output keeps self-hosting simple.
- **React 19.2.8** — the UI layer of the web adapter.
- **Tailwind CSS v4** — utility-first styling.

## Core & persistence

- **Effect v4.0.5** — ports (`Context.Service`), adapters (`Layer`), use cases
  (`Effect.gen`), validation and tagged errors (`Schema`).
- **Drizzle ORM 0.45.4** + **`pg`** — typed schema and lightweight migrations on
  the classic node-postgres driver.
- **PostgreSQL 18** — durable relational store for catalog and journal.

## Config & env

- **`@repo/env`** (Zod 4.6.5) — validated, fail-fast environment variables.

## Quality

- **Biome 2.5.14** — lint + format + import sorting in one tool.
- **gitleaks** — secret scanning in pre-commit (lefthook) and CI.
- **Vitest 5** — unit tests; the core is tested with in-memory fake `Layer`s.
- **just 1.58** — task runner; recipes for env, DB, dev, build, test, cleanup.
- **Renovate + GitHub Actions + lefthook** — dependency updates, CI, and git
  hooks respectively.

## Related

- [Repository map](repository-map.md) — which package uses which.
- [Decisions](../decisions/README.md) — why each major choice was made.
