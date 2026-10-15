import { Schema } from "effect";
import { TeaId } from "./tea";

export const BrewMethod = Schema.Literals([
  "gongfu",
  "western",
  "grandpa",
  "cold",
]);
export type BrewMethod = typeof BrewMethod.Type;

export const TastingNoteId = Schema.String.pipe(Schema.brand("TastingNoteId"));
export type TastingNoteId = typeof TastingNoteId.Type;

export const TastingNote = Schema.Struct({
  id: TastingNoteId,
  teaId: TeaId,
  rating: Schema.Number,
  notes: Schema.NullOr(Schema.String),
  brewedAt: Schema.Date,
  brewMethod: Schema.NullOr(BrewMethod),
});
export type TastingNote = typeof TastingNote.Type;

export const NewTastingNote = Schema.Struct({
  teaId: TeaId,
  rating: Schema.Number,
  notes: Schema.NullOr(Schema.String),
  brewMethod: Schema.NullOr(BrewMethod),
});
export type NewTastingNote = typeof NewTastingNote.Type;
