import { createEnv, presets } from "@repo/env";
import { z } from "zod";

/**
 * Validated, type-safe environment variables for the web app.
 * `createEnv` throws at module load if a required variable is missing or
 * invalid, so misconfiguration fails fast at startup.
 */
export const env = createEnv({
  server: {
    /** Base URL of the internal auth service the `/api/auth/*` proxy forwards to. */
    AUTH_SERVICE_URL: z.string().url(),
  },
  shared: {
    NODE_ENV: presets.nodeEnv,
  },
});
