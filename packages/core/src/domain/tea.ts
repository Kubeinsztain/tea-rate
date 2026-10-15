import { Schema } from "effect";

export const TeaType = Schema.Literals([
  "green",
  "black",
  "oolong",
  "white",
  "puerh",
  "herbal",
]);
export type TeaType = typeof TeaType.Type;

export const TeaId = Schema.String.pipe(Schema.brand("TeaId"));
export type TeaId = typeof TeaId.Type;

export const Tea = Schema.Struct({
  id: TeaId,
  name: Schema.NonEmptyString,
  type: TeaType,
  vendor: Schema.NullOr(Schema.String),
  region: Schema.NullOr(Schema.String),
});
export type Tea = typeof Tea.Type;

export const NewTea = Schema.Struct({
  name: Schema.NonEmptyString,
  type: TeaType,
  vendor: Schema.NullOr(Schema.String),
  region: Schema.NullOr(Schema.String),
});
export type NewTea = typeof NewTea.Type;
