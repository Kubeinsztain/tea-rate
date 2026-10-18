import type { ErrorTag } from "@repo/core";
import { ErrorTags } from "@repo/core";
import type { WireError } from "./result";

/** Fallback message for unexpected defects and unknown tags. */
export const GENERIC_MESSAGE = "Something went wrong.";

/**
 * App-owned mapping from a domain `ErrorTag` to a user-facing message. Keyed by
 * the canonical `ErrorTag` union from `@repo/core`, so every tag is covered
 * (exhaustive) and a typo is a compile error.
 */
export const tagMessages: Record<ErrorTag, string> = {
  TeaNotFound: "That tea isn't in the catalog yet.",
  InvalidRating: "Rating must be between 1 and 5.",
  PersistenceError: "Something went wrong saving your note.",
};

const knownTags = new Set<string>(Object.values(ErrorTags));

/**
 * Project a typed Effect failure (a `Schema.TaggedError`) into a wire-safe
 * error. Reads the error's `_tag`; a recognized domain tag maps to its
 * message, anything else falls back to `UNKNOWN` with a generic message.
 */
export function toWireError(error: unknown): WireError {
  const tag = readTag(error);
  if (tag === "UNKNOWN") {
    return { tag, userMessage: GENERIC_MESSAGE, isOperational: true };
  }
  return { tag, userMessage: tagMessages[tag], isOperational: true };
}

function readTag(error: unknown): ErrorTag | "UNKNOWN" {
  if (typeof error === "object" && error !== null && "_tag" in error) {
    const tag = (error as { _tag?: unknown })._tag;
    if (isKnownTag(tag)) {
      return tag as ErrorTag;
    }
  }
  return "UNKNOWN";
}

function isKnownTag(tag: unknown): tag is ErrorTag {
  return typeof tag === "string" && knownTags.has(tag);
}
