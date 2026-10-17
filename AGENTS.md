<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": true` in the root `turbo.json` or `turbo.jsonc` to opt in; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

# Agent notes for this repo

## Keep secret values out of tracked docs

`docs/**` — and `docs/work/**` in particular — is tracked on purpose: it keeps
the decision and work trail in the repo. Anything written there is committed.
So never paste secret **values** into a tracked file: credentials, tokens,
private keys, session cookies, connection strings with passwords, SMTP/Better
Auth secrets, or real user data.

Reference secrets by name and location instead — e.g. `BETTER_AUTH_SECRET`
(see `apps/auth/.env.example`) — and use placeholders like `<redacted>`. Real
values belong in `.env` files, which are git-ignored.

A gitleaks scan runs in the pre-commit hook (when installed) and in CI.
