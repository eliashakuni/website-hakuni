import fiLetters from "./data/fi/standard/letters.json";
import svLetters from "./data/sv/standard/letters.json";
import enLetters from "./data/en/standard/letters.json";
import { lowerBound } from "./binarySearch";
import type { Language } from "./languages";

interface LetterTable {
  letters: string[];
  /** Ascending cumulative probabilities in [0, 1]. */
  cumulative: number[];
}

const letterTables: Record<Language, LetterTable> = {
  fi: fiLetters,
  sv: svLetters,
  en: enLetters,
};

export function randomLetter(lang: Language): string {
  const { letters, cumulative } = letterTables[lang];
  const index = lowerBound(cumulative, Math.random());
  return letters[Math.min(index, letters.length - 1)];
}
