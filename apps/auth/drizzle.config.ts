import { createEnv, presets } from "@repo/env";
import { defineConfig } from "drizzle-kit";
import { z } from "zod";

/**
 * Drizzle Kit only needs the database URL, not the full auth runtime env
 * (`BETTER_AUTH_SECRET`, `SMTP_*`, …), so migrations can run before those are
 * configured. Mirrors the shape of `packages/infra`'s env.
 */
const { DATABASE_URL } = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
  },
  shared: {
    NODE_ENV: presets.nodeEnv,
  },
});

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
