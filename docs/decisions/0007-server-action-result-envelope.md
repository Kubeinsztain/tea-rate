# ADR-0007: Server-action result envelope

- Status: accepted
- Date: 2026-10-18

## Context

Server actions need a consistent way to report outcomes across the HTTP
boundary: success data, expected domain failures, and unexpected defects. The
first action, `recordTastingAction`, returns a bespoke `{ ok, message }` shape
and catches errors with `instanceof` checks in a try/catch. That works but
silently collapses unknown typed errors — `PersistenceError` falls through to a
generic message — and mixes three concerns (parsing, error mapping, transport)
in one function.

We evaluated extracting a reusable action kit (from a sibling project) into a
workspace package. The idea — a server action always returns a serializable
envelope rather than throwing across the wire — is genuinely useful. But the
origin's concrete choices conflict with this repo: a class-based
`ErrorPayload`/`BaseError` error model (vs ADR-0001's Effect `TaggedError`s),
zod input validation (vs Effect `Schema`), and TanStack Query/sonner client
adapters (none of which we use — the web app has a single `useActionState`
form). With one Next.js app and one action, a package is premature.

## Decision

Adopt a minimal, Effect-native **result envelope** inside `apps/web`, and defer
a `@repo/actions` package until a second consumer appears (see below).

- A server action returns `ActionResult<T>`: either
  `{ status: "success", data: T }` or `{ status: "error", error: WireError }`.
  The `status` field is the discriminant; there is no separate
  `validationError` status.
- `WireError` is `{ tag, userMessage, isOperational, issues? }`:
  - `tag` is a canonical `ErrorTag` from `@repo/core` (the `_tag` of a
    `Schema.TaggedError`), or one of the web-layer synthetics `"INTERNAL"`
    (unexpected defect) / `"UNKNOWN"` (unregistered typed error).
  - `userMessage` is a message safe to show the user, looked up from an
    app-owned `tag -> message` table (`apps/web/lib/actions/messages.ts`),
    exhaustively typed as `Record<ErrorTag, string>`.
  - `isOperational` distinguishes a typed `Fail` (expected, `true`) from an
    unexpected `Defect` (`false`).
  - `issues` is reserved for Effect `Schema.decodeUnknown` parse errors, when
    raw input decoding is introduced.
- `runAction(program, { onError? })` runs an `Effect` via
  `Effect.runPromiseExit` and maps the `Exit`:
  - success → `{ status: "success", data }`;
  - `Cause.failures` (typed `Fail`) → `{ status: "error", error }` via the tag
    table;
  - `Cause.defects` (unexpected) → `{ tag: "INTERNAL", isOperational: false }`
    with the raw message stripped and the defect reported through `onError`.
- Validation stays Effect-native: domain rules are `Schema.TaggedError`s in the
  use case's `E` channel (e.g. `InvalidRating`), not a separate validation
  step. There is no bespoke `fields`/`validationErrors` map.
- No ABAC: tea-rate has no attribute-based authorization concept. `unwrap` and
  navigation are deferred to when a server component calls an action directly.
- Error tags are canonicalized in `@repo/core` (`domain/error-tags.ts`): the
  `ErrorTags` object + `ErrorTag` union is the single source of truth, and each
  `Schema.TaggedError` references it. The web message table keys by `ErrorTag`,
  so a new error without a message is a compile error, and the domain never
  learns a presentation string.

## Consequences

- One envelope contract is consumed by `useActionState` today and is directly
  reusable by a future TanStack Query `useMutation` with no rework.
- Typed errors are never silently collapsed: `PersistenceError` now surfaces its
  own message, and any future `TaggedError` needs only a table entry.
- Unexpected defects never leak raw driver/DB messages to the client (the
  "don't leak `message`" rule).
- The web layer stays thin and Effect-aware only at its boundary; no new package
  or dependency is added.

## Extraction trigger

Lift `apps/web/lib/actions` into a `@repo/actions` package when a second
consumer appears: a second app, the mobile/RPC client anticipated in
[ADR-0003](./0003-nextjs-integration.md), or TanStack Query adoption with more
than one mutation. The envelope and `runAction` are designed to lift unchanged.

## See also

- [ADR-0001](./0001-effect-ts.md) — Effect typed errors and Schema validation.
- [ADR-0003](./0003-nextjs-integration.md) — thin server actions over core use
  cases; the future RPC client.
