import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Database = ReturnType<typeof makeDatabase>;

/**
 * Build a Drizzle client over a `pg` Pool for the auth database.
 * The pool connects lazily on the first query, so this is cheap to create.
 */
export const makeDatabase = (connectionString: string) => {
  const pool = new Pool({ connectionString });
  return drizzle(pool, { schema });
};
