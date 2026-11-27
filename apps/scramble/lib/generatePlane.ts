import { hasLongerWordWithPrefix, hasWord } from "./binarySearch";
import { BOARD_DIMENSIONS, type BoardSize } from "./boardSizes";
import { getDictionary } from "./dictionary";
import type { GameMode } from "./gameModes";
import type { Language } from "./languages";
import { MIN_WORD_LENGTH } from "./game/rules";
import { randomLetter } from "./letters";
import { randomLongWord } from "./longWords";
import { randomPath } from "./randomPath";

export interface Plane {
  plane: string[][];
  wordList: string[];
  /** Dictionary lookup keys for the words in `wordList` that need one (word -> slug). */
  slugs?: Record<string, string>;
  tries: number;
  points: number;
  /** Long-word mode: the long word hidden on the board. Always in `wordList`. */
  longWord?: string;
}

// The generator retries until a plane is worth at least this many points. Large and huge
// sit at the same share of random boards as standard: about the top 1% for fi, 2% for sv
// and 10% for en (measured from 300 random boards per size and language, 2026-11-26).
const MIN_POINTS: Record<BoardSize, Record<Language, number>> = {
  standard: { fi: 7000, sv: 5000, en: 5000 },
  large: { fi: 19000, sv: 7500, en: 14000 },
  huge: { fi: 34000, sv: 15000, en: 25000 },
};
// The PHP version looped forever; keep the best attempt if the cap is hit.
const MAX_TRIES = 500;

const NEIGHBOURS = [
  [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1],
];

function buildGrid(lang: Language, size: BoardSize): string[][] {
  const side = BOARD_DIMENSIONS[size];
  return Array.from({ length: side }, () =>
    Array.from({ length: side }, () => randomLetter(lang, size)),
  );
}

/** A normal grid with `word` written along a random path of adjacent tiles. */
function buildGridWithWord(lang: Language, size: BoardSize, word: string): string[][] {
  const grid = buildGrid(lang, size);
  const letters = [...word];
  randomPath(grid.length, letters.length).forEach(({ row, col }, i) => {
    grid[row][col] = letters[i];
  });
  return grid;
}

function findWords(grid: string[][], dictionary: readonly string[]): Set<string> {
  const found = new Set<string>();
  const side = grid.length;
  // Not a bitmask: 6×6 has 36 tiles, more than fit in JavaScript's 32-bit bitwise ops.
  const visited = Array.from({ length: side }, () => new Array<boolean>(side).fill(false));

  const crawl = (x: number, y: number, word: string) => {
    if (word.length >= MIN_WORD_LENGTH && hasWord(dictionary, word)) {
      found.add(word);
    }
    if (!hasLongerWordWithPrefix(dictionary, word)) return;

    visited[y][x] = true;
    for (const [dx, dy] of NEIGHBOURS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= side || ny >= side || visited[ny][nx]) continue;
      crawl(nx, ny, word + grid[ny][nx].toLowerCase());
    }
    visited[y][x] = false;
  };

  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      crawl(x, y, grid[y][x].toLowerCase());
    }
  }
  return found;
}

function countPoints(words: Iterable<string>): number {
  let points = 0;
  for (const word of words) points += 2 ** word.length;
  return points;
}

function pickSlugs(
  words: readonly string[],
  slugs: Readonly<Record<string, string>>,
): Record<string, string> {
  const picked: Record<string, string> = {};
  for (const word of words) {
    if (Object.hasOwn(slugs, word)) picked[word] = slugs[word];
  }
  return picked;
}

function toPlane(
  lang: Language,
  size: BoardSize,
  plane: string[][],
  words: Set<string>,
  tries: number,
  extra?: Pick<Plane, "longWord">,
): Plane {
  const { slugs } = getDictionary(lang, size);
  const wordList = [...words].sort(new Intl.Collator(lang).compare);
  return {
    plane,
    wordList,
    ...(slugs && { slugs: pickSlugs(wordList, slugs) }),
    tries,
    points: countPoints(words),
    ...extra,
  };
}

function generateStandardPlane(lang: Language, size: BoardSize): Plane {
  const { words: dictionary } = getDictionary(lang, size);
  let best = { plane: [] as string[][], words: new Set<string>(), points: -1 };
  let tries = 0;

  while (tries < MAX_TRIES) {
    tries++;
    const plane = buildGrid(lang, size);
    const words = findWords(plane, dictionary);
    const points = countPoints(words);

    if (points > best.points) best = { plane, words, points };
    if (points >= MIN_POINTS[size][lang]) break;
  }

  return toPlane(lang, size, best.plane, best.words, tries);
}

// No retries for a points target: the long word alone (2^length) outweighs everything
// else on the board many times over.
function generateLongWordPlane(lang: Language, size: BoardSize): Plane {
  const { words: dictionary } = getDictionary(lang, size);
  const longWord = randomLongWord(lang, size);
  const plane = buildGridWithWord(lang, size, longWord);
  const words = findWords(plane, dictionary);
  return toPlane(lang, size, plane, words, 1, { longWord });
}

export function generatePlane(lang: Language, size: BoardSize, mode: GameMode): Plane {
  return mode === "longWord"
    ? generateLongWordPlane(lang, size)
    : generateStandardPlane(lang, size);
}
