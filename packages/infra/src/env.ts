import { createEnv, presets } from "@repo/env";
import { z } from "zod";

/**
 * Validated, type-safe server environment variables.
 * `createEnv` throws at module load if a required variable is missing or
 * invalid, so the app fails fast with a clear message instead of a cryptic
 * connection error deep in a query.
 */
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
  },
  shared: {
    NODE_ENV: presets.nodeEnv,
  },
});
