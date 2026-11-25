import { hasLongerWordWithPrefix, hasWord, lowerBound } from "./binarySearch";
import { getDictionary } from "./dictionary";
import type { Language } from "./languages";
import { MIN_WORD_LENGTH } from "./game/rules";
import { randomLetter } from "./letters";

export interface Plane {
  plane: string[][];
  wordList: string[];
  /** Dictionary lookup keys, parallel to `wordList`; only for languages that have them. */
  slugList?: string[];
  tries: number;
  points: number;
}

const SIZE = 4;
// TODO: tune "en" once the real English word list is in.
const MIN_POINTS: Record<Language, number> = { fi: 7000, sv: 5000, en: 5000 };
// The PHP version looped forever; keep the best attempt if the cap is hit.
const MAX_TRIES = 500;

const NEIGHBOURS = [
  [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1],
];

function buildGrid(lang: Language): string[][] {
  return Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => randomLetter(lang)),
  );
}

function findWords(grid: string[][], dictionary: readonly string[]): Set<string> {
  const found = new Set<string>();

  const crawl = (x: number, y: number, visited: number, word: string) => {
    if (word.length >= MIN_WORD_LENGTH && hasWord(dictionary, word)) {
      found.add(word);
    }
    if (!hasLongerWordWithPrefix(dictionary, word)) return;

    for (const [dx, dy] of NEIGHBOURS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) continue;
      const bit = 1 << (ny * SIZE + nx);
      if (visited & bit) continue;
      crawl(nx, ny, visited | bit, word + grid[ny][nx].toLowerCase());
    }
  };

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      crawl(x, y, 1 << (y * SIZE + x), grid[y][x].toLowerCase());
    }
  }
  return found;
}

function countPoints(words: Iterable<string>): number {
  let points = 0;
  for (const word of words) points += 2 ** word.length;
  return points;
}

export function generatePlane(lang: Language): Plane {
  const { words: dictionary, slugs } = getDictionary(lang);
  let best = { plane: [] as string[][], words: new Set<string>(), points: -1 };
  let tries = 0;

  while (tries < MAX_TRIES) {
    tries++;
    const plane = buildGrid(lang);
    const words = findWords(plane, dictionary);
    const points = countPoints(words);

    if (points > best.points) best = { plane, words, points };
    if (points >= MIN_POINTS[lang]) break;
  }

  const wordList = [...best.words].sort();
  return {
    plane: best.plane,
    wordList,
    ...(slugs && {
      slugList: wordList.map((word) => slugs[lowerBound(dictionary, word)]),
    }),
    tries,
    points: best.points,
  };
}
