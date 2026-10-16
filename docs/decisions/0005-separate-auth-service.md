# ADR-0005: Separate auth service with Better Auth on Hono

- Status: accepted
- Date: 2026-10-16

## Context

The app needs authentication: sign-up/sign-in/sign-out, sessions, password
reset, and (optional) email verification. We start with email+password; social
OAuth and magic links are later, additive options. The central question was
where auth runs — in-process inside the Next.js app, or as a separate service.

## Decision

Run **Better Auth as a separate, internal-only service** on **Hono** (Bun).
The web app exposes `/api/auth/*` and proxies to the service, owning the
httpOnly session cookie. Sessions are **database-backed** (Better Auth's
default), stored in the auth service's own database. The auth service is the
**single source of truth**: Next.js forwards session checks rather than
verifying sessions locally, so no auth logic is duplicated in web. The auth service uses its own database on the same Postgres instance
(Drizzle adapter) and sends email (verification, password reset) via generic
**SMTP**.

Considered and rejected:

- **In-process (Better Auth mounted in Next.js)** — one deployable, native
  cookies, and hop-free session reads; rejected in favor of a clean identity
  boundary and independent scaling, accepting the cost of a second deployable.

## Consequences

- Two deployables: `apps/web` (public surface) and `apps/auth` (internal
  service, reached only through Next.js).
- Identity is its own bounded context. `User`/`Session` live in the auth
  service; the journal app will reference users by ID only. Wiring ownership
  (a `userId` on tasting notes) is explicitly deferred.
- Every server-side session check in Next.js is a network hop to the auth
  service — the deliberate trade for a single source of truth.
- Sessions are database-backed, so revocation is instant (delete the session
  row); no separate revocation list is needed.
- `@repo/core` is untouched — auth is a separate concern, not a `core` port.

## See also

- [0003-nextjs-integration](./0003-nextjs-integration.md) — Next.js as the driving adapter
- [0002-postgres-drizzle](./0002-postgres-drizzle.md) — Postgres + Drizzle persistence
- [0004-env-validation](./0004-env-validation.md) — env schema to be extended with auth variables
