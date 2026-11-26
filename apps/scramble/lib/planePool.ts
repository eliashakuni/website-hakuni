import { and, count, eq, inArray, sql } from "drizzle-orm";
import type { BoardSize } from "./boardSizes";
import type { Db } from "./db/client";
import { planes } from "./db/schema";
import { generatePlane } from "./generatePlane";
import type { Language } from "./languages";

/** Ready planes kept per language and board size. */
export const POOL_SIZE = 3;

/** Atomically marks one ready plane as used and returns it, or undefined if none. */
export async function claimReadyRow(db: Db, lang: Language, size: BoardSize) {
  const [row] = await db
    .update(planes)
    .set({ status: "used", updateStartedAt: sql`now()` })
    .where(
      inArray(
        planes.id,
        sql`(select id from planes
             where language = ${lang} and board_size = ${size} and status = 'ready'
             order by created_at
             limit 1
             for update skip locked)`,
      ),
    )
    .returning();
  return row;
}

/** Claims one plane stuck in "used" for over a minute (failed regeneration). */
async function claimStaleRow(db: Db, lang: Language, size: BoardSize) {
  const [row] = await db
    .update(planes)
    .set({ updateStartedAt: sql`now()` })
    .where(
      inArray(
        planes.id,
        sql`(select id from planes
             where language = ${lang} and board_size = ${size} and status = 'used'
               and update_started_at < now() - interval '1 minute'
             limit 1
             for update skip locked)`,
      ),
    )
    .returning({ id: planes.id });
  return row;
}

export async function regenerateRow(db: Db, id: string, lang: Language, size: BoardSize) {
  const { plane, wordList, slugs, tries, points } = generatePlane(lang, size);
  await db
    .update(planes)
    .set({
      plane,
      wordList,
      slugs: slugs ?? null,
      tries,
      points,
      status: "ready",
      createdAt: sql`now()`,
      updateStartedAt: null,
    })
    .where(eq(planes.id, id));
}

export async function healStalePlanes(db: Db, lang: Language, size: BoardSize) {
  for (;;) {
    const stale = await claimStaleRow(db, lang, size);
    if (!stale) return;
    await regenerateRow(db, stale.id, lang, size);
  }
}

/** Inserts placeholder rows until the language and size have POOL_SIZE planes, then fills them. */
export async function topUpPool(db: Db, lang: Language, size: BoardSize) {
  const ids = await db.transaction(async (tx) => {
    // Serialises concurrent top-ups so they don't overshoot the pool size.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`planes:${lang}:${size}`}))`);
    const [{ total }] = await tx
      .select({ total: count() })
      .from(planes)
      .where(and(eq(planes.language, lang), eq(planes.boardSize, size)));
    const missing = POOL_SIZE - total;
    if (missing <= 0) return [];

    const inserted = await tx
      .insert(planes)
      .values(
        Array.from({ length: missing }, () => ({
          language: lang,
          boardSize: size,
          plane: [],
          wordList: [],
          tries: 0,
          points: 0,
          status: "used" as const,
          updateStartedAt: sql`now()`,
        })),
      )
      .returning({ id: planes.id });
    return inserted.map((r) => r.id);
  });

  for (const id of ids) await regenerateRow(db, id, lang, size);
}

export async function maintainPool(db: Db, lang: Language, size: BoardSize) {
  await healStalePlanes(db, lang, size);
  await topUpPool(db, lang, size);
}
