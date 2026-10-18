import { Schema } from "effect";
import { ErrorTags } from "./error-tags";

export class InvalidRating extends Schema.TaggedError<InvalidRating>()(
  ErrorTags.InvalidRating,
  { rating: Schema.Number },
) {}

export class PersistenceError extends Schema.TaggedError<PersistenceError>()(
  ErrorTags.PersistenceError,
  {
    message: Schema.String,
  },
) {}

export class TeaNotFound extends Schema.TaggedError<TeaNotFound>()(
  ErrorTags.TeaNotFound,
  {
    teaId: Schema.String,
  },
) {}
