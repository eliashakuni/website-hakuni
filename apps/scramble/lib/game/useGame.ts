"use client";

import { useLocale } from "next-intl";
import { useSyncExternalStore } from "react";
import type { Language } from "../languages";
import {
  boardSizePreference,
  gameDurationPreference,
  gameModePreference,
  type Preference,
} from "./preferences";
import { getGameStore } from "./store";

const getServerState = () => null;

function usePreference<T extends string>(preference: Preference<T>): T {
  return useSyncExternalStore(preference.subscribe, preference.get, preference.getServer);
}

/**
 * The game for the current language and the chosen board size and game mode,
 * plus the chosen duration for the next game started.
 * `state` is null during server rendering and hydration, as storage isn't readable yet.
 */
export function useGame() {
  const lang = useLocale() as Language;
  const size = usePreference(boardSizePreference);
  const mode = usePreference(gameModePreference);
  const duration = usePreference(gameDurationPreference);
  const store = getGameStore(lang, size, mode);
  const state = useSyncExternalStore(store.subscribe, store.getState, getServerState);
  return { lang, size, mode, duration, state, store };
}
