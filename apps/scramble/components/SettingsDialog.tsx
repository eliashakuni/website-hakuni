"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useId, useRef } from "react";
import { BOARD_DIMENSIONS, BOARD_SIZES, type BoardSize } from "@/lib/boardSizes";
import { GAME_DURATION_MINUTES, GAME_DURATIONS, type GameDuration } from "@/lib/gameDurations";
import { GAME_MODES, type GameMode } from "@/lib/gameModes";
import {
  boardSizePreference,
  gameDurationPreference,
  gameModePreference,
  type Preference,
} from "@/lib/game/preferences";
import { buttonClass } from "./buttonClass";

interface SettingsDialogProps {
  size: BoardSize;
  mode: GameMode;
  duration: GameDuration;
  onClose: () => void;
}

/** Board size, game mode and game length. Each choice is saved as soon as it's clicked. */
export function SettingsDialog({ size, mode, duration, onClose }: SettingsDialogProps) {
  const t = useTranslations("start");
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="settings-title"
      // A click on the dialog element itself can only be on its backdrop.
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(36rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border-4 border-dialog-edge bg-dialog p-0 text-ink shadow-xl"
    >
      <div className="flex max-h-[calc(100dvh-2rem-8px)] flex-col">
        <header className="flex items-center justify-between gap-4 border-b-4 border-dialog-edge/30 px-5 py-3">
          <h2 id="settings-title" className="font-tile text-3xl">
            {t("settings")}
          </h2>
          <button
            aria-label={t("close")}
            title={t("close")}
            className="flex size-11 items-center justify-center text-4xl leading-none text-ink-soft transition-colors hover:text-ink"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="flex flex-col gap-6 overflow-y-auto px-5 py-5">
          <OptionRow
            label={t("boardSize")}
            options={BOARD_SIZES}
            value={size}
            preference={boardSizePreference}
            columns="grid-cols-3"
            render={(option) => (
              <>
                <span>{t(`sizes.${option}`)}</span>
                <span className="text-sm opacity-75">
                  {BOARD_DIMENSIONS[option]} × {BOARD_DIMENSIONS[option]}
                </span>
              </>
            )}
          />
          <OptionRow
            label={t("gameMode")}
            options={GAME_MODES}
            value={mode}
            preference={gameModePreference}
            columns="grid-cols-2"
            render={(option) => (
              <>
                <span>{t(`modes.${option}.name`)}</span>
                <span className="text-sm opacity-75">{t(`modes.${option}.description`)}</span>
              </>
            )}
          />
          <OptionRow
            label={t("gameDuration")}
            options={GAME_DURATIONS}
            value={duration}
            preference={gameDurationPreference}
            columns="grid-cols-2 sm:grid-cols-4"
            render={(option) => (
              <>
                <span>{t(`durations.${option}`)}</span>
                <span className="text-sm opacity-75">
                  {t("durationMinutes", { minutes: GAME_DURATION_MINUTES[option] })}
                </span>
              </>
            )}
          />

          <button className={buttonClass("self-center px-8 py-2 text-xl")} onClick={onClose}>
            {t("done")}
          </button>
        </div>
      </div>
    </dialog>
  );
}

interface OptionRowProps<T extends string> {
  label: string;
  options: readonly T[];
  value: T;
  preference: Preference<T>;
  /** Grid columns, as literal Tailwind classes so they get generated. */
  columns: string;
  render: (option: T) => ReactNode;
}

function OptionRow<T extends string>({
  label,
  options,
  value,
  preference,
  columns,
  render,
}: OptionRowProps<T>) {
  const labelId = useId();
  return (
    <div className="flex flex-col gap-2">
      <span id={labelId} className="font-extrabold">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className={`grid gap-2 ${columns}`}
      >
        {options.map((option) => (
          <button
            key={option}
            role="radio"
            aria-checked={option === value}
            onClick={() => preference.set(option)}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dialog-edge/40 px-1 py-1.5 text-center leading-tight hyphens-auto [overflow-wrap:anywhere] sm:px-2 transition-colors hover:border-dialog-edge aria-checked:border-dialog-edge aria-checked:bg-dialog-edge aria-checked:text-white"
          >
            {render(option)}
          </button>
        ))}
      </div>
    </div>
  );
}
