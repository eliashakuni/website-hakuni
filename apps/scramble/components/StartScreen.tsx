"use client";

import { useTranslations } from "next-intl";
import { useEffect, useLayoutEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { BOARD_DIMENSIONS, BOARD_SIZES } from "@/lib/boardSizes";
import { GAME_MODES } from "@/lib/gameModes";
import { boardSizePreference, gameModePreference } from "@/lib/game/preferences";
import { useGame } from "@/lib/game/useGame";
import { LANGUAGES } from "@/lib/languages";
import { buttonClass } from "./buttonClass";
import { RulesDialog } from "./RulesDialog";

const LANGUAGE_NAMES = { fi: "Suomi", sv: "Svenska", en: "English" } as const;

const optionClass = (selected: boolean) =>
  `flex flex-col items-center rounded-2xl px-4 py-1 transition-colors hover:text-white ${
    selected ? "bg-white/15 text-white" : "text-white/80"
  }`;

export function StartScreen() {
  const t = useTranslations("start");
  const router = useRouter();
  const { lang, size, mode, state, store } = useGame();
  // Keeps the screen stable, and stops a spare plane being fetched, while navigating away.
  const [starting, setStarting] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  // Next keeps hidden pages mounted (Activity), so clear these when the page is hidden,
  // or the button stays disabled when the player comes back for another round.
  useLayoutEffect(
    () => () => {
      setStarting(false);
      setRulesOpen(false);
    },
    [],
  );

  const hydrated = state !== null;
  const planeReady = Boolean(state?.nextPlane);
  const resumable = Boolean(state?.game && !state.game.finished);
  const failed = state?.planeLoadFailed ?? false;

  useEffect(() => {
    if (hydrated && !starting && !planeReady && !failed) store.loadNextPlane();
  }, [hydrated, starting, planeReady, failed, store]);

  const start = () => {
    setStarting(true);
    store.start();
    router.push("/game");
  };

  return (
    <main className="flex w-full flex-col items-center gap-8 px-4">
      <h1 className="font-tile text-5xl text-white sm:text-6xl">Scramble</h1>

      <div className="flex flex-col items-center gap-3">
        <div role="radiogroup" aria-label={t("boardSize")} className="flex gap-2">
          {BOARD_SIZES.map((option) => (
            <button
              key={option}
              role="radio"
              aria-checked={option === size}
              disabled={starting}
              onClick={() => boardSizePreference.set(option)}
              className={optionClass(option === size)}
            >
              <span>{t(`sizes.${option}`)}</span>
              <span className="text-sm opacity-75">
                {BOARD_DIMENSIONS[option]} × {BOARD_DIMENSIONS[option]}
              </span>
            </button>
          ))}
        </div>

        <div role="radiogroup" aria-label={t("gameMode")} className="flex gap-2">
          {GAME_MODES.map((option) => (
            <button
              key={option}
              role="radio"
              aria-checked={option === mode}
              disabled={starting}
              onClick={() => gameModePreference.set(option)}
              className={optionClass(option === mode)}
            >
              <span>{t(`modes.${option}.name`)}</span>
              <span className="text-sm opacity-75">{t(`modes.${option}.description`)}</span>
            </button>
          ))}
        </div>
      </div>

      {resumable && !starting ? (
        <Link href="/game" className={buttonClass("px-8 py-3 text-2xl sm:text-3xl")}>
          {t("continue")}
        </Link>
      ) : null}

      {failed ? (
        <div className="flex flex-col items-center gap-3 text-white" role="alert">
          <p>{t("loadFailed")}</p>
          <button className={buttonClass("px-6 py-2 text-xl")} onClick={store.loadNextPlane}>
            {t("retry")}
          </button>
        </div>
      ) : (
        <button
          className={buttonClass(
            resumable && !starting ? "px-6 py-2 text-xl" : "px-8 py-3 text-2xl sm:text-3xl",
          )}
          disabled={!planeReady || starting}
          onClick={start}
        >
          {planeReady || starting
            ? resumable && !starting
              ? t("newGame")
              : t("play")
            : t("loading")}
        </button>
      )}

      {/* Outlined rather than solid, so it reads as secondary next to the play button. */}
      <button
        className="rounded-2xl border-2 border-white/35 px-6 py-2 text-xl text-white/80 transition-colors hover:border-white/70 hover:bg-white/10 hover:text-white"
        onClick={() => setRulesOpen(true)}
      >
        {t("rulesButton")}
      </button>

      <nav aria-label={t("language")} className="flex gap-2">
        {LANGUAGES.map((language) => (
          <Link
            key={language}
            href="/"
            locale={language}
            aria-current={language === lang ? "true" : undefined}
            className="rounded-full px-4 py-1 text-white/80 transition-colors hover:text-white aria-[current]:bg-white/15 aria-[current]:text-white"
          >
            {LANGUAGE_NAMES[language]}
          </Link>
        ))}
      </nav>

      {rulesOpen ? <RulesDialog
          lang={lang}
          side={BOARD_DIMENSIONS[size]}
          onClose={() => setRulesOpen(false)}
        /> : null}
    </main>
  );
}
