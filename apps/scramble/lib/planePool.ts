import { and, count, eq, inArray, sql } from "drizzle-orm";
import type { BoardSize } from "./boardSizes";
import type { Db } from "./db/client";
import { planes } from "./db/schema";
import type { GameMode } from "./gameModes";
import { generatePlane } from "./generatePlane";
import type { Language } from "./languages";

/** Which pool a plane belongs to: one per language, board size and game mode. */
export interface PoolKey {
  lang: Language;
  size: BoardSize;
  mode: GameMode;
}

/** Ready planes kept per language, board size and game mode. */
export const POOL_SIZE = 3;

/** Atomically marks one ready plane as used and returns it, or undefined if none. */
export async function claimReadyRow(db: Db, { lang, size, mode }: PoolKey) {
  const [row] = await db
    .update(planes)
    .set({ status: "used", updateStartedAt: sql`now()` })
    .where(
      inArray(
        planes.id,
        sql`(select id from planes
             where language = ${lang} and board_size = ${size} and game_mode = ${mode}
               and status = 'ready'
             order by created_at
             limit 1
             for update skip locked)`,
      ),
    )
    .returning();
  return row;
}

/** Claims one plane stuck in "used" for over a minute (failed regeneration). */
async function claimStaleRow(db: Db, { lang, size, mode }: PoolKey) {
  const [row] = await db
    .update(planes)
    .set({ updateStartedAt: sql`now()` })
    .where(
      inArray(
        planes.id,
        sql`(select id from planes
             where language = ${lang} and board_size = ${size} and game_mode = ${mode}
               and status = 'used'
               and update_started_at < now() - interval '1 minute'
             limit 1
             for update skip locked)`,
      ),
    )
    .returning({ id: planes.id });
  return row;
}

export async function regenerateRow(db: Db, id: string, { lang, size, mode }: PoolKey) {
  const { plane, wordList, slugs, tries, points, longWord } = generatePlane(lang, size, mode);
  await db
    .update(planes)
    .set({
      plane,
      wordList,
      slugs: slugs ?? null,
      tries,
      points,
      longWord: longWord ?? null,
      status: "ready",
      createdAt: sql`now()`,
      updateStartedAt: null,
    })
    .where(eq(planes.id, id));
}

export async function healStalePlanes(db: Db, key: PoolKey) {
  for (;;) {
    const stale = await claimStaleRow(db, key);
    if (!stale) return;
    await regenerateRow(db, stale.id, key);
  }
}

/** Inserts placeholder rows until the pool has POOL_SIZE planes, then fills them. */
export async function topUpPool(db: Db, { lang, size, mode }: PoolKey) {
  const ids = await db.transaction(async (tx) => {
    // Serialises concurrent top-ups so they don't overshoot the pool size.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`planes:${lang}:${size}:${mode}`}))`);
    const [{ total }] = await tx
      .select({ total: count() })
      .from(planes)
      .where(
        and(
          eq(planes.language, lang),
          eq(planes.boardSize, size),
          eq(planes.gameMode, mode),
        ),
      );
    const missing = POOL_SIZE - total;
    if (missing <= 0) return [];

    const inserted = await tx
      .insert(planes)
      .values(
        Array.from({ length: missing }, () => ({
          language: lang,
          boardSize: size,
          gameMode: mode,
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

  for (const id of ids) await regenerateRow(db, id, { lang, size, mode });
}

export async function maintainPool(db: Db, key: PoolKey) {
  await healStalePlanes(db, key);
  await topUpPool(db, key);
}
