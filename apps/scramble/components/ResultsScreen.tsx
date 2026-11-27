"use client";

import { useTranslations } from "next-intl";
import { useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { dictionaryUrl, gradeKey, guessPoints, totalScore } from "@/lib/game/rules";
import { useGame } from "@/lib/game/useGame";
import { Board } from "./Board";
import { GameMenu } from "./GameMenu";
import { panelClass } from "./panelClass";
import { StatsPanel } from "./StatsPanel";

export function ResultsScreen() {
  const t = useTranslations("results");
  const tGrades = useTranslations("grades");
  const tGame = useTranslations("game");
  const router = useRouter();
  const { lang, state, store } = useGame();
  const game = state?.game ?? null;
  const [menuOpen, setMenuOpen] = useState(false);

  // Next keeps hidden pages mounted (Activity), so close the menu when leaving.
  useLayoutEffect(() => () => setMenuOpen(false), []);

  const hydrated = state !== null;
  const hasGame = game !== null;
  const finished = game?.finished ?? false;

  useEffect(() => {
    if (!hydrated) return;
    if (!hasGame) router.replace("/");
    else if (!finished) router.replace("/game");
  }, [hydrated, hasGame, finished, router]);

  if (!game) return null;

  const collator = new Intl.Collator(lang);
  // Long-word mode: the long word is pinned above the rest of the list.
  const words = game.wordList
    .filter((word) => word !== game.longWord)
    .sort(collator.compare);
  const longWordGuess = game.guesses.find(
    (guess) => guess.correct && guess.word === game.longWord,
  );
  const incorrectGuesses = game.guesses.filter((guess) => !guess.correct);
  const grade = tGrades(gradeKey(totalScore(game.guesses), game.maxPoints));

  return (
    <div className="screen results-screen">
      <StatsPanel game={game} onOpenMenu={() => setMenuOpen(true)}>
        <p className="py-1 text-lg sm:text-2xl">{t("grade", { grade })}</p>
      </StatsPanel>

      <div className={`area-list flex flex-col overflow-hidden ${panelClass}`}>
        {game.longWord ? (
          <div
            role="group"
            aria-label={tGame("longWord")}
            className={`mx-2 mt-2 mb-1 flex shrink-0 flex-wrap items-baseline justify-between gap-x-2 px-2 py-1 leading-tight sm:mx-3 sm:px-3 sm:text-lg ${
              longWordGuess ? "long-word" : "long-word-missed"
            }`}
          >
            <a
              href={dictionaryUrl(lang, game.longWord, game.slugs?.[game.longWord])}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 hover:underline"
            >
              {game.longWord}
            </a>
            {longWordGuess ? (
              <span className="ml-auto whitespace-nowrap">{guessPoints(longWordGuess)}</span>
            ) : null}
          </div>
        ) : null}
        <div className="relative min-h-0 flex-1">
          <ul
            aria-label={t("words")}
            className="absolute inset-0 overflow-y-auto px-3 py-2 leading-7 [scrollbar-width:thin] sm:px-5 sm:text-lg"
          >
            {words.map((word) => {
              const guess = game.guesses.find((candidate) => candidate.word === word);
              return (
                <li key={word} className={`flex justify-between gap-2 ${guess ? "text-correct" : ""}`}>
                  <a
                    href={dictionaryUrl(lang, word, game.slugs?.[word])}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate hover:underline"
                  >
                    {word}
                  </a>
                  {guess ? <span>{guessPoints(guess)}</span> : null}
                </li>
              );
            })}
            {incorrectGuesses.map((guess) => (
              <li key={guess.word} className="flex justify-between gap-2 text-incorrect">
                <span className="truncate">{guess.word}</span>
                <span>{guessPoints(guess)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Board plane={game.plane} label={t("board")} />

      {menuOpen ? (
        <GameMenu
          gameRunning={!finished}
          onClose={() => setMenuOpen(false)}
          onNewGame={store.abandon}
          onShowResults={store.finish}
        />
      ) : null}
    </div>
  );
}
