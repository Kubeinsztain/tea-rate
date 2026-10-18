import { Cause, Effect, Exit, Result } from "effect";
import { GENERIC_MESSAGE, toWireError } from "./messages";
import type { ActionResult } from "./result";

export type RunActionOptions = {
  /**
   * Report unexpected defects (non-operational errors). Wire this to a logger
   * so server-side failures aren't invisible. Optional.
   */
  onError?: (defects: ReadonlyArray<unknown>) => void;
};

/**
 * Run an Effect use case at the HTTP boundary and map its exit to a
 * serializable `ActionResult`:
 *
 * - success             -> `{ status: "success", data }`
 * - typed `Fail`        -> `{ status: "error", error: toWireError(fail) }`
 * - unexpected `Defect` -> `{ status: "error", error: INTERNAL }` + `onError`
 *
 * Never throws across the network boundary, and never leaks a raw driver/DB
 * message to the client.
 */
export async function runAction<T, E>(
  program: Effect.Effect<T, E>,
  options?: RunActionOptions,
): Promise<ActionResult<T>> {
  const exit = await Effect.runPromiseExit(program);

  if (Exit.isSuccess(exit)) {
    return { status: "success", data: exit.value };
  }

  const error = Result.getOrUndefined(Cause.findError(exit.cause));
  if (error !== undefined) {
    return { status: "error", error: toWireError(error) };
  }

  const defect = Result.getOrUndefined(Cause.findDefect(exit.cause));
  options?.onError?.(defect !== undefined ? [defect] : []);

  return {
    status: "error",
    error: {
      tag: "INTERNAL",
      userMessage: GENERIC_MESSAGE,
      isOperational: false,
    },
  };
}
