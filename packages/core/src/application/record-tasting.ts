import { Effect, Schema } from "effect";
import type { PersistenceError, TeaNotFound } from "../domain/errors";
import type { TastingNote, TastingNoteId } from "../domain/tasting-note";
import type { TeaId } from "../domain/tea";
import { JournalRepository, TeaRepository } from "./ports";

export interface RecordTastingInput {
  readonly teaId: TeaId;
  readonly rating: number;
  readonly notes: string | null;
}

export class InvalidRating extends Schema.TaggedError<InvalidRating>()(
  "InvalidRating",
  { rating: Schema.Number },
) {}

export type RecordTastingError = TeaNotFound | PersistenceError | InvalidRating;

/**
 * Use case: record a tasting note for a catalog tea.
 * Pure orchestration — depends only on the ports in `R`.
 */
export const recordTasting = (
  input: RecordTastingInput,
): Effect.Effect<
  TastingNote,
  RecordTastingError,
  TeaRepository | JournalRepository
> =>
  Effect.gen(function* () {
    if (input.rating < 1 || input.rating > 5) {
      return yield* Effect.fail(new InvalidRating({ rating: input.rating }));
    }

    const teaRepository = yield* TeaRepository;
    const tea = yield* teaRepository.findById(input.teaId);

    const note: TastingNote = {
      id: crypto.randomUUID() as TastingNoteId,
      teaId: tea.id,
      rating: input.rating,
      notes: input.notes,
      brewedAt: new Date(),
      brewMethod: null,
    };

    const journalRepository = yield* JournalRepository;
    return yield* journalRepository.insert(note);
  });
