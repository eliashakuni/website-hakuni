"use client";

import { useLocale } from "next-intl";
import { useSyncExternalStore } from "react";
import type { Language } from "../languages";
import { getBoardSize, getServerBoardSize, subscribeBoardSize } from "./boardSizePreference";
import { getGameStore } from "./store";

const getServerState = () => null;

/**
 * The game for the current language and the chosen board size.
 * `state` is null during server rendering and hydration, as storage isn't readable yet.
 */
export function useGame() {
  const lang = useLocale() as Language;
  const size = useSyncExternalStore(subscribeBoardSize, getBoardSize, getServerBoardSize);
  const store = getGameStore(lang, size);
  const state = useSyncExternalStore(store.subscribe, store.getState, getServerState);
  return { lang, size, state, store };
}
