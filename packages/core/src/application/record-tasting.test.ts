import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { TeaNotFound } from "../domain/errors";
import type { Tea, TeaId } from "../domain/tea";
import { JournalRepository, TeaRepository } from "./ports";
import { recordTasting } from "./record-tasting";

const sencha: Tea = {
  id: "tea-1" as TeaId,
  name: "Sencha",
  type: "green",
  vendor: null,
  region: "Uji",
};

describe("recordTasting", () => {
  it("records a note for an existing tea", async () => {
    const teasLive = Layer.succeed(TeaRepository, {
      findById: () => Effect.succeed(sencha),
      insert: () => Effect.succeed(sencha),
    });
    const journalLive = Layer.succeed(JournalRepository, {
      insert: (note) => Effect.succeed(note),
    });

    const note = await Effect.runPromise(
      recordTasting({
        teaId: sencha.id,
        rating: 5,
        notes: "Grassy and bright",
      }).pipe(Effect.provide(Layer.merge(teasLive, journalLive))),
    );

    expect(note.rating).toBe(5);
    expect(note.teaId).toBe(sencha.id);
    expect(note.brewMethod).toBeNull();
  });

  it("fails with InvalidRating when the rating is out of range", async () => {
    const teasLive = Layer.succeed(TeaRepository, {
      findById: () => Effect.succeed(sencha),
      insert: () => Effect.succeed(sencha),
    });
    const journalLive = Layer.succeed(JournalRepository, {
      insert: (note) => Effect.succeed(note),
    });

    const exit = await Effect.runPromiseExit(
      recordTasting({ teaId: sencha.id, rating: 9, notes: null }).pipe(
        Effect.provide(Layer.merge(teasLive, journalLive)),
      ),
    );

    expect(exit._tag).toBe("Failure");
  });

  it("fails with TeaNotFound when the tea is missing", async () => {
    const teasLive = Layer.succeed(TeaRepository, {
      findById: () => Effect.fail(new TeaNotFound({ teaId: sencha.id })),
      insert: () => Effect.succeed(sencha),
    });
    const journalLive = Layer.succeed(JournalRepository, {
      insert: (note) => Effect.succeed(note),
    });

    const exit = await Effect.runPromiseExit(
      recordTasting({ teaId: sencha.id, rating: 4, notes: null }).pipe(
        Effect.provide(Layer.merge(teasLive, journalLive)),
      ),
    );

    expect(exit._tag).toBe("Failure");
  });
});
