# Plan: Auth

> Source spec: `docs/work/auth/auth-spec.md`

## Architectural decisions

Durable decisions that apply across all phases (from the spec's Implementation
and Testing Decisions, and ADR-0005):

- **Routes**: `apps/web` exposes `/api/auth/*` as a thin proxy to the auth
  service. The auth service serves Better Auth's standard endpoints
  (`sign-up/email`, `sign-in/email`, `sign-out`, `get-session`,
  `forget-password`, `reset-password`, `verify-email`).
- **Schema**: Better Auth's `user` and `session` tables live in the auth
  service's own Postgres database (same instance), managed with Drizzle. No
  `account` table — OAuth is deferred.
- **Key models**: `User` and `Session` (see glossary in `docs/context/terminology.md`).
- **Session strategy**: database-backed sessions (Better Auth's default), stored
  in the auth service's own database. The auth service is the single source of
  truth; Next.js forwards session checks rather than verifying sessions locally.
- **Deployment**: `apps/auth` is a Hono server on Bun, internal-only. `apps/web`
  remains the only public surface.
- **Testing seam**: the auth service's HTTP boundary (the Hono-served handler,
  exercised over HTTP), with SMTP swapped for a spy. One thin forwarding test
  for the web proxy.
- **Env**: extend `@repo/env` with `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, the
  auth `DATABASE_URL`, and `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/
  `SMTP_FROM`. Fail-fast at module load.

---

## Phase 1: Auth service foundation

**User stories**: 1, 2, 3, 4, 5, 6, 7, 8, 14, 15, 16

### What to build

Stand up `apps/auth`: a Hono server hosting Better Auth with email+password
enabled and database-backed sessions, backed by a Drizzle adapter on its own Postgres
database. Extend `@repo/env` with the auth variables so misconfiguration fails
fast. Sign-up, sign-in, sign-out, and session reads work over HTTP; email
delivery is a spy/stub at this stage.

### Acceptance criteria

- [ ] `apps/auth` boots and serves Better Auth's handler over HTTP.
- [ ] Sign-up with a valid email + password creates a user and returns success.
- [ ] Duplicate-email sign-up is rejected with a clear error.
- [ ] Malformed email and weak passwords are rejected.
- [ ] Passwords are stored hashed, never plaintext, in the auth database.
- [ ] Sign-in with correct credentials returns a session and sets a cookie.
- [ ] Wrong password or unknown email is rejected without revealing which field was wrong.
- [ ] Sign-out ends the session.
- [ ] `get-session` returns the session for a valid cookie, and none otherwise.
- [ ] Auth environment variables are validated at startup (fail-fast).
- [ ] Sign-in/up attempts are rate-limited.
- [ ] Tests exercise the HTTP boundary with a spied SMTP transport.

---

## Phase 2: Next.js proxy

**User stories**: 8, 9, 17, 18

### What to build

Add a `/api/auth/*` route in `apps/web` that forwards requests to the auth
service and returns its responses, managing the httpOnly session cookie. Provide
a server-side session read that forwards the cookie to the auth service — no
session-verification logic in the web app.

### Acceptance criteria

- [ ] Requests to `/api/auth/*` in `apps/web` are forwarded to the auth service and their responses returned.
- [ ] Sign-in through the web proxy sets an httpOnly session cookie.
- [ ] A server-side helper resolves the current session by forwarding the cookie to the auth service.
- [ ] A thin forwarding test verifies the proxy reaches the auth service and passes the cookie through.

---

## Phase 3: Email

**User stories**: 10, 11, 12, 13, 19

### What to build

Replace the email stub with a real SMTP transport and wire password reset
(request + reset) and optional email verification. Verification does not gate
sign-in.

### Acceptance criteria

- [ ] A user can request a password reset and receives an email with a reset link via SMTP.
- [ ] The reset link lets the user set a new password.
- [ ] Email verification is optional — sign-in works before verification.
- [ ] Verifying an email marks the account verified.
- [ ] Verification and reset emails are sent through the configured SMTP transport; tests spy the transport and assert recipient, subject, and link.
