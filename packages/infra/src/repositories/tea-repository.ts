import type { NewTea, Tea, TeaId, TeaType } from "@repo/core";
import { PersistenceError, TeaNotFound, TeaRepository } from "@repo/core";
import { eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { DB } from "../db/layers";
import { teas } from "../db/schema";

const toTea = (row: typeof teas.$inferSelect): Tea => ({
  id: row.id as TeaId,
  name: row.name,
  type: row.type as TeaType,
  vendor: row.vendor,
  region: row.region,
});

export const TeaRepositoryLive = Layer.effect(
  TeaRepository,
  Effect.gen(function* () {
    const db = yield* DB;

    return TeaRepository.of({
      findById: (id) =>
        Effect.gen(function* () {
          const rows = yield* Effect.tryPromise({
            try: () => db.select().from(teas).where(eq(teas.id, id)),
            catch: (error) => new PersistenceError({ message: String(error) }),
          });
          const row = rows[0];
          if (row === undefined) {
            return yield* Effect.fail(new TeaNotFound({ teaId: id }));
          }
          return toTea(row);
        }),

      insert: (tea: NewTea) =>
        Effect.gen(function* () {
          const rows = yield* Effect.tryPromise({
            try: () =>
              db
                .insert(teas)
                .values({
                  id: crypto.randomUUID(),
                  name: tea.name,
                  type: tea.type,
                  vendor: tea.vendor,
                  region: tea.region,
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
          return toTea(row);
        }),
    });
  }),
);
