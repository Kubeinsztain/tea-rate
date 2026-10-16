import { createEnv, presets } from "@repo/env";
import { z } from "zod";

/**
 * Validated, type-safe environment variables for the auth service.
 * `createEnv` throws at module load if a required variable is missing or
 * invalid, so misconfiguration fails fast at startup.
 *
 * `SMTP_*` values drive the SMTP mail transport (`mail/smtp.ts`); validating
 * them here means a missing SMTP setting fails fast instead of surfacing as a
 * delivery error later.
 */
export const env = createEnv({
  server: {
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),
    DATABASE_URL: z.string().url(),
    /**
     * Public origin of the web app that proxies `/api/auth/*` to this service.
     * User-facing email links (reset, verify) are built against this origin,
     * and it is added to Better Auth's `trustedOrigins` so the proxied
     * `Origin` header (the browser's origin) is accepted during sign-in.
     */
    WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
    SMTP_HOST: presets.nonEmptyString,
    SMTP_PORT: presets.port,
    SMTP_USER: presets.nonEmptyString,
    SMTP_PASS: presets.nonEmptyString,
    SMTP_FROM: z.string().email(),
    PORT: presets.port.default(4000),
  },
  shared: {
    NODE_ENV: presets.nodeEnv,
  },
});
