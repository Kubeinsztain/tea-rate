# tea-rate — task runner
# Load the root `.env` into every recipe (single source of truth for env vars).
set dotenv-load

alias db := db-up
alias dbd := db-down
alias dbc := db-connect
alias dbr := db-reset

# Show available recipes.
default:
    @just --list

# ---- environment -----------------------------------------------------------

# Create `.env` from the example if it doesn't already exist.
env:
    @test -f .env || cp .env.example .env
    @echo "Ready. Edit .env to set DATABASE_URL if needed."

# ---- database (Postgres 18) ------------------------------------------------

# Start Postgres.
db-up:
    podman compose -f compose-db-local.yml up -d postgres

# Stop Postgres (keeps the data volume).
db-down:
    podman compose -f compose-db-local.yml down

# Stop Postgres and recreate with a fresh (empty) data volume.
db-reset:
    podman compose -f compose-db-local.yml down -v
    podman compose -f compose-db-local.yml up -d postgres

# Open psql against the local database.
db-connect:
    psql -h localhost -U postgres

# ---- schema & seed ----------------------------------------------------------

# Generate SQL migrations from the Drizzle schema (journal app only).
db-generate:
    bun run db:generate -- --filter=@repo/infra

# Apply pending migrations (journal app only).
db-migrate:
    bun run db:migrate -- --filter=@repo/infra

# Insert the sample teas.
db-seed:
    bun run db:seed

# Open Drizzle Studio (schema browser).
db-studio:
    bun run db:studio

# ---- auth service -----------------------------------------------------------
# The auth service owns a separate database on the same Postgres instance and
# reads its own `DATABASE_URL` from `apps/auth/.env` (see apps/auth/.env.example).
# Its recipes `cd apps/auth` and clear the journal `DATABASE_URL` so the auth
# `.env` value applies.

# Create the auth service's own database.
db-auth-create:
    psql -h localhost -U postgres -c "CREATE DATABASE tea_rate_auth"

# Generate auth-service migrations.
db-auth-generate:
    cd apps/auth && env -u DATABASE_URL bun run db:generate

# Apply auth-service migrations.
db-auth-migrate:
    cd apps/auth && env -u DATABASE_URL bun run db:migrate

# Run the auth service on its own port (default 4000).
auth-dev:
    cd apps/auth && env -u DATABASE_URL bun run dev

# Run the auth service test suite (uses a throwaway test database).
auth-test:
    cd apps/auth && bun run test

# ---- app -------------------------------------------------------------------

install:
    bun install

dev:
    bun run dev

build:
    bun run build

check:
    bun run check

check-types:
    bun run check-types

test:
    bun run test

# ---- images & migrate (podman) ---------------------------------------------

# Build all three OCI images (web, auth, migrate).
images: image-web image-auth image-migrate

# Build the web image (Next.js standalone output).
image-web:
    podman build -f apps/web/Dockerfile -t tea-rate-web .

# Build the auth image (Bun).
image-auth:
    podman build -f apps/auth/Dockerfile -t tea-rate-auth .

# Build the migrate image (applies both Drizzle migrations).
image-migrate:
    podman build -f Dockerfile.migrate -t tea-rate-migrate .

# Apply both Drizzle migrations (journal + auth) via the migrate image.
# Build it first with `just image-migrate`; requires Postgres running (`just
# db-up`). The auth database is created if missing. The journal URL defaults to
# DATABASE_URL (root `.env`); AUTH_DATABASE_URL must be set — see apps/auth/.env.
# Override both for non-local deployments:
#   JOURNAL_DATABASE_URL=… AUTH_DATABASE_URL=… just migrate
migrate:
    podman run --rm --network host \
        -e JOURNAL_DATABASE_URL="${JOURNAL_DATABASE_URL:-${DATABASE_URL:?set DATABASE_URL in .env}}" \
        -e AUTH_DATABASE_URL="${AUTH_DATABASE_URL:?set AUTH_DATABASE_URL (auth DB; see apps/auth/.env)}" \
        tea-rate-migrate

# ---- cleanup -----------------------------------------------------------------

# Stop Postgres, drop its data volume, and remove build caches.
db-clean:
    podman compose -f compose-db-local.yml down -v
    rm -rf .turbo apps/*/.next apps/*/.turbo packages/*/.turbo
    @echo "Stopped containers, removed volumes and build caches."

# clean + remove all node_modules (run `just install` afterwards).
nuke: db-clean
    rm -rf node_modules apps/*/node_modules packages/*/node_modules
    @echo "Removed node_modules. Run 'just install' to restore."
