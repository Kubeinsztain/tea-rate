import type { ErrorTag } from "@repo/core";

/**
 * The serializable result envelope a server action returns across the HTTP
 * boundary. Success carries the use-case value; failure carries a wire-safe
 * error. This is the single contract consumed by `useActionState` today and
 * reusable by a future TanStack Query `useMutation` with no rework.
 */

/** The wire-safe error shape. `tag` is a domain `ErrorTag` or a synthetic. */
export type WireError = {
  /**
   * The error's tag: a domain `ErrorTag` (`TaggedError._tag`), or one of the
   * web-layer synthetics `"INTERNAL"` / `"UNKNOWN"`.
   */
  tag: ErrorTag | "INTERNAL" | "UNKNOWN";
  /** A message safe to show the user. Never a raw driver/DB message. */
  userMessage: string;
  /** `true` for a typed `Fail` (expected); `false` for an unexpected `Defect`. */
  isOperational: boolean;
  /**
   * Effect `Schema` decode issues, projected to `{ path, message }`. Reserved
   * for `Schema.decodeUnknown` input parsing; unset until that is introduced.
   */
  issues?: ReadonlyArray<{ path: string; message: string }>;
};

export type ActionResult<T> =
  | { status: "success"; data: T }
  | { status: "error"; error: WireError };
