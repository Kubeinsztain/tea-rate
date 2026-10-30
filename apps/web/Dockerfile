# tea-rate web — Next.js (App Router, output: "standalone") on Node.
#
# The workspace packages are consumed as SOURCE via `transpilePackages`
# (@repo/core, @repo/infra) and from the BUILT output via `serverExternalPackages`
# (@repo/env), so the whole monorepo must be present at build time.

# ---------------------------------------------------------------------------
# Builder: install dependencies and produce the Next standalone output.
# ---------------------------------------------------------------------------
FROM docker.io/oven/bun:1.4.4 AS builder

WORKDIR /app

# Copy the whole repo (`.dockerignore` drops node_modules, .git, build outputs
# and secrets) and install from the lockfile. Dev dependencies are required to
# build (next, tsdown, typescript, tailwind, …).
COPY . .
# --ignore-scripts skips the root `prepare` script (lefthook install), which
# needs git — not present in the Bun image, and useless inside a container.
RUN bun install --frozen-lockfile --ignore-scripts

# @repo/env is consumed from its tsdown build output (dist/); build it before
# the web build resolves it.
RUN cd packages/env && bun run build

# Build the web app directly rather than through `turbo run build`: the
# turbo.json `build` task's env allowlist passes only DATABASE_URL through, so
# `next build` under turbo can never see SKIP_ENV_VALIDATION (the documented
# escape hatch for image builds) nor AUTH_SERVICE_URL. NODE_ENV=production is
# required by Next.js for a correct production build.
RUN cd apps/web && NODE_ENV=production SKIP_ENV_VALIDATION=true bun run build

# ---------------------------------------------------------------------------
# Runner: a minimal Node image serving the standalone output.
# ---------------------------------------------------------------------------
FROM docker.io/node:26-slim AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

# The standalone output preserves the monorepo path (apps/web/…) because
# outputFileTracingRoot is the workspace root. Copy it plus the static assets.
# COPY preserves the Bun `.bun` node_modules symlinks, so the traced dependency
# graph stays resolvable under Node.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
# apps/web has no public/ directory yet — add this COPY when one is introduced:
# COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
