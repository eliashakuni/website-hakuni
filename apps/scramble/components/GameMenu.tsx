"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { buttonClass } from "./buttonClass";

const MENU_BUTTON = buttonClass("w-44 px-3 py-2 text-lg");

interface GameMenuProps {
  /** A running game asks for confirmation before anything ends it. */
  gameRunning: boolean;
  onClose: () => void;
  onNewGame: () => void;
  onShowResults: () => void;
}

export function GameMenu({ gameRunning, onClose, onNewGame, onShowResults }: GameMenuProps) {
  const t = useTranslations("menu");
  const [confirming, setConfirming] = useState<"results" | "newGame" | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // A click on the dialog element itself can only be on its backdrop.
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-3xl border-4 border-dialog-edge bg-dialog p-0 text-ink shadow-xl"
    >
      <div className="flex flex-col items-center gap-3 p-5 text-center">
        {confirming === null ? (
          <>
            <button
              className={MENU_BUTTON}
              onClick={() => (gameRunning ? setConfirming("newGame") : onNewGame())}
            >
              {t("newGame")}
            </button>
            {gameRunning ? (
              <button className={MENU_BUTTON} onClick={() => setConfirming("results")}>
                {t("results")}
              </button>
            ) : null}
            <button className={MENU_BUTTON} onClick={onClose}>
              {t("cancel")}
            </button>
          </>
        ) : (
          <>
            <p>{t(confirming === "results" ? "confirmResults" : "confirmNewGame")}</p>
            <button
              className={MENU_BUTTON}
              onClick={confirming === "results" ? onShowResults : onNewGame}
            >
              {t(confirming === "results" ? "results" : "newGame")}
            </button>
            <button className={MENU_BUTTON} onClick={() => setConfirming(null)}>
              {t("cancel")}
            </button>
          </>
        )}
      </div>
    </dialog>
  );
}
