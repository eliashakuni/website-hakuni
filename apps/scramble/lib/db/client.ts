import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function createDb() {
  // Set by Vercel's Supabase integration: the pooled (transaction mode) connection.
  const url = process.env.POSTGRES_URL;
  if (!url) return null;
  // prepare: false is required for Supabase's transaction pooler.
  return drizzle(postgres(url, { prepare: false }), { schema });
}

export const db = createDb();
export type Db = NonNullable<typeof db>;
