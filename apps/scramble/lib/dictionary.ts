import fiWords from "./data/fi-standard-words.json";
import svWords from "./data/sv-standard-words.json";
import type { Language } from "./languages";

const dictionaries: Record<Language, readonly string[]> = {
  fi: fiWords,
  sv: svWords,
};

export function getDictionary(lang: Language): readonly string[] {
  return dictionaries[lang];
}
