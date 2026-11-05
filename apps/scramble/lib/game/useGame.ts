"use client";

import { useLocale } from "next-intl";
import { useSyncExternalStore } from "react";
import type { Language } from "../languages";
import { getGameStore } from "./store";

const getServerState = () => null;

/** `state` is null during server rendering and hydration, as storage isn't readable yet. */
export function useGame() {
  const lang = useLocale() as Language;
  const store = getGameStore(lang);
  const state = useSyncExternalStore(store.subscribe, store.getState, getServerState);
  return { lang, state, store };
}
