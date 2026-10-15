import { z } from "zod";

/** NODE_ENV with a development default. Put it in `shared`. */
export const nodeEnv = z
  .enum(["development", "test", "production"])
  .default("development");

/** TCP port (1-65535). Coerces `"3000"` -> `3000`. */
export const port = z.coerce.number().int().min(1).max(65535);

/**
 * Booleans from env strings. Accepts `true`/`false`/`1`/`0` (and real booleans).
 * NOTE: do NOT use `z.coerce.boolean()` — it turns `"false"` into `true`.
 */
export const booleanString = z
  .union([z.boolean(), z.enum(["true", "false", "1", "0"])])
  .transform((value) => value === true || value === "true" || value === "1");

/** Any non-empty string (e.g. secrets, API keys). */
export const nonEmptyString = z.string().min(1);

/** Log level, defaults to `"info"`. */
export const logLevel = z
  .enum(["fatal", "error", "warn", "info", "debug", "trace"])
  .default("info");

/** Re-export under a namespace for `presets.port`-style usage. */
export const presets = {
  nodeEnv,
  port,
  booleanString,
  nonEmptyString,
  logLevel,
};
