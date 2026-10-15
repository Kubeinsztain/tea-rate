# ADR-0003: Next.js App Router as the driving adapter

- Status: accepted
- Date: 2026-10-15

## Context

We need a server-rendered web app (not an SPA), deployable to Vercel
(serverless) or self-hosted (Docker), with a mobile client later.

## Decision

Use **Next.js App Router** as the only driving adapter for now.

- Server actions are thin shells that run `core` use cases via
  `Effect.runPromise(...pipe(Effect.provide(AppLive)))`.
- `output: "standalone"` gives a portable Node server for self-hosting; Vercel
  covers serverless.
- `@repo/core` and `@repo/infra` are consumed as source via `transpilePackages`.

## Consequences

- No business logic in the UI layer; server actions only translate between HTTP
  and the application layer.
- Adding a REST route handler or a typed `@effect/rpc` API for the mobile app
  later is just another driving adapter — no changes to `core`/`infra`.
- Storybook is deferred; presentational components live under `apps/web` with a
  clean boundary so it can be added later without touching the domain.
