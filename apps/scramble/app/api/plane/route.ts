import { after } from "next/server";
import { db as maybeDb } from "@/lib/db/client";
import { generatePlane, type Plane } from "@/lib/generatePlane";
import { isLanguage, LANGUAGES } from "@/lib/languages";
import { claimReadyRow, maintainPool, regenerateRow } from "@/lib/planePool";

// Background regeneration runs after the response, so allow time for it.
export const maxDuration = 60;

export async function GET(request: Request) {
  const lang = new URL(request.url).searchParams.get("lang");
  if (!isLanguage(lang)) {
    return Response.json({ error: `lang must be one of: ${LANGUAGES.join(", ")}` }, { status: 400 });
  }

  let result: Plane | undefined;

  const db = maybeDb;
  if (db) {
    try {
      const claimed = await claimReadyRow(db, lang);
      if (claimed) {
        result = {
          plane: claimed.plane,
          wordList: claimed.wordList,
          ...(claimed.slugs && { slugs: claimed.slugs }),
          tries: claimed.tries,
          points: claimed.points,
        };
        after(() =>
          regenerateRow(db, claimed.id, lang)
            .then(() => maintainPool(db, lang))
            .catch((e) => console.error("plane regeneration failed", e)),
        );
      } else {
        after(() =>
          maintainPool(db, lang).catch((e) => console.error("pool top-up failed", e)),
        );
      }
    } catch (e) {
      console.error("database unavailable, generating plane directly", e);
    }
  }

  result ??= generatePlane(lang);
  return Response.json(result);
}
