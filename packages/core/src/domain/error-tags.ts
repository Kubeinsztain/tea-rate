/**
 * Canonical error identities. Each `Schema.TaggedError` references one of
 * these literals as its `_tag`, so the set of error tags has a single source
 * of truth. Driving adapters key their
 * presentation by `ErrorTag` — e.g. the web app's exhaustively-typed message
 * table in `apps/web/lib/actions/messages.ts`.
 */
export const ErrorTags = {
  InvalidRating: "InvalidRating",
  PersistenceError: "PersistenceError",
  TeaNotFound: "TeaNotFound",
} as const;

export type ErrorTag = (typeof ErrorTags)[keyof typeof ErrorTags];
