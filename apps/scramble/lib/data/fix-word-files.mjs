// Requires fi-all-words.json, sv-all-words.json and en-all-words.json
//
// Writes, for each language:
//   [language]/[size]/words.json    – words that fit on a board of that size, sorted
//                                     by UTF-16 code unit (plain .sort()), the order
//                                     the game's binary search expects
//   [language]/[size]/letters.json  – cumulative letter frequencies of those words
//   [language]/[size]/longest-words.json – the longest words that fit on that board
//                                     size, for the long-word game mode: at least
//                                     LONGEST_WORDS_MIN of them, and every word down to
//                                     LONG_WORD_SPAN letters shorter than the tile count

import { mkdir, readFile, writeFile } from "node:fs/promises";

const LANGUAGES = ["fi", "sv", "en"];

// Tiles per side. Keep in sync with BOARD_DIMENSIONS in lib/boardSizes.ts.
const BOARD_SIZES = {
  standard: 4,
  large: 5,
  huge: 6,
};

const LONGEST_WORDS_MIN = 3000;

// The long-word list always reaches this many letters below the tile count, even when
// there are LONGEST_WORDS_MIN longer words: down to 14 letters on 4×4, 23 on 5×5 and
// 34 on 6×6. Otherwise e.g. Finnish 4×4 would only get 16-letter words, which fill the
// whole board.
const LONG_WORD_SPAN = 2;

const writeJson = (path, data) =>
  writeFile(path, JSON.stringify(data, null, 2) + "\n", "utf8");

const countLetters = (words) => {
  const letterCounts = {};

  for (const word of words) {
    for (const letter of word) {
      letterCounts[letter] = (letterCounts[letter] ?? 0) + 1;
    }
  }

  const letterEntries = Object.entries(letterCounts).sort(([a], [b]) =>
    a.localeCompare(b, "fi"),
  );

  const totalLetters = letterEntries.reduce((sum, [, count]) => sum + count, 0);

  const cumulativeCounts = [];
  let cumulative = 0;

  for (const [, count] of letterEntries) {
    cumulative += count;
    cumulativeCounts.push(cumulative);
  }

  const cumulativePercentages = cumulativeCounts.map(
    (count) => count / totalLetters,
  );

  return {
    letters: letterEntries.map(([letter]) => letter),
    cumulative: cumulativePercentages,
  };
};

// Takes whole length groups, longest first, until there are at least `min` words and
// every word of at least `minLength` letters is in, so the cut-off depends only on word
// length, never on alphabetical order.
const longestWords = (words, min, minLength) => {
  const byLengthDesc = Array.from(words).sort((a, b) => b.length - a.length);

  const result = [];
  let i = 0;

  while (
    i < byLengthDesc.length &&
    (result.length < min || byLengthDesc[i].length >= minLength)
  ) {
    const length = byLengthDesc[i].length;

    while (i < byLengthDesc.length && byLengthDesc[i].length === length) {
      result.push(byLengthDesc[i]);
      i++;
    }
  }

  return result;
};

async function main() {
  for (const language of LANGUAGES) {
    const words = JSON.parse(
      await readFile(`${language}-all-words.json`, "utf8"),
    );

    console.log(`Processing language: ${language}`);
    console.log(`Total words: ${words.length}`);

    // Code-unit order, not the language's alphabetical order: the game binary-searches
    // these with < and ===, which would miss words if e.g. å sorted before ä.
    const sortedWords = Array.from(words).sort();

    for (const [name, size] of Object.entries(BOARD_SIZES)) {
      // A word can use every tile once, so it can be at most size² letters long.
      const maxLength = size * size;
      const dir = `${language}/${name}`;

      const boardWords = sortedWords.filter((word) => word.length <= maxLength);

      await mkdir(dir, { recursive: true });
      await writeJson(`${dir}/words.json`, boardWords);
      await writeJson(`${dir}/letters.json`, countLetters(boardWords));

      console.log(
        `  ${name} (${size}×${size}): saved ${boardWords.length} words to ${dir}/words.json ` +
          `(filtered out ${words.length - boardWords.length}).`,
      );

      // The long-word mode hides one of these on the board, so they must fit it too.
      const longest = longestWords(
        boardWords,
        LONGEST_WORDS_MIN,
        maxLength - LONG_WORD_SPAN,
      ).sort();
      const shortestIncluded = Math.min(...longest.map((word) => word.length));

      await writeJson(`${dir}/longest-words.json`, longest);

      console.log(
        `    Saved ${longest.length} longest words (${shortestIncluded}–${maxLength} letters) ` +
          `to ${dir}/longest-words.json.`,
      );
    }
  }
}

main().catch((error) => {
  console.error("Failed:", error.message);
  process.exitCode = 1;
});
