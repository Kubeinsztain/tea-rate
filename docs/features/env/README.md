# env — environment variable validation

> Type-safe, fail-fast environment variable validation via `@repo/env` (Zod).

## Overview

`@repo/env` (in `packages/env`) validates environment variables at startup and
returns a strongly-typed `env` object. If a required variable is missing or
invalid, `createEnv` **throws immediately**, so misconfiguration surfaces as a
clear error at boot instead of a cryptic failure deep in a database query.

The package is built with `tsdown` to `dist/` and ships three subpaths:
`@repo/env` (the main API), `@repo/env/load-env-files`, and
`@repo/env/package.json`. It uses Zod `4.6.5` and `dotenv`.

This is a developer-facing infrastructure feature; see
[`../../decisions/0004-env-validation.md`](../../decisions/0004-env-validation.md)
for the rationale behind it and
[`../../architecture/overview.md`](../../architecture/overview.md) for where it
sits in the system.

## Usage

```ts
import { createEnv, presets } from "@repo/env";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    PORT: presets.port.default(3000),
  },
  shared: {
    NODE_ENV: presets.nodeEnv,
  },
});
```

`createEnv` returns a type-safe `env` object. Its options:

- `server` — server-only variables. Accessing them on the client throws.
- `client` — client-exposed variables. Keys must start with `clientPrefix`
  (defaults to `""`; set e.g. `"NEXT_PUBLIC_"` to enforce the convention).
- `shared` — available on both server and client (e.g. `NODE_ENV`).
- `runtimeEnv` — where to read values from (defaults to `process.env`).
- `skipValidation` — skip validation (defaults to
  `SKIP_ENV_VALIDATION === "true"`); see [Bypass](#bypass).
- `emptyStringAsUndefined` — treat `""` as `undefined` so `.default()` /
  `.optional()` apply (defaults to `true`).

Each entry is a Zod schema; any Zod schema works, so you can add `.default()`,
`.optional()`, transforms, and custom refinements as usual.

## Presets

`presets` re-exports common schemas for `presets.port`-style usage:

| Preset           | Behavior                                                        |
| ---------------- | --------------------------------------------------------------- |
| `nodeEnv`        | `development` / `test` / `production`, defaults to `development` |
| `port`           | Coerces `"3000"` → `3000`, valid TCP range 1–65535              |
| `booleanString`  | Accepts `true`/`false`/`1`/`0` (not `z.coerce.boolean()`)        |
| `nonEmptyString` | Any non-empty string (secrets, API keys)                        |
| `logLevel`       | `fatal`→`trace`, defaults to `info`                             |

## Loading `.env` files

`loadEnvFiles` is available at the `@repo/env/load-env-files` subpath:

```ts
import { loadEnvFiles } from "@repo/env/load-env-files";
loadEnvFiles(); // call before createEnv
```

It loads `.env.<nodeEnv>.local` → `.env.<nodeEnv>` → `.env.local` → `.env` into
`process.env` (most-specific first; `dotenv` never overrides existing vars).

**It is for plain-Node entrypoints only.** You do **not** need it here: Bun
auto-loads `.env`, and Next.js auto-loads `.env*` files. Call it only if you
introduce a raw Node script.

## Bypass

Set `SKIP_ENV_VALIDATION=true` to skip validation (the default for the
`skipValidation` option). This is useful during Docker builds or lint where the
real environment is unavailable. When skipped, `createEnv` returns the raw
values without type-safety checks.

## Where it's used

Only server-side, in `packages/infra/src/env.ts`:

```ts
export const env = createEnv({
  server: { DATABASE_URL: z.string().url() },
  shared: { NODE_ENV: presets.nodeEnv },
});
```

This validates `DATABASE_URL` (must be a valid URL) and `NODE_ENV`
(`development`/`test`/`production`, defaulting to `development`) and fails fast
at module load.

## Limitations

- **Server-side only in this repo.** The `client` / `clientPrefix` options exist
  but are not currently used.
- **No runtime re-validation.** `createEnv` runs once at module load; changing
  the environment after import does not update `env`.
- **No secret masking / audit.** Values are returned verbatim; the package does
  not redact or log them (the only logging is the validation-error message).
- **`loadEnvFiles` is manual.** Unlike Bun and Next.js, plain-Node scripts must
  call it explicitly before `createEnv`.
