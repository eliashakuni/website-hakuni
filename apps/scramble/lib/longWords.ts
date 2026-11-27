import type { BoardSize } from "./boardSizes";
import enHuge from "./data/en/huge/longest-words.json";
import enLarge from "./data/en/large/longest-words.json";
import enStandard from "./data/en/standard/longest-words.json";
import fiHuge from "./data/fi/huge/longest-words.json";
import fiLarge from "./data/fi/large/longest-words.json";
import fiStandard from "./data/fi/standard/longest-words.json";
import svHuge from "./data/sv/huge/longest-words.json";
import svLarge from "./data/sv/large/longest-words.json";
import svStandard from "./data/sv/standard/longest-words.json";
import type { Language } from "./languages";

/** The longest words that fit on each board size, for the long-word mode. */
const longWords: Record<Language, Record<BoardSize, readonly string[]>> = {
  fi: { standard: fiStandard, large: fiLarge, huge: fiHuge },
  sv: { standard: svStandard, large: svLarge, huge: svHuge },
  en: { standard: enStandard, large: enLarge, huge: enHuge },
};

export function randomLongWord(lang: Language, size: BoardSize): string {
  const words = longWords[lang][size];
  return words[Math.floor(Math.random() * words.length)];
}
