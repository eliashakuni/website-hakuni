import type { Language } from "../languages";

export const MIN_WORD_LENGTH = 3;
export const GAME_DURATION_MS = 180_000;

export interface Guess {
  word: string;
  correct: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export function isAdjacent(a: Position, b: Position): boolean {
  return Math.abs(a.row - b.row) <= 1 && Math.abs(a.col - b.col) <= 1;
}

export function samePosition(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

export function guessPoints({ word, correct }: Guess): number {
  return correct ? 2 ** word.length : -word.length;
}

export function totalScore(guesses: readonly Guess[]): number {
  return guesses.reduce((sum, guess) => sum + guessPoints(guess), 0);
}

export function foundWordCount(guesses: readonly Guess[]): number {
  return guesses.filter((guess) => guess.correct).length;
}

export type GradeKey = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "perfect";

/** Grades are 10% bands of the available points; a perfect game gets its own joke grade. */
export function gradeKey(score: number, maxPoints: number): GradeKey {
  if (maxPoints > 0 && score >= maxPoints) return "perfect";
  const ratio = maxPoints > 0 ? score / maxPoints : 0;
  return String(Math.max(0, Math.floor(ratio * 10))) as GradeKey;
}

const DICTIONARY_URLS: Record<Language, (slug: string) => string> = {
  fi: (word) => `https://www.kielitoimistonsanakirja.fi/#/${word}?searchMode=all`,
  sv: (word) => `https://svenska.se/?q=${word}&exactMatch=true&activeTab=saol`,
  en: (slug) => `https://dictionary.cambridge.org/dictionary/english/${slug}`,
};

/** Links to the word's dictionary entry, using its slug when the language has one. */
export function dictionaryUrl(lang: Language, word: string, slug?: string): string {
  return DICTIONARY_URLS[lang](encodeURIComponent(slug ?? word));
}
