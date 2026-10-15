import { Layer } from "effect";
import { DBLive } from "./db/layers";
import { JournalRepositoryLive } from "./repositories/journal-repository";
import { TeaRepositoryLive } from "./repositories/tea-repository";

export * from "./db/layers";
export * from "./db/schema";
export * from "./repositories/journal-repository";
export * from "./repositories/tea-repository";

const TeaRepoWithDB = Layer.provide(TeaRepositoryLive, DBLive);
const JournalRepoWithDB = Layer.provide(JournalRepositoryLive, DBLive);

/**
 * The fully-wired application layer: repositories over a real Postgres
 * connection. Use `Effect.provide(AppLive)` to run use cases in production.
 */
export const AppLive = Layer.mergeAll(TeaRepoWithDB, JournalRepoWithDB);
