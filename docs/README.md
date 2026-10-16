# Documentation

> tea-rate — a personal tea journal with a shared tea catalog, the seed of a
> tea-rating community. Hexagonal architecture in a functional style on the
> [Effect](https://effect.website) ecosystem.

New here? Read [repository-map](context/repository-map.md) to orient yourself,
then [tech-stack](context/tech-stack.md) to see what we build with. Everything
else branches from there.

## Context

How we talk and how we work — shared vocabulary and conventions.

- [Context index](context/README.md)
- [Terminology](context/terminology.md) — ports, adapters, Tea, journal…
- [Tech stack](context/tech-stack.md) — what we use and why
- [Repository map](context/repository-map.md) — workspace layout
- [Coding guidelines](context/coding-guidelines.md) — conventions to follow

## Architecture

The system as a whole: hexagonal (ports & adapters) structure, module
boundaries, and data flow.

- [Architecture index](architecture/README.md)

## Domains

Business concepts independent of any layer or framework.

- [Domains index](domains/README.md)

## Features

One directory per feature; each `README.md` is that feature's entry point.

- [Features index](features/README.md)

## Decisions

Recorded architecture decisions (ADRs) — why, alternatives, consequences.

- [Decisions index](decisions/README.md)
- [ADR-0001: Effect-TS](decisions/0001-effect-ts.md)
- [ADR-0002: PostgreSQL + Drizzle](decisions/0002-postgres-drizzle.md)
- [ADR-0003: Next.js as driving adapter](decisions/0003-nextjs-integration.md)
- [ADR-0004: env validation](decisions/0004-env-validation.md)
- [ADR-0005: separate auth service](decisions/0005-separate-auth-service.md)

## Current Work

In-progress efforts, handoffs, specs, and plans live under
[`work/`](work/) — one directory per effort. This is temporary space:
useful bits get promoted into the permanent sections above, the rest gets
deleted.

- [Observability tooling](work/observability/README.md) — proposed
  monitoring/logging/ops stack: Effect logging, GlitchTip, Gatus,
  OpenTelemetry; alternatives compared, phased plan.

## Direction

The roadmap, from where we are to where we're going:

1. **Journal + catalog** *(today)* — record tastings against a shared tea list.
2. **Inventory** — track the teas you own.
3. **Community** — shared ratings, reviews, social features.
4. **Mobile app** — a typed REST/RPC API as a second driving adapter.
5. **Possibly open-source** — once the model proves out.
