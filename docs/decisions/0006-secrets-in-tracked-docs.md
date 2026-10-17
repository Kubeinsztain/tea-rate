# ADR-0006: Keep secret values out of tracked docs

- Status: accepted
- Date: 2026-10-17

## Context

`docs/work/**` is tracked on purpose: it keeps the decision and work trail
(specs, plans, handoffs, notes) alongside the code. The risk is that the trail
is also where an agent or developer documents env setup and debugging — the
natural place to paste a real value out of `.env` (which is git-ignored).
Because the docs are tracked, that value would be committed. No leak had
occurred; the goal is to keep the trail without allowing one.

## Decision

Keep `docs/work/**` tracked, and keep secret *values* out of all tracked docs.
A tracked doc references a secret by **name and location** — e.g.
`BETTER_AUTH_SECRET` (see `.env.example`) — and uses `<redacted>` placeholders;
real values live only in git-ignored `.env` files or a secret manager.

Enforce it with **gitleaks**:

- pre-commit via **lefthook** (`gitleaks git --staged`) — fast local feedback;
- a **CI job** (`gitleaks/gitleaks-action`) on every push/PR — authoritative;
- `.gitleaks.toml` extends the default ruleset and allowlists only committed
  `*.env.example` placeholders.

The convention is also stated in the global opencode agent config, so agents
follow it while authoring — before any scan runs.

Considered and rejected:

- **Git-ignore `docs/work/`** — removes the leak surface but loses the decision
  and work trail the repo deliberately keeps.
- **Guidance only, no scanner** — best-effort; nothing catches a slip.
- **A single scan layer** (CI-only, or pre-commit-only) — CI-only defers the
  catch to push; pre-commit-only is skippable. Both layers chosen.

## Consequences

- The work trail is retained, and a leaked value is blocked at commit and in CI.
- The local hook needs lefthook installed/active and `gitleaks` on `PATH`; the
  CI job scans regardless.
- Writers of tracked docs use secret names/placeholders, never values.
- Secret scanning is now part of the quality toolchain, alongside Biome.

## See also

- [Coding guidelines](../context/coding-guidelines.md) — "Secrets and tracked docs"
- [Tech stack](../context/tech-stack.md) — gitleaks in the quality toolchain
