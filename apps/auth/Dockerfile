# tea-rate auth — Better Auth on Hono, run under Bun.

# ---------------------------------------------------------------------------
# Builder: install dependencies and bundle the Bun.serve entrypoint.
# ---------------------------------------------------------------------------
FROM docker.io/oven/bun:1.4.4 AS builder

WORKDIR /app

# Copy the whole repo (`.dockerignore` drops node_modules, .git, build outputs
# and secrets) and install from the lockfile.
COPY . .
# --ignore-scripts skips the root `prepare` script (lefthook install), which
# needs git — not present in the Bun image, and useless inside a container.
RUN bun install --frozen-lockfile --ignore-scripts

# @repo/env is consumed from its tsdown build output (dist/); the auth bundle
# resolves it at build time, so build it first.
RUN cd packages/env && bun run build

# Bundle src/index.ts into a self-contained dist/index.js (`--target bun`).
RUN cd apps/auth && bun run build

# ---------------------------------------------------------------------------
# Runner: a minimal Bun image running the bundled entrypoint.
# ---------------------------------------------------------------------------
FROM docker.io/oven/bun:1.4.4 AS runner

WORKDIR /app

ENV NODE_ENV=production

# Run as a non-root user: the auth service owns User/Session and is the
# highest-value target, so it must not run as uid 0.
RUN groupadd --system --gid 1001 auth \
    && useradd --system --uid 1001 --gid auth auth
ENV HOME=/tmp

COPY --from=builder --chown=auth:auth /app/apps/auth/dist ./dist

USER auth

EXPOSE 4000

CMD ["bun", "dist/index.js"]
