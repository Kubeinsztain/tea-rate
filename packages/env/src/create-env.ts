import { z } from "zod";

type ZodSchemaMap = Record<string, z.ZodType>;

export interface CreateEnvOptions<
  TServer extends ZodSchemaMap,
  TClient extends ZodSchemaMap,
  TShared extends ZodSchemaMap,
> {
  /** Server-only variables. Throw if accessed on the client. */
  server?: TServer;
  /** Client-exposed variables. Keys must start with `clientPrefix`. */
  client?: TClient;
  /** Variables available on both server and client (e.g. NODE_ENV). */
  shared?: TShared;
  /** Where to read values from. Defaults to `process.env`. */
  runtimeEnv?: Record<string, string | undefined>;
  /** Required prefix for client vars. Set to "" to disable the check. */
  clientPrefix?: string;
  /** `true` on the server, `false` in the browser. Defaults to `typeof window === "undefined"`. */
  isServer?: boolean;
  /** Skip validation (e.g. during Docker builds or lint). Defaults to `SKIP_ENV_VALIDATION === "true"`. */
  skipValidation?: boolean;
  /** Treat `""` as `undefined` so `.default()` / `.optional()` kick in. Defaults to `true`. */
  emptyStringAsUndefined?: boolean;
  /** Called with the formatted error before throwing. Return `"skip"` to swallow the error. */
  onValidationError?: (error: Error) => void | "skip";
  /** Called when server vars are accessed on the client. Must throw to block access. */
  onInvalidAccess?: (key: string) => void;
}

export type ValidatedEnv<
  TServer extends ZodSchemaMap,
  TClient extends ZodSchemaMap,
  TShared extends ZodSchemaMap,
> = z.infer<z.ZodObject<TServer>> &
  z.infer<z.ZodObject<TClient>> &
  z.infer<z.ZodObject<TShared>>;

/**
 * Validate environment variables with Zod and return a type-safe object.
 *
 * @example
 * ```ts
 * import { z } from "zod";
 * import { createEnv, presets } from "@repo/env";
 *
 * export const env = createEnv({
 *   server: {
 *     DATABASE_URL: z.url(),
 *     PORT: presets.port.default(3000),
 *   },
 *   clientPrefix: "NEXT_PUBLIC_",
 *   client: {
 *     NEXT_PUBLIC_API_URL: z.url(),
 *   },
 *   shared: {
 *     NODE_ENV: presets.nodeEnv,
 *   },
 * });
 * ```
 */
export function createEnv<
  TServer extends ZodSchemaMap = Record<never, never>,
  TClient extends ZodSchemaMap = Record<never, never>,
  TShared extends ZodSchemaMap = Record<never, never>,
>(
  options: CreateEnvOptions<TServer, TClient, TShared>,
): ValidatedEnv<TServer, TClient, TShared> {
  const {
    server = {} as TServer,
    client = {} as TClient,
    shared = {} as TShared,
    runtimeEnv = process.env as Record<string, string | undefined>,
    clientPrefix = "",
    isServer = typeof window === "undefined",
    skipValidation = process.env.SKIP_ENV_VALIDATION === "true",
    emptyStringAsUndefined = true,
    onValidationError = (error) => {
      console.error(`❌ Invalid environment variables:\n${error.message}`);
    },
    onInvalidAccess = (key) => {
      throw new Error(
        `❌ Attempted to access server-side environment variable "${key}" on the client. ` +
          `Move it to "shared" or prefix client vars with your configured clientPrefix.`,
      );
    },
  } = options;

  const serverKeys = new Set(Object.keys(server));
  const clientKeys = new Set(Object.keys(client));

  if (clientPrefix) {
    for (const key of clientKeys) {
      if (!key.startsWith(clientPrefix)) {
        throw new Error(
          `❌ Client variable "${key}" must start with prefix "${clientPrefix}". ` +
            `Rename it or move it to "server"/"shared".`,
        );
      }
    }
  }

  if (skipValidation) {
    return new Proxy(runtimeEnv, {
      get(target, prop) {
        if (typeof prop !== "string") return undefined;
        if (!isServer && serverKeys.has(prop) && !clientKeys.has(prop)) {
          onInvalidAccess(prop);
        }
        return Reflect.get(target, prop);
      },
    }) as unknown as ValidatedEnv<TServer, TClient, TShared>;
  }

  const input: Record<string, string | undefined> = {};
  for (const key of [
    ...Object.keys(server),
    ...Object.keys(client),
    ...Object.keys(shared),
  ]) {
    const value = runtimeEnv[key];
    input[key] = emptyStringAsUndefined && value === "" ? undefined : value;
  }

  const mergedSchema = z.object({ ...server, ...client, ...shared });
  const parsed = mergedSchema.safeParse(input);

  if (!parsed.success) {
    const error = new Error(z.prettifyError(parsed.error));
    error.name = "InvalidEnvironmentVariablesError";
    const decision = onValidationError(error);
    if (decision !== "skip") throw error;
    return input as unknown as ValidatedEnv<TServer, TClient, TShared>;
  }

  return new Proxy(parsed.data, {
    get(target, prop) {
      if (typeof prop !== "string") return undefined;
      if (!isServer && serverKeys.has(prop) && !clientKeys.has(prop)) {
        onInvalidAccess(prop);
      }
      return Reflect.get(target, prop);
    },
  }) as ValidatedEnv<TServer, TClient, TShared>;
}
