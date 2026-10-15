import { existsSync } from "node:fs";
import path from "node:path";
import { config } from "dotenv";

export interface LoadEnvFilesOptions {
  /** Directory containing the `.env*` files. Defaults to `process.cwd()`. */
  cwd?: string;
  /** Current environment, e.g. `"development"`. Defaults to `process.env.NODE_ENV`. */
  nodeEnv?: string;
  /** Extra files to load (highest precedence first is NOT needed — order given wins via dotenv's no-override rule, so list most-specific first). */
  files?: string[];
}

/**
 * Load `.env*` files into `process.env` (plain-Node helper).
 *
 * Loads, most-specific first (dotenv never overrides existing vars):
 * `.env.<nodeEnv>.local` → `.env.<nodeEnv>` → `.env.local` → `.env`
 *
 * You do NOT need this on Bun (auto-loads `.env`) or Next.js (auto-loads
 * `.env*`). Call it at the very top of your entrypoint, before `createEnv`:
 *
 * @example
 * ```ts
 * import { loadEnvFiles } from "@repo/env/load-env-files";
 * loadEnvFiles();
 * ```
 */
export function loadEnvFiles(options: LoadEnvFilesOptions = {}): void {
  const cwd = options.cwd ?? process.cwd();
  const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV;

  const candidates =
    options.files ??
    [
      nodeEnv && `.env.${nodeEnv}.local`,
      nodeEnv && `.env.${nodeEnv}`,
      ".env.local",
      ".env",
    ].filter((f): f is string => Boolean(f));

  for (const file of candidates) {
    const fullPath = path.resolve(cwd, file);
    if (existsSync(fullPath)) {
      config({ path: fullPath, quiet: true });
    }
  }
}
