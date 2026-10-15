import { Context, type Effect } from "effect";
import type { PersistenceError, TeaNotFound } from "../domain/errors";
import type { TastingNote } from "../domain/tasting-note";
import type { NewTea, Tea, TeaId } from "../domain/tea";

/**
 * Port (driven): persistence for the tea catalog.
 * Implemented in the `@repo/infra` package.
 */
export class TeaRepository extends Context.Service<
  TeaRepository,
  {
    findById(id: TeaId): Effect.Effect<Tea, TeaNotFound | PersistenceError>;
    insert(tea: NewTea): Effect.Effect<Tea, PersistenceError>;
  }
>()("tea-rate/TeaRepository") {}

/**
 * Port (driven): persistence for a user's journal entries.
 * Implemented in the `@repo/infra` package.
 */
export class JournalRepository extends Context.Service<
  JournalRepository,
  {
    insert(note: TastingNote): Effect.Effect<TastingNote, PersistenceError>;
  }
>()("tea-rate/JournalRepository") {}
