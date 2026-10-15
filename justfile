# tea-rate — task runner
# Load the root `.env` into every recipe (single source of truth for env vars).
set dotenv-load

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
    docker compose up -d postgres

# Stop Postgres (keeps the data volume).
db-down:
    docker compose down

# Stop Postgres and recreate with a fresh (empty) data volume.
db-reset:
    docker compose down -v
    docker compose up -d postgres

# ---- schema & seed ----------------------------------------------------------

# Generate SQL migrations from the Drizzle schema.
db-generate:
    bun run db:generate

# Apply pending migrations.
db-migrate:
    bun run db:migrate

# Insert the sample teas.
db-seed:
    bun run db:seed

# Open Drizzle Studio (schema browser).
db-studio:
    bun run db:studio

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

# ---- cleanup -----------------------------------------------------------------

# Stop Postgres, drop its data volume, and remove build caches.
clean:
    docker compose down -v
    rm -rf .turbo apps/*/.next apps/*/.turbo packages/*/.turbo
    @echo "Stopped containers, removed volumes and build caches."

# clean + remove all node_modules (run `just install` afterwards).
nuke: clean
    rm -rf node_modules apps/*/node_modules packages/*/node_modules
    @echo "Removed node_modules. Run 'just install' to restore."
