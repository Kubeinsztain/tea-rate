# Modules

> One section per package: responsibilities, key files, dependencies.

The packages form a dependency arrow `web → infra → core`, with `env` and
`typescript-config` as supporting packages, and `apps/auth` as a separate
internal identity service beside the axis (like `env`, not inside it). Full
picture in [overview.md](overview.md).

## `apps/web`

The **driving adapter**: Next.js App Router (UI + server actions). Thin by
design — it translates HTTP/form input into use-case calls and maps typed
errors back to user messages. No business logic lives here.

- `app/page.tsx`, `app/layout.tsx` — the single page and root layout.
- `app/record-tasting-form.tsx` — `"use client"` form using React's
  `useActionState`.
- `app/actions.ts` — `"use server"` action `recordTastingAction`; runs
  `recordTasting(...).pipe(Effect.provide(AppLive))` and maps its result to the
  `ActionResult` envelope via `runAction`.
- `lib/actions/` — the result envelope: `result.ts` (types), `run-action.ts`
  (`Effect` → `ActionResult`), `messages.ts` (tag → user message table). See
  [0007-server-action-result-envelope](../decisions/0007-server-action-result-envelope.md).
- `next.config.js` — `output: "standalone"`; consumes `@repo/core` + `@repo/infra`
  as source via `transpilePackages`, and the built `@repo/env` via
  `serverExternalPackages`.

Dependencies: `@repo/core`, `@repo/infra`, `effect`, `next`, `react`,
`react-dom`. (Dev: `@repo/typescript-config`, Tailwind v4, TypeScript.)

## `apps/auth`

The **identity service**: Better Auth on Hono (Bun), internal-only and proxied
through `apps/web`'s `/api/auth/*`. It sits **beside** the `web → infra → core`
axis, not inside it — it depends on nothing in `core`/`infra` and shares no
domain concepts with the journal. Owns `User`/`Session` and is the single source
of truth for session validity; sessions are database-backed in its own Postgres
database. See [0005-separate-auth-service](../decisions/0005-separate-auth-service.md).

- `src/index.ts` — `Bun.serve` entrypoint; wires db, auth, mail sender, Hono app.
- `src/app.ts` — `createApp`: a Hono app forwarding every method at
  `/api/auth/*` to Better Auth's handler.
- `src/auth.ts` — `createAuth`: Better Auth config (email+password,
  database-backed sessions, Drizzle adapter, optional email verification, rate
  limiting, SMTP mail).
- `src/env.ts` — `createEnv` for the auth variables (fail-fast).
- `src/db/schema.ts` — Better Auth tables `user`, `session`, `account`,
  `verification`.
- `src/db/client.ts` — `makeDatabase`: Drizzle over a `pg` `Pool`.
- `src/mail/sender.ts` — `MailSender` seam; `src/mail/smtp.ts` — nodemailer.
- `drizzle.config.ts` — `drizzle-kit` config (postgresql dialect).

Dependencies: `better-auth`, `@better-auth/drizzle-adapter`, `hono`,
`drizzle-orm`, `pg`, `nodemailer`, `@repo/env`, `zod`. (Dev:
`@repo/typescript-config`, `@types/bun`, `@types/pg`, `drizzle-kit`,
`typescript`, `vitest`.)

## `packages/core` (`@repo/core`)

The **pure domain + application** layer. Imports only `effect` — no IO or
framework dependencies.

- `src/domain/tea.ts` — `Tea`, `NewTea`, `TeaId` (branded), `TeaType` literals.
- `src/domain/tasting-note.ts` — `TastingNote`, `NewTastingNote`,
  `TastingNoteId`, `BrewMethod`.
- `src/domain/errors.ts` — `InvalidRating`, `PersistenceError`, and
  `TeaNotFound` (`Schema.TaggedError`).
- `src/application/ports.ts` — the driven ports `TeaRepository` and
  `JournalRepository` (`Context.Service` tags).
- `src/application/record-tasting.ts` — the `recordTasting` use case
  (`Effect.gen`).
- `src/application/record-tasting.test.ts` — unit tests using in-memory fake
  `Layer`s.
- `src/index.ts` — public barrel export.

Dependencies: `effect`. (Dev: `@repo/typescript-config`, `typescript`, `vitest`.)

## `packages/infra` (`@repo/infra`)

The **driven adapters**: persistence and env validation.

- `src/env.ts` — `createEnv({ server: { DATABASE_URL }, shared: { NODE_ENV } })`.
- `src/db/schema.ts` — Drizzle tables `teas`, `tastingNotes` (+ `pgEnum`s).
- `src/db/layers.ts` — `pg` `Pool` → Drizzle client, exposed as the
  `Context.Service` `DB` via `DBLive`.
- `src/db/seed.ts` — dev seed script (three teas).
- `src/repositories/tea-repository.ts` — `TeaRepositoryLive`, a `Layer`
  implementing `core`'s `TeaRepository`.
- `src/repositories/journal-repository.ts` — `JournalRepositoryLive`, a `Layer`
  implementing `core`'s `JournalRepository`.
- `src/index.ts` — `AppLive`, composing `TeaRepositoryLive` +
  `JournalRepositoryLive` + `DBLive` (`Layer.provide` / `Layer.mergeAll`).
- `drizzle.config.ts` — `drizzle-kit` config (`postgresql` dialect).

Dependencies: `@repo/core`, `@repo/env`, `drizzle-orm`, `effect`, `pg`, `zod`.
(Dev: `@repo/typescript-config`, `drizzle-kit`, `typescript`, `@types/pg`.)

## `packages/env` (`@repo/env`)

**Zod env validation**, built with tsdown to `dist/`. The only package consumed
as built output rather than source.

- `src/create-env.ts` — `createEnv` (server / client / shared, fail-fast
  validation, client-access guarding).
- `src/presets.ts` — reusable schemas: `nodeEnv`, `port`, `booleanString`,
  `nonEmptyString`, `logLevel`, under `presets`.
- `src/dotenv.ts` — `loadEnvFiles`, exported at subpath
  `@repo/env/load-env-files`.
- `src/index.ts` — barrel export.

Dependencies: `dotenv`, `zod`. (Dev: `@repo/typescript-config`, `tsdown`.)

## `packages/typescript-config`

**Shared tsconfigs** — dev-time configuration only, no runtime code.

- `base.json` — common `strict` compiler options.
- `library.json` — extends `base`; `Bundler` resolution, `noEmit`.
- `nextjs.json` — extends `base`; Next.js plugin, `jsx: "preserve"`.
- `react-library.json` — extends `base`; for future React libraries.

No dependencies.

## Related documentation

- [overview.md](overview.md) — the dependency rule and Effect mapping
- [data-flow.md](data-flow.md) — how the modules collaborate at runtime
- [../context/tech-stack.md](../context/tech-stack.md) — full stack listing
