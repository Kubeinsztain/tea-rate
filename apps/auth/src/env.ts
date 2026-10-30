import { createEnv, presets } from "@repo/env";
import { z } from "zod";

/**
 * Validated, type-safe environment variables for the auth service.
 * `createEnv` throws at module load if a required variable is missing or
 * invalid, so misconfiguration fails fast at startup.
 *
 * `MAIL_MODE` selects the mail seam: `"console"` (default) logs messages
 * through the `consoleMailSender`, so a self-hosted deployment needs no SMTP
 * configuration; `"smtp"` delivers through Nodemailer and requires the `SMTP_*`
 * settings, which are therefore optional here (only `"smtp"` mode needs them).
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
    /** Mail delivery seam: log-only (`"console"`) or Nodemailer SMTP. */
    MAIL_MODE: z.enum(["console", "smtp"]).default("console"),
    SMTP_HOST: presets.nonEmptyString.optional(),
    SMTP_PORT: presets.port.optional(),
    SMTP_USER: presets.nonEmptyString.optional(),
    SMTP_PASS: presets.nonEmptyString.optional(),
    SMTP_FROM: z.string().email().optional(),
    PORT: presets.port.default(4000),
  },
  shared: {
    NODE_ENV: presets.nodeEnv,
  },
});
