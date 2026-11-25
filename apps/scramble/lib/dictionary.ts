import enWords from "./data/en-standard-words.json";
import fiWords from "./data/fi-standard-words.json";
import svWords from "./data/sv-standard-words.json";
import type { Language } from "./languages";

export interface Dictionary {
  /** Sorted ascending, for binary search. */
  words: readonly string[];
  /** Dictionary-site lookup keys, parallel to `words`. Only some languages have them. */
  slugs?: readonly string[];
}

/** A standard-words file is either a bare word array or `{ words, slugs }`. */
type WordFile = readonly string[] | Dictionary;

function toDictionary(file: WordFile): Dictionary {
  return Array.isArray(file) ? { words: file } : (file as Dictionary);
}

const dictionaries: Record<Language, Dictionary> = {
  fi: toDictionary(fiWords),
  sv: toDictionary(svWords),
  en: toDictionary(enWords),
};

export function getDictionary(lang: Language): Dictionary {
  return dictionaries[lang];
}
