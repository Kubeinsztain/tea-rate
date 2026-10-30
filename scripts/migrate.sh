#!/bin/sh
set -eu

# Apply both Drizzle migrations against a live Postgres.
#   JOURNAL_DATABASE_URL -> the journal database (packages/infra)
#   AUTH_DATABASE_URL    -> the auth service database (apps/auth)
# The auth database is created (idempotently) if it does not exist.

echo "==> ensuring auth database exists"
cd /app/apps/auth
bun scripts/ensure-db.ts

echo "==> migrating journal database"
cd /app/packages/infra
DATABASE_URL="$JOURNAL_DATABASE_URL" bun run db:migrate

echo "==> migrating auth database"
cd /app/apps/auth
DATABASE_URL="$AUTH_DATABASE_URL" bun run db:migrate

echo "==> migrations complete"
