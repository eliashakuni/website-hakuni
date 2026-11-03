import fiWords from "./data/fi-standard-words.json";
import seWords from "./data/se-standard-words.json";
import type { Language } from "./languages";

const dictionaries: Record<Language, readonly string[]> = {
  fi: fiWords,
  se: seWords,
};

export function getDictionary(lang: Language): readonly string[] {
  return dictionaries[lang];
}
