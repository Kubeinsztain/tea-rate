# Terminology

> Canonical definitions for the words we use. When a term is ambiguous,
> prefer this doc. Two groups: **architecture** terms (Effect/hexagonal) and
> **domain** terms (tea).

## Architecture

- **Port** — a capability the application requires, declared as an Effect
  `Context.Service` tag. It states *what* is needed (e.g. "find a tea by id"),
  not *how* it's implemented.
- **Adapter** — a concrete implementation of a port, provided as a `Layer`. It
  bridges external technology (a database, a web framework) to the port's
  interface.
- **Driving adapter** — an adapter that *calls into* the application: the "front
  door" that triggers use cases. Today that's the Next.js web app; a future
  REST/RPC API would be another.
- **Driven adapter** — an adapter the application *calls out to*: the "back
  door" for persistence and external I/O. Today that's the Drizzle/Postgres
  repositories in `packages/infra`.
- **Use case** — an application-level workflow written as an `Effect.gen`
  function. Its `R` type parameter *is* the list of required ports (e.g.
  `TeaRepository | JournalRepository`). Example: `recordTasting`.
- **Layer** — an Effect construct that builds and wires a service
  implementation. Used both for real adapters and for in-memory fakes in tests.
- **Service** — an Effect `Context.Service`: the tagged interface describing a
  port's shape (the only kind of "class" besides `Schema.TaggedError`).
- **Domain** — the pure business core: types, schemas, and rules with no I/O,
  no framework, and no classes for behavior.
- **Application** — the orchestration layer: use cases and ports that coordinate
  domain entities into workflows.
- **Vertical slice** — one feature implemented end-to-end through every layer
  (domain → use case → adapter → UI). The sole implemented slice is
  `recordTasting`.
- **Auth service** — the separate identity context (Better Auth on Hono) that
  owns `User`s and `Session`s. The web app proxies `/api/auth/*` to it; it is
  not exposed publicly.

## Domain

- **Tea** — a catalog entry: a named tea with a type and optional vendor and
  region.
- **TeaType** — how a tea is classified: `green`, `black`, `oolong`, `white`,
  `puerh`, or `herbal`.
- **TastingNote** — a personal record of one tasting: a rating, optional notes,
  when it was brewed, and (optionally) how.
- **rating** — an integer score `1–5` on a tasting note.
- **BrewMethod** — how the tea was steeped: `gongfu`, `western`, `grandpa`, or
  `cold`.
- **catalog** — the shared list of teas. Today it's seeded sample data; in the
  community vision it becomes a shared, editable reference.
- **journal** — a user's personal log of their tasting notes.
- **inventory** — a user's record of the teas they own (future feature).
- **community** — the future social layer: shared ratings, reviews, and social
  features.
- **User** — a person with an account; the eventual owner of a journal,
  inventory, and community activity. Lives in the auth service and is referenced
  elsewhere by ID only.
- **Session** — an authenticated, user-bound context for a request. Issued and
  verified by the auth service (the single source of truth).

## Related

- [Tech stack](tech-stack.md) — the concrete tools behind these terms.
- [Architecture](../architecture/README.md) — how ports and adapters are wired.
