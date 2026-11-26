import enSlugs from "./data/en-slugs.json";
import enWords from "./data/en/standard/words.json";
import fiWords from "./data/fi/standard/words.json";
import svWords from "./data/sv/standard/words.json";
import type { Language } from "./languages";

export interface Dictionary {
  /** Sorted ascending, for binary search. */
  words: readonly string[];
  /** Dictionary-site lookup keys for the words whose key differs from the word itself. */
  slugs?: Readonly<Record<string, string>>;
}

const dictionaries: Record<Language, Dictionary> = {
  fi: { words: fiWords },
  sv: { words: svWords },
  en: { words: enWords, slugs: enSlugs },
};

export function getDictionary(lang: Language): Dictionary {
  return dictionaries[lang];
}
