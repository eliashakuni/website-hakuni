"use client";

import { useTranslations } from "next-intl";
import { useEffect, useLayoutEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useGame } from "@/lib/game/useGame";
import { LANGUAGES } from "@/lib/languages";
import { buttonClass } from "./buttonClass";
import { RulesDialog } from "./RulesDialog";

const LANGUAGE_NAMES = { fi: "Suomi", sv: "Svenska" } as const;

export function StartScreen() {
  const t = useTranslations("start");
  const router = useRouter();
  const { lang, state, store } = useGame();
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

      {rulesOpen ? <RulesDialog lang={lang} onClose={() => setRulesOpen(false)} /> : null}
    </main>
  );
}
