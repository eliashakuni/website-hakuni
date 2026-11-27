"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useRef } from "react";
import { GAME_DURATION_MINUTES, GAME_DURATIONS } from "@/lib/gameDurations";
import { guessPoints, MIN_WORD_LENGTH, type Position } from "@/lib/game/rules";
import type { Language } from "@/lib/languages";
import { buttonClass } from "./buttonClass";
import { ExampleBoard } from "./ExampleBoard";

interface Example {
  rows: readonly string[];
  /** The tile whose neighbours are shown. */
  current: Position;
  /** A word that can be built, with a diagonal step in it. */
  valid: readonly Position[];
  /** A real word whose last step jumps between tiles that don't touch. */
  jump: readonly Position[];
  /** A real word that needs the same tile twice. */
  reuse: readonly Position[];
}

// Every example word is in that language's word list, and each board has only one tile
// for the letter that the reuse example repeats, so the captions stay true.
const EXAMPLES: Record<Language, Example> = {
  sv: {
    rows: ["husa", "nder", "kolt", "bimå"],
    current: { row: 1, col: 1 },
    // HUND
    valid: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ],
    // DUK: K is two rows away from U.
    jump: [
      { row: 1, col: 1 },
      { row: 0, col: 1 },
      { row: 2, col: 0 },
    ],
    // KOK: back to the only K.
    reuse: [
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 0 },
    ],
  },
  fi: {
    rows: ["tasu", "lomk", "ienp", "ruvä"],
    current: { row: 1, col: 1 },
    // TALO
    valid: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ],
    // SUO: O is two columns away from U.
    jump: [
      { row: 0, col: 2 },
      { row: 0, col: 3 },
      { row: 1, col: 1 },
    ],
    // OLO: back to the only O.
    reuse: [
      { row: 1, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ],
  },
  en: {
    rows: ["caps", "rtol", "nuie", "bdmg"],
    current: { row: 1, col: 1 },
    // CART
    valid: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ],
    // TAN: N is two rows away from A.
    jump: [
      { row: 1, col: 1 },
      { row: 0, col: 1 },
      { row: 2, col: 0 },
    ],
    // NUN: back to the only N.
    reuse: [
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 0 },
    ],
  },
};

const SCORE_LENGTHS = [3, 4, 5, 6, 7, 8];
const WRONG_EXAMPLE_LENGTH = 4;

const Word = (chunks: ReactNode) => <span className="font-tile uppercase">{chunks}</span>;
const Bold = (chunks: ReactNode) => <strong className="font-extrabold">{chunks}</strong>;
const Key = (chunks: ReactNode) => (
  <kbd className="rounded-md border-2 border-dialog-edge px-1.5 font-sans text-sm">{chunks}</kbd>
);

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-tile text-2xl">{title}</h3>
      {children}
    </section>
  );
}

function Figure({ board, children }: { board: ReactNode; children: ReactNode }) {
  return (
    <figure className="flex items-center gap-4 rounded-2xl bg-dialog-edge/10 p-3">
      <div className="w-32 shrink-0 sm:w-40">{board}</div>
      <figcaption>{children}</figcaption>
    </figure>
  );
}

interface RulesDialogProps {
  lang: Language;
  /** Tiles per side of the board the player has chosen. */
  side: number;
  /** Length of the game the player has chosen. */
  minutes: number;
  onClose: () => void;
}

export function RulesDialog({ lang, side, minutes, onClose }: RulesDialogProps) {
  const t = useTranslations("rules");
  const tGrades = useTranslations("grades");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const example = EXAMPLES[lang];
  const tags = { w: Word, b: Bold, key: Key };

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="rules-title"
      // A click on the dialog element itself can only be on its backdrop.
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(38rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border-4 border-dialog-edge bg-dialog p-0 text-ink shadow-xl"
    >
      <div className="flex max-h-[calc(100dvh-2rem-8px)] flex-col">
        <header className="flex items-center justify-between gap-4 border-b-4 border-dialog-edge/30 px-5 py-3">
          <h2 id="rules-title" className="font-tile text-3xl">
            {t("title")}
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

        <div className="flex flex-col gap-7 overflow-y-auto px-5 py-5 leading-relaxed">
          <p>{t("intro", { side, minutes })}</p>

          <Section title={t("build.title")}>
            <p>{t("build.neighbours")}</p>
            <Figure
              board={<ExampleBoard rows={example.rows} neighboursOf={example.current} />}
            >
              {t.rich("build.neighboursCaption", tags)}
            </Figure>
            <Figure board={<ExampleBoard rows={example.rows} path={example.valid} />}>
              {t.rich("build.validCaption", tags)}
            </Figure>

            <p>{t("build.noJumps")}</p>
            <Figure
              board={<ExampleBoard rows={example.rows} path={example.jump} allowedSteps={1} />}
            >
              {t.rich("build.jumpCaption", tags)}
            </Figure>

            <p>{t("build.once")}</p>
            <Figure
              board={<ExampleBoard rows={example.rows} path={example.reuse} allowedSteps={1} />}
            >
              {t.rich("build.reuseCaption", tags)}
            </Figure>

            <p>{t("build.length", { minLength: MIN_WORD_LENGTH })}</p>
            <p>{t.rich("build.baseForm", tags)}</p>
          </Section>

          <Section title={t("controls.title")}>
            <ul className="flex list-disc flex-col gap-2 pl-5">
              <li>{t("controls.undo")}</li>
              <li>{t.rich("controls.clear", tags)}</li>
              <li>{t.rich("controls.send", { ...tags, minLength: MIN_WORD_LENGTH })}</li>
              <li>{t("controls.blocked")}</li>
            </ul>
          </Section>

          <Section title={t("scoring.title")}>
            <p>{t("scoring.correct")}</p>
            <table className="w-full max-w-xs text-left">
              <thead>
                <tr className="border-b-2 border-dialog-edge/40">
                  <th className="py-1 font-extrabold">{t("scoring.letters")}</th>
                  <th className="py-1 text-right font-extrabold">{t("scoring.points")}</th>
                </tr>
              </thead>
              <tbody>
                {SCORE_LENGTHS.map((length) => (
                  <tr key={length} className="border-b border-dialog-edge/20">
                    <td className="py-0.5">{length}</td>
                    <td className="py-0.5 text-right text-correct">
                      {guessPoints({ word: "x".repeat(length), correct: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>
              {t("scoring.wrong", {
                length: WRONG_EXAMPLE_LENGTH,
                points: guessPoints({ word: "x".repeat(WRONG_EXAMPLE_LENGTH), correct: false }),
              })}
            </p>
            <p>{t("scoring.repeat")}</p>
          </Section>

          <Section title={t("longWord.title")}>
            <p>{t("longWord.text")}</p>
          </Section>

          <Section title={t("time.title")}>
            <p>{t("time.end", { minutes })}</p>
            <p>
              {t("time.choose", {
                options: GAME_DURATIONS.map((option) => GAME_DURATION_MINUTES[option]).join(", "),
              })}
            </p>
            <p>{t("time.grade", { lowest: tGrades("0"), highest: tGrades("9") })}</p>
          </Section>

          <button className={buttonClass("self-center px-8 py-2 text-xl")} onClick={onClose}>
            {t("close")}
          </button>
        </div>
      </div>
    </dialog>
  );
}
