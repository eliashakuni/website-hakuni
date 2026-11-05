// Requires fi-all-words.json and sv-all-words.json

import { readFile, writeFile } from "node:fs/promises";

const LANGUAGES = ["fi", "sv"];

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

  return JSON.stringify(
    {
      letters: letterEntries.map(([letter]) => letter),
      cumulative: cumulativePercentages,
    },
    null,
    2,
  );
};

async function main() {
  for (const language of LANGUAGES) {
    const words = JSON.parse(
      await readFile(`${language}-all-words.json`, "utf8"),
    );

    console.log(`Processing language: ${language}`);
    console.log(`Total words: ${words.length}`);

    const standardWords = Array.from(words)
      .filter((word) => word.length < 25)
      // Sort according to Finnish alphabetical order
      .sort((a, b) => a.localeCompare(b, language));

    console.log(`Filtered out ${words.length - standardWords.length} entries.`);

    await writeFile(
      `${language}-standard-words.json`,
      JSON.stringify(standardWords, null, 2) + "\n",
      "utf8",
    );

    const standardLetters = countLetters(standardWords);

    await writeFile(
      `${language}-standard-letters.json`,
      standardLetters + "\n",
      "utf8",
    );
  }

  console.log(
    `Saved ${standardWords.length} words to ${language}-standard-words.json.`,
  );
}

main().catch((error) => {
  console.error("Failed:", error.message);
  process.exitCode = 1;
});
