"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { foundWordCount, totalScore } from "@/lib/game/rules";
import type { Game } from "@/lib/game/state";
import { buttonClass } from "./buttonClass";
import { panelClass } from "./panelClass";

interface StatsPanelProps {
  game: Game;
  onOpenMenu: () => void;
  /** Timer or grade, shown between the score and the word count. */
  children: ReactNode;
}

export function StatsPanel({ game, onOpenMenu, children }: StatsPanelProps) {
  const t = useTranslations("game");
  const tMenu = useTranslations("menu");

  return (
    <div className={`area-stats flex flex-col items-center justify-center gap-2 p-2 text-center ${panelClass}`}>
      <div className="flex flex-col items-center gap-1 text-sm sm:text-lg">
        <p>{t("points", { score: totalScore(game.guesses), max: game.maxPoints })}</p>
        {children}
        <p>{t("words", { found: foundWordCount(game.guesses), total: game.wordList.length })}</p>
      </div>
      <button
        className={buttonClass("flex size-12 items-center justify-center sm:size-16")}
        aria-label={tMenu("open")}
        onClick={onOpenMenu}
      >
        <svg viewBox="0 0 60 60" aria-hidden="true" className="size-6 fill-current sm:size-8">
          <rect y="5" width="60" height="10" rx="4" />
          <rect y="25" width="60" height="10" rx="4" />
          <rect y="45" width="60" height="10" rx="4" />
        </svg>
      </button>
    </div>
  );
}
