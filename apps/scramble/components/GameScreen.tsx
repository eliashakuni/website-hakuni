"use client";

import { useTranslations } from "next-intl";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { flyWord } from "@/lib/game/flyWord";
import {
  guessPoints,
  isAdjacent,
  MIN_WORD_LENGTH,
  type Position,
  samePosition,
} from "@/lib/game/rules";
import { useGame } from "@/lib/game/useGame";
import { Board } from "./Board";
import { buttonClass } from "./buttonClass";
import { GameMenu } from "./GameMenu";
import { panelClass } from "./panelClass";
import { StatsPanel } from "./StatsPanel";
import { Timer } from "./Timer";

export function GameScreen() {
  const t = useTranslations("game");
  const router = useRouter();
  const { state, store } = useGame();
  const game = state?.game ?? null;

  const [path, setPath] = useState<Position[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const wordRef = useRef<HTMLParagraphElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const pendingFlight = useRef<{ from: DOMRect; fontSize: string } | null>(null);

  // Next keeps hidden pages mounted (Activity): don't carry a half-built word or an open
  // menu over into the next game.
  useLayoutEffect(
    () => () => {
      setPath([]);
      setMenuOpen(false);
      pendingFlight.current = null;
    },
    [],
  );

  const hydrated = state !== null;
  const hasGame = game !== null;
  const finished = game?.finished ?? false;
  const latestGuess = game?.guesses[0];

  // Game state decides the route, so every way of ending a game lands in the right place.
  useEffect(() => {
    if (!hydrated) return;
    if (!hasGame) router.replace("/");
    else if (finished) router.replace("/results");
  }, [hydrated, hasGame, finished, router]);

  // Backspace removes the last letter and Escape the whole word. The menu is a modal
  // dialog that uses Escape to close itself, so the keys are left alone while it is open.
  useEffect(() => {
    if (menuOpen || finished) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "Backspace") setPath((current) => current.slice(0, -1));
      else if (event.key === "Escape") setPath([]);
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen, finished]);

  useLayoutEffect(() => {
    const flight = pendingFlight.current;
    if (!flight || !latestGuess || !listRef.current) return;
    pendingFlight.current = null;
    flyWord({ ...flight, ...latestGuess, list: listRef.current });
  }, [latestGuess]);

  if (!game) return null;

  const word = path.map(({ row, col }) => game.plane[row][col].toLowerCase()).join("");
  const canSend = word.length >= MIN_WORD_LENGTH && !finished;

  const handleTileClick = (position: Position) => {
    if (finished) return;
    const last = path.at(-1);
    if (last && samePosition(last, position)) {
      setPath(path.slice(0, -1));
    } else if (
      !last ||
      (isAdjacent(last, position) && !path.some((step) => samePosition(step, position)))
    ) {
      setPath([...path, position]);
    }
  };

  const send = () => {
    if (!canSend) return;
    // Only a new guess flies; a repeated word is dropped by the store.
    if (wordRef.current && !game.guesses.some((guess) => guess.word === word)) {
      pendingFlight.current = {
        from: wordRef.current.getBoundingClientRect(),
        fontSize: getComputedStyle(wordRef.current).fontSize,
      };
    }
    store.guess(word);
    setPath([]);
  };

  return (
    <div className="screen game-screen">
      <StatsPanel game={game} onOpenMenu={() => setMenuOpen(true)}>
        {finished ? null : <Timer deadline={game.deadline} onExpire={store.finish} />}
      </StatsPanel>

      <div className={`area-list relative ${panelClass} overflow-hidden`}>
        <ul
          ref={listRef}
          aria-label={t("guesses")}
          className="absolute inset-0 overflow-y-auto px-3 py-2 [scrollbar-width:none]"
        >
          {game.guesses.map((guess) => (
            <li
              key={guess.word}
              className={`flex justify-between gap-2 leading-7 sm:text-lg ${guess.correct ? "text-correct" : "text-incorrect"}`}
            >
              <span data-word className="inline-block truncate leading-none self-center">
                {guess.word}
              </span>
              <span>{guessPoints(guess)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="area-word relative flex items-center justify-center rounded-2xl border-4 border-panel bg-word-bar">
        <p ref={wordRef} aria-live="polite" className="text-3xl leading-none sm:text-4xl">
          {word}
        </p>
        {path.length > 0 ? (
          <button
            aria-label={t("clear")}
            title={t("clear")}
            className="absolute inset-y-0 right-0 flex aspect-square items-center justify-center text-3xl leading-none text-ink-soft transition-colors hover:text-ink sm:text-4xl"
            onClick={() => setPath([])}
          >
            ×
          </button>
        ) : null}
      </div>

      <Board plane={game.plane} label={t("board")} path={path} onTileClick={handleTileClick} />

      <button
        className={buttonClass("area-send text-2xl sm:text-3xl")}
        disabled={!canSend}
        onClick={send}
      >
        {t("send")}
      </button>

      {menuOpen ? (
        <GameMenu
          gameRunning
          onClose={() => setMenuOpen(false)}
          onNewGame={store.abandon}
          onShowResults={store.finish}
        />
      ) : null}
    </div>
  );
}
