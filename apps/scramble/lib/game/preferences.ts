import { type BoardSize, DEFAULT_BOARD_SIZE, isBoardSize } from "../boardSizes";
import { DEFAULT_GAME_MODE, type GameMode, isGameMode } from "../gameModes";

/** A choice remembered between visits, readable with useSyncExternalStore. */
export interface Preference<T extends string> {
  get: () => T;
  /** What the server renders, since it can't read localStorage. */
  getServer: () => T;
  set: (value: T) => void;
  subscribe: (listener: () => void) => () => void;
}

// localStorage, not sessionStorage: the choice is remembered between visits.
function createPreference<T extends string>(
  storageKey: string,
  isValid: (value: unknown) => value is T,
  fallback: T,
): Preference<T> {
  const listeners = new Set<() => void>();
  let current: T | null = null;

  const get = (): T => {
    if (current) return current;
    try {
      const saved = localStorage.getItem(storageKey);
      current = isValid(saved) ? saved : fallback;
    } catch {
      current = fallback;
    }
    return current;
  };

  return {
    get,
    getServer: () => fallback,
    set: (value) => {
      if (value === get()) return;
      current = value;
      try {
        localStorage.setItem(storageKey, value);
      } catch {
        // Still applies for this page load, it just won't be remembered.
      }
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const boardSizePreference: Preference<BoardSize> = createPreference(
  "scramble:boardSize",
  isBoardSize,
  DEFAULT_BOARD_SIZE,
);

export const gameModePreference: Preference<GameMode> = createPreference(
  "scramble:gameMode",
  isGameMode,
  DEFAULT_GAME_MODE,
);
