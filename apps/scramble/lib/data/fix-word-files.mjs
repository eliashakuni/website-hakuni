// Requires fi-all-words.json and sv-all-words.json
//
// Writes, for each language:
//   [language]/[size]/words.json    – words that fit on a board of that size
//   [language]/[size]/letters.json  – cumulative letter frequencies of those words
//   [language]/longest-words.json   – at least LONGEST_WORDS_MIN of the longest words

import { mkdir, readFile, writeFile } from "node:fs/promises";

const LANGUAGES = ["fi", "sv", "en"];

const BOARD_SIZES = {
  standard: 5,
  large: 6,
  huge: 7,
};

const LONGEST_WORDS_MIN = 3000;

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

// Takes whole length groups, longest first, until there are at least `min`
// words, so the cut-off depends only on word length, never on alphabetical order.
const longestWords = (words, min) => {
  const byLengthDesc = Array.from(words).sort((a, b) => b.length - a.length);

  const result = [];
  let i = 0;

  while (i < byLengthDesc.length && result.length < min) {
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
    const collator = new Intl.Collator(language);

    const words = JSON.parse(
      await readFile(`${language}-all-words.json`, "utf8"),
    );

    console.log(`Processing language: ${language}`);
    console.log(`Total words: ${words.length}`);

    // Sort according to the language's alphabetical order
    const sortedWords = Array.from(words).sort(collator.compare);

    for (const [name, size] of Object.entries(BOARD_SIZES)) {
      const maxLength = size * size;
      const dir = `${language}/${name}`;

      const boardWords = sortedWords.filter((word) => word.length < maxLength);

      await mkdir(dir, { recursive: true });
      await writeJson(`${dir}/words.json`, boardWords);
      await writeJson(`${dir}/letters.json`, countLetters(boardWords));

      console.log(
        `  ${name} (${size}×${size}): saved ${boardWords.length} words to ${dir}/words.json ` +
          `(filtered out ${words.length - boardWords.length}).`,
      );
    }

    const longest = longestWords(words, LONGEST_WORDS_MIN).sort(
      collator.compare,
    );
    const shortestIncluded = Math.min(...longest.map((word) => word.length));

    await writeJson(`${language}/longest-words.json`, longest);

    console.log(
      `  Saved ${longest.length} longest words (${shortestIncluded}+ letters) ` +
        `to ${language}/longest-words.json.`,
    );
  }
}

main().catch((error) => {
  console.error("Failed:", error.message);
  process.exitCode = 1;
});
