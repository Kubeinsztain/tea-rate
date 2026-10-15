import type { TastingNote, TastingNoteId } from "@repo/core";
import { JournalRepository, PersistenceError } from "@repo/core";
import { Effect, Layer } from "effect";
import { DB } from "../db/layers";
import { tastingNotes } from "../db/schema";

export const JournalRepositoryLive = Layer.effect(
  JournalRepository,
  Effect.gen(function* () {
    const db = yield* DB;

    return JournalRepository.of({
      insert: (note: TastingNote) =>
        Effect.gen(function* () {
          const rows = yield* Effect.tryPromise({
            try: () =>
              db
                .insert(tastingNotes)
                .values({
                  id: note.id,
                  teaId: note.teaId,
                  rating: note.rating,
                  notes: note.notes,
                  brewedAt: note.brewedAt,
                  brewMethod: note.brewMethod,
                })
                .returning(),
            catch: (error) => new PersistenceError({ message: String(error) }),
          });
          const row = rows[0];
          if (row === undefined) {
            return yield* Effect.fail(
              new PersistenceError({ message: "insert returned no row" }),
            );
          }
          return {
            id: row.id as TastingNoteId,
            teaId: note.teaId,
            rating: row.rating,
            notes: row.notes,
            brewedAt: row.brewedAt,
            brewMethod: row.brewMethod,
          };
        }),
    });
  }),
);
