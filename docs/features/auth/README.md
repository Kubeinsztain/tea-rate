# auth — email+password authentication

> An internal-only auth service (Better Auth on Hono, Bun), proxied through the
> Next.js web app. Foundation only — identity is wired, data ownership is not.

## Overview

`apps/auth` is a separate, **internal-only** service that owns identity: users,
passwords, and sessions. `apps/web` is the only public surface and exposes a
thin `/api/auth/*` proxy to it, so the browser talks to auth at the web app's
origin and the web app owns the httpOnly session cookie.

What a user can do today:

- **Sign up** with email + password (hashed, never plaintext).
- **Sign in** / **sign out**, with rate limiting on attempts.
- **Reset** a forgotten password via an emailed link.
- **Verify** their email — optional, not a gate on sign-in.

Sessions are **database-backed**, stored in the auth service's own Postgres
database. The auth service is the **single source of truth** for session
validity; Next.js forwards session checks to it rather than verifying sessions
locally. Email goes out over generic **SMTP** (nodemailer). Environment is
validated fail-fast via `@repo/env`.

This is a **foundation**, not a feature-complete identity system: no social
OAuth, magic links, or 2FA, and no `userId`/ownership wiring in the journal
domain yet (`@repo/core` is untouched). See
[ADR-0005](../../decisions/0005-separate-auth-service.md) for the rationale.

## Where it lives

- `apps/auth/` — the auth service (Hono + Better Auth, Drizzle, nodemailer).
- `apps/web/app/api/auth/[...all]/route.ts` — the public proxy route.
- `apps/web/lib/auth/` — `getCurrentSession` helper + request forwarding.

`apps/web`'s `AUTH_SERVICE_URL` (root `.env`) points the proxy at the auth
service; the auth service's own config lives in `apps/auth/.env`.

## Running it

1. **Auth database** (own database on the shared Postgres instance):
   ```sh
   just db-auth-create   # CREATE DATABASE tea_rate_auth
   just db-auth-migrate  # apply Better Auth schema
   ```
2. **Env** — copy `apps/auth/.env.example` → `apps/auth/.env` and set the auth
   vars; ensure root `.env` has `AUTH_SERVICE_URL` (default `http://localhost:4000`).
3. **Run** the auth service and the web app:
   ```sh
   just auth-dev   # auth service on :4000
   just dev        # web app on :3000
   ```
4. **Test** the auth service over its HTTP boundary (SMTP spied):
   ```sh
   just auth-test
   ```

Auth environment variables (validated fail-fast at startup):

| Variable             | Purpose                                                            |
| -------------------- | ----------------------------------------------------------------- |
| `DATABASE_URL`       | The auth service's *own* database (must not point at the journal DB). |
| `BETTER_AUTH_SECRET` | Secret for Better Auth (≥ 32 chars).                                |
| `BETTER_AUTH_URL`    | Internal base URL of the auth service (`http://localhost:4000`).    |
| `WEB_ORIGIN`         | Public web origin (`http://localhost:3000`); trusted origin + email-link origin. |
| `SMTP_HOST/PORT/USER/PASS/FROM` | SMTP delivery for verification + reset email.             |
| `PORT`               | Listen port (default `4000`).                                       |

`WEB_ORIGIN` feeds **both** Better Auth's `trustedOrigins` and the origin used
to rewrite reset/verification links, so user-facing links route through the
public `/api/auth/*` proxy rather than the internal origin.

## Structure

### `apps/auth` (the service)

- `src/index.ts` — `Bun.serve` entrypoint; wires db, auth, mail sender, Hono app.
- `src/app.ts` — `createApp`: a Hono app that forwards every method at
  `/api/auth/*` to Better Auth's handler.
- `src/auth.ts` — `createAuth`: Better Auth config (email+password, database-backed
  sessions, Drizzle adapter, optional email verification, rate limiting, SMTP mail).
- `src/env.ts` — `createEnv` for the auth variables (fail-fast).
- `src/db/schema.ts` — Better Auth tables `user`, `session`, `account`,
  `verification`.
- `src/db/client.ts` — `makeDatabase`: Drizzle over a `pg` `Pool`.
- `src/mail/sender.ts` — `MailSender` seam (tests inject a spy).
- `src/mail/smtp.ts` — `smtpMailSender` over nodemailer.
- `drizzle.config.ts` — `drizzle-kit` config (postgresql dialect).

### `apps/web` (the public surface)

- `app/api/auth/[...all]/route.ts` — proxies every method/path under
  `/api/auth/*` to the auth service, returning status/body/`Set-Cookie`
  unchanged.
- `lib/auth/forward.ts` — `forwardAuthRequest`: copies the request, strips
  hop-by-hop headers, forwards to the auth service.
- `lib/auth/get-session.ts` — `getCurrentSession(cookieHeader)`: forwards the
  browser's cookie to the auth service's `get-session`; no session verification
  in the web app.
- `lib/env.ts` — validates `AUTH_SERVICE_URL`.

## Out of scope

- Ownership: no `userId` on journal data, no scoping to the signed-in user.
- Social OAuth, magic links, two-factor auth, passkeys, organizations.
- Making email verification a mandatory gate (it stays optional).
- Any change to `@repo/core` or the journal domain.

## Related documentation

- [ADR-0005 — separate auth service](../../decisions/0005-separate-auth-service.md)
- [Architecture overview](../../architecture/overview.md) — where auth sits relative to the axis
- [Data flow](../../architecture/data-flow.md) — the auth request/email flows
- [env feature](../env/README.md) — the `@repo/env` validation this service uses
- [Terminology](../../context/terminology.md) — `Auth service`, `User`, `Session`
