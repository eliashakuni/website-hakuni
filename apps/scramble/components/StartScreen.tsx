"use client";

import { useTranslations } from "next-intl";
import { useEffect, useLayoutEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { BOARD_DIMENSIONS } from "@/lib/boardSizes";
import { GAME_DURATION_MINUTES } from "@/lib/gameDurations";
import { useGame } from "@/lib/game/useGame";
import { LANGUAGES } from "@/lib/languages";
import { buttonClass } from "./buttonClass";
import { RulesDialog } from "./RulesDialog";
import { SettingsDialog } from "./SettingsDialog";

const LANGUAGE_NAMES = { fi: "Suomi", sv: "Svenska", en: "English" } as const;

export function StartScreen() {
  const t = useTranslations("start");
  const router = useRouter();
  const { lang, size, mode, duration, state, store } = useGame();
  // Keeps the screen stable, and stops a spare plane being fetched, while navigating away.
  const [starting, setStarting] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Next keeps hidden pages mounted (Activity), so clear these when the page is hidden,
  // or the button stays disabled when the player comes back for another round.
  useLayoutEffect(
    () => () => {
      setStarting(false);
      setRulesOpen(false);
      setSettingsOpen(false);
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

  const side = BOARD_DIMENSIONS[size];
  const summary = [
    `${side} × ${side}`,
    t(`modes.${mode}.name`),
    t("durationMinutes", { minutes: GAME_DURATION_MINUTES[duration] }),
  ].join(" · ");

  const start = () => {
    setStarting(true);
    store.start(duration);
    router.push("/game");
  };

  return (
    <main className="flex w-full flex-col items-center gap-8 px-4">
      <h1 className="font-tile text-5xl text-white sm:text-6xl">Scramble</h1>

      <button
        disabled={starting}
        onClick={() => setSettingsOpen(true)}
        aria-label={`${t("changeSettings")}: ${summary}`}
        title={t("changeSettings")}
        className="flex items-center gap-3 rounded-full px-5 py-2 text-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        <span>{summary}</span>
        {/* A cog, the usual sign for settings. */}
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-current">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.48.48 0 0 0-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87a.47.47 0 0 0 .12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.47.47 0 0 0-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z" />
        </svg>
      </button>

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

      {rulesOpen ? (
        <RulesDialog
          lang={lang}
          side={side}
          minutes={GAME_DURATION_MINUTES[duration]}
          onClose={() => setRulesOpen(false)}
        />
      ) : null}

      {settingsOpen ? (
        <SettingsDialog
          size={size}
          mode={mode}
          duration={duration}
          onClose={() => setSettingsOpen(false)}
        />
      ) : null}
    </main>
  );
}
