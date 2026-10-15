import { drizzle } from "drizzle-orm/node-postgres";
import { Context, Effect, Layer } from "effect";
import { Pool } from "pg";
import { env } from "../env";

export type Database = ReturnType<typeof makeDatabase>;

/**
 * Build a Drizzle client over a `pg` Pool.
 * The pool connects lazily on the first query, so this is cheap to create.
 */
const makeDatabase = () => {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  return drizzle(pool);
};

export class DB extends Context.Service<DB, Database>()("tea-rate/DB") {}

export const DBLive = Layer.effect(DB, Effect.sync(makeDatabase));
