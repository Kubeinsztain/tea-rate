# Auth — Spec

> Email+password authentication as a separate internal auth service (Better Auth
> on Hono), proxied through Next.js. Foundation only — no data ownership wiring
> yet.

## Problem Statement

tea-rate has no authentication. The journal is implicitly single-user: there are
no accounts, no passwords, no sessions, and no way to recover a forgotten
password. Anyone who can reach the app can use it, and there is no notion of
"my" data. Before the roadmap can reach inventory, community, or mobile, we need
a solid identity foundation — established now so that later work (scoping data
to a user, social logins, a mobile client) is additive rather than a rewrite.

## Solution

Introduce a dedicated **auth service** (Better Auth on Hono, running on Bun)
that is internal-only, and proxy it through the Next.js web app. A user can sign
up with email + password, sign in, sign out, reset a forgotten password via
email, and optionally verify their email address. Sessions are
database-backed (stored in the auth service's own database); the auth service
is the single source of truth for session validity, and Next.js forwards
session checks to it rather than verifying sessions locally. Next.js owns the httpOnly session cookie. Identity becomes its own
bounded context: `User` and `Session` live in the auth service, referenced
elsewhere by ID only.

This is a **foundation**, not a feature-complete identity system. It does not
yet attach a user to journal data (ownership), nor does it add social OAuth or
magic links — those are deferred but not closed off.

## User Stories

1. As a new user, I want to sign up with an email and password, so that I can create an account.
2. As a new user, I want my password to be stored securely (hashed, never in plaintext), so that it cannot be read from the database.
3. As a new user, I want to be told clearly if my chosen email is already registered, so that I can sign in instead.
4. As a new user, I want to be told clearly if my password is too weak or my email is malformed, so that I can correct my input.
5. As a user, I want to sign in with my email and password, so that I can establish an authenticated session.
6. As a user, I want a wrong password or unknown email to be rejected without revealing which field was wrong, so that account enumeration is harder.
7. As a user, I want to sign out, so that my session is ended on this device.
8. As a signed-in user, I want my session to persist across requests via a cookie, so that I stay signed in as I navigate.
9. As a signed-in user, I want the system to be able to answer "who is the current user?", so that the UI and future features can reflect my identity.
10. As a user who forgot my password, I want to request a password reset by email, so that I can regain access.
11. As a user resetting my password, I want a reset link that lets me set a new password, so that I can recover my account.
12. As a user, I want my email verification to be optional (I can sign in before verifying), so that sign-up isn't blocked on inbox access.
13. As a user, I want to verify my email address, so that my account can be marked verified.
14. As a user, I want rate limiting on sign-in/up attempts, so that brute-force attacks are slowed.
15. As an operator, I want auth to fail fast at startup if a required secret or SMTP setting is missing, so that misconfiguration is caught immediately.
16. As a developer, I want auth served from a separate internal service, so that identity is a clean bounded context I can reason about in isolation.
17. As a developer, I want the web app to proxy `/api/auth/*` to the auth service, so that there is a single public surface with no CORS or cross-origin cookie complexity.
18. As a developer, I want the web app to forward session checks to the auth service (rather than verify sessions itself), so that auth logic lives in exactly one place.
19. As a developer, I want email delivered over generic SMTP, so that the app stays self-hostable without a SaaS email provider.
20. As a future mobile developer, I want sessions represented as verifiable tokens served from the same auth service, so that a future mobile client can authenticate through the same surface.

## Implementation Decisions

- **New deployable** `apps/auth`: a Hono server hosting Better Auth, running on
  Bun. It is internal-only — reachable from `apps/web`, never directly from the
  public internet.
- **Better Auth configuration**: email + password enabled; database-backed
  sessions (Better Auth's default); Drizzle adapter pointing at the auth
  service's own database; generic SMTP email sender; email verification
  optional.
- **Auth database**: a separate database on the existing Postgres 18 instance,
  owned by the auth service (its own `DATABASE_URL`). Better Auth's `user` and
  `session` tables live there, managed with Drizzle migrations.
- **Web proxy**: the Next.js app exposes an `/api/auth/*` route that forwards
  requests to the auth service and returns its responses. Next.js sets/owns the
  httpOnly session cookie. Server components and server actions obtain the
  session by forwarding the cookie to the auth service (`get-session`).
- **Single source of truth**: the auth service validates all sessions. Next.js
  does not verify sessions locally; no auth logic is duplicated in `apps/web`.
- **Email**: verification and password-reset emails are sent through an SMTP
  client. The transport is injectable so tests can substitute a spy.
- **Environment**: extend `@repo/env` with auth variables — the Better Auth
  secret and base URL, the auth database URL, and SMTP host/port/user/pass/from.
  Validation remains fail-fast at module load.
- **Core untouched**: `@repo/core` gains no new ports or types. Auth is a
  separate concern, not a journal-domain concept, so no `userId`/ownership
  change is made to `Tea`, `TastingNote`, or their repositories.
- **Boundary**: identity is its own bounded context. The journal app will, in a
  future effort, reference users by ID only.

## Testing Decisions

- **One seam**: the auth service's HTTP boundary — the Hono-served Better Auth
  handler, exercised over HTTP. Tests sign up, sign in, sign out, session reads,
  password reset, and email verification by issuing real HTTP requests and
  asserting status codes, response bodies, and `Set-Cookie` headers.
- **SMTP is spied**: email delivery is verified by asserting the SMTP transport
  received the expected recipient/subject/link, never by sending real mail.
- **Web proxy** gets a single thin forwarding test (a request to the proxy route
  reaches the auth service and the session cookie passes through).
- **Good tests assert external behavior only** — status codes, cookie presence,
  returned session shape — never Better Auth's internals or implementation
  details.
- **Database**: tests run against a throwaway auth database with migrations
  applied (mirroring how the core is tested against in-memory fakes, adapted for
  a persistence-heavy service).

## Out of Scope

- Ownership: adding a `userId` to `tasting_notes`/journal data, and scoping data
  to the signed-in user.
- Social OAuth (Google, GitHub…), magic links, two-factor auth, passkeys,
  organizations/admin.
- Making email verification a mandatory gate (it is optional).
- Building the mobile client or the REST/RPC API surface.
- Any journal-domain change in `@repo/core`.

## Further Notes

- Better Auth is self-hosted: user and session data live in our Postgres, and we
  deploy it ourselves — consistent with the project's self-hosting posture.
- Future mobile authenticates through Next.js as the BFF/API gateway (the
  roadmap's step 4), not directly against the internal auth service.
- Social OAuth and magic links are additive Better Auth plugins/providers; the
  email+password start does not preclude enabling them later.
- See [ADR-0005](../../decisions/0005-separate-auth-service.md) for the topology
  and session-strategy rationale.
