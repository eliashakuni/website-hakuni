import { after } from "next/server";
import { BOARD_SIZES, DEFAULT_BOARD_SIZE, isBoardSize } from "@/lib/boardSizes";
import { db as maybeDb } from "@/lib/db/client";
import { DEFAULT_GAME_MODE, GAME_MODES, isGameMode } from "@/lib/gameModes";
import { generatePlane, type Plane } from "@/lib/generatePlane";
import { isLanguage, LANGUAGES } from "@/lib/languages";
import { claimReadyRow, maintainPool, type PoolKey, regenerateRow } from "@/lib/planePool";

// Background regeneration runs after the response, so allow time for it.
export const maxDuration = 60;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lang = params.get("lang");
  if (!isLanguage(lang)) {
    return Response.json({ error: `lang must be one of: ${LANGUAGES.join(", ")}` }, { status: 400 });
  }
  const size = params.get("size") ?? DEFAULT_BOARD_SIZE;
  if (!isBoardSize(size)) {
    return Response.json(
      { error: `size must be one of: ${BOARD_SIZES.join(", ")}` },
      { status: 400 },
    );
  }

  const mode = params.get("mode") ?? DEFAULT_GAME_MODE;
  if (!isGameMode(mode)) {
    return Response.json(
      { error: `mode must be one of: ${GAME_MODES.join(", ")}` },
      { status: 400 },
    );
  }

  const key: PoolKey = { lang, size, mode };
  let result: Plane | undefined;

  const db = maybeDb;
  if (db) {
    try {
      const claimed = await claimReadyRow(db, key);
      if (claimed) {
        result = {
          plane: claimed.plane,
          wordList: claimed.wordList,
          ...(claimed.slugs && { slugs: claimed.slugs }),
          tries: claimed.tries,
          points: claimed.points,
          ...(claimed.longWord && { longWord: claimed.longWord }),
        };
        after(() =>
          regenerateRow(db, claimed.id, key)
            .then(() => maintainPool(db, key))
            .catch((e) => console.error("plane regeneration failed", e)),
        );
      } else {
        after(() =>
          maintainPool(db, key).catch((e) => console.error("pool top-up failed", e)),
        );
      }
    } catch (e) {
      console.error("database unavailable, generating plane directly", e);
    }
  }

  result ??= generatePlane(lang, size, mode);
  return Response.json(result);
}
