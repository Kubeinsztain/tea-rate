import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client, Pool } from "pg";
import * as schema from "../src/db/schema";
import type { MailMessage, MailSender } from "../src/mail/sender";

const ADMIN_URL =
  process.env.AUTH_TEST_ADMIN_URL ??
  "postgres://postgres:postgres@localhost:5432/postgres";
const TEST_DATABASE_URL =
  process.env.AUTH_TEST_DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/tea_rate_auth_test";
const TEST_DATABASE_NAME = "tea_rate_auth_test";
const MIGRATIONS_FOLDER = new URL("../src/db/migrations", import.meta.url)
  .pathname;

/**
 * Recreate a throwaway auth test database and apply migrations to it.
 * Mirrors how the repo runs Postgres for the journal app, pointed at a
 * separate database so tests never touch dev data.
 */
export async function prepareTestDatabase() {
  const admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${TEST_DATABASE_NAME}`);
  await admin.query(`CREATE DATABASE ${TEST_DATABASE_NAME}`);
  await admin.end();

  const pool = new Pool({ connectionString: TEST_DATABASE_URL });
  const db = drizzle(pool, { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return { db, pool };
}

export interface SpyMailSender {
  sender: MailSender;
  sent: MailMessage[];
}

/** A MailSender that records every message instead of sending real mail. */
export function spyMailSender(): SpyMailSender {
  const sent: MailMessage[] = [];
  const sender: MailSender = {
    async send(message) {
      sent.push(message);
    },
  };
  return { sender, sent };
}

/**
 * Extract a `Cookie` request-header value from a response's `Set-Cookie`
 * headers, so a subsequent request can present the session it was just handed.
 */
export function cookieHeaderFrom(response: Response): string {
  const setCookies = response.headers.getSetCookie
    ? response.headers.getSetCookie()
    : [response.headers.get("set-cookie")].filter(
        (value): value is string => value !== null,
      );
  return setCookies
    .map((cookie) => cookie.split(";")[0])
    .filter((pair): pair is string => pair !== undefined)
    .join("; ");
}

export const jsonHeaders = { "content-type": "application/json" };
