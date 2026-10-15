import { Schema } from "effect";

export class TeaNotFound extends Schema.TaggedError<TeaNotFound>()(
  "TeaNotFound",
  {
    teaId: Schema.String,
  },
) {}

export class PersistenceError extends Schema.TaggedError<PersistenceError>()(
  "PersistenceError",
  {
    message: Schema.String,
  },
) {}
