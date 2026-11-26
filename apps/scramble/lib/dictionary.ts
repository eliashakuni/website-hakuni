import type { BoardSize } from "./boardSizes";
import enSlugs from "./data/en-slugs.json";
import enHuge from "./data/en/huge/words.json";
import enLarge from "./data/en/large/words.json";
import enStandard from "./data/en/standard/words.json";
import fiHuge from "./data/fi/huge/words.json";
import fiLarge from "./data/fi/large/words.json";
import fiStandard from "./data/fi/standard/words.json";
import svHuge from "./data/sv/huge/words.json";
import svLarge from "./data/sv/large/words.json";
import svStandard from "./data/sv/standard/words.json";
import type { Language } from "./languages";

export interface Dictionary {
  /** Sorted by UTF-16 code unit (plain `.sort()`), for binary search. */
  words: readonly string[];
  /** Dictionary-site lookup keys for the words whose key differs from the word itself. */
  slugs?: Readonly<Record<string, string>>;
}

const dictionaries: Record<Language, Record<BoardSize, Dictionary>> = {
  fi: {
    standard: { words: fiStandard },
    large: { words: fiLarge },
    huge: { words: fiHuge },
  },
  sv: {
    standard: { words: svStandard },
    large: { words: svLarge },
    huge: { words: svHuge },
  },
  en: {
    standard: { words: enStandard, slugs: enSlugs },
    large: { words: enLarge, slugs: enSlugs },
    huge: { words: enHuge, slugs: enSlugs },
  },
};

export function getDictionary(lang: Language, size: BoardSize): Dictionary {
  return dictionaries[lang][size];
}
