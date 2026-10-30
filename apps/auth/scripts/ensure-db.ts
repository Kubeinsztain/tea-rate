import { Client } from "pg";

// Ensure the auth service's database exists, creating it if missing.
// Reads AUTH_DATABASE_URL from the environment and connects to the "postgres"
// maintenance database to issue CREATE DATABASE. Fail-fast on misconfiguration.
const authDatabaseUrl = Bun.env.AUTH_DATABASE_URL;
if (!authDatabaseUrl) {
  throw new Error("AUTH_DATABASE_URL is required");
}

const url = new URL(authDatabaseUrl);
const dbName = url.pathname.slice(1);
if (!/^[a-z_][a-z0-9_]*$/.test(dbName)) {
  throw new Error(`Invalid database name: ${dbName}`);
}
url.pathname = "/postgres";

const client = new Client({ connectionString: url.toString() });
await client.connect();
try {
  const res = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [dbName],
  );
  if (res.rowCount === 0) {
    await client.query(`CREATE DATABASE ${dbName}`);
  }
} finally {
  await client.end();
}
