import { lowerBound } from "./binarySearch";
import type { BoardSize } from "./boardSizes";
import enHuge from "./data/en/huge/letters.json";
import enLarge from "./data/en/large/letters.json";
import enStandard from "./data/en/standard/letters.json";
import fiHuge from "./data/fi/huge/letters.json";
import fiLarge from "./data/fi/large/letters.json";
import fiStandard from "./data/fi/standard/letters.json";
import svHuge from "./data/sv/huge/letters.json";
import svLarge from "./data/sv/large/letters.json";
import svStandard from "./data/sv/standard/letters.json";
import type { Language } from "./languages";

interface LetterTable {
  letters: string[];
  /** Ascending cumulative probabilities in [0, 1]. */
  cumulative: number[];
}

const letterTables: Record<Language, Record<BoardSize, LetterTable>> = {
  fi: { standard: fiStandard, large: fiLarge, huge: fiHuge },
  sv: { standard: svStandard, large: svLarge, huge: svHuge },
  en: { standard: enStandard, large: enLarge, huge: enHuge },
};

export function randomLetter(lang: Language, size: BoardSize): string {
  const { letters, cumulative } = letterTables[lang][size];
  const index = lowerBound(cumulative, Math.random());
  return letters[Math.min(index, letters.length - 1)];
}
