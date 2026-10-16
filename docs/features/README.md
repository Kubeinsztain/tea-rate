# Features

User- and developer-facing capabilities of the product. Each feature has its own
directory whose `README.md` is the entry point.

Features are described in terms of **what they do and how to use them**, not the
underlying architecture (see [`../architecture/`](../architecture/)) or the
domain model (see [`../domains/`](../domains/)).

## Features

- [auth](auth/) — internal email+password auth service (Better Auth on Hono),
  proxied through the web app.
- [env](env/) — type-safe, fail-fast environment variable validation
  (`@repo/env`).
