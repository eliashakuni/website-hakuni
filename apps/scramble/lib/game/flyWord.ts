const DURATION_MS = 500;

interface Flight {
  word: string;
  correct: boolean;
  /** Where the word was before it was sent. */
  from: DOMRect;
  fontSize: string;
  /** The guess list, with the new guess already rendered. */
  list: HTMLElement;
  /**
   * Where the guess was rendered: normally the list's first row, but the long word in
   * long-word mode is pinned above the list instead.
   */
  row: HTMLElement | null;
}

/** Flies a sent word from the current-word bar to its row in the guess list. */
export function flyWord({ word, correct, from, fontSize, list, row }: Flight) {
  list.scrollTo({ top: 0 });
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const target = row?.querySelector("[data-word]");
  if (!row || !target) return;
  const to = target.getBoundingClientRect();

  const ghost = document.createElement("span");
  ghost.textContent = word;
  ghost.className = "word-flight";
  ghost.style.left = `${from.left}px`;
  ghost.style.top = `${from.top}px`;
  ghost.style.fontSize = fontSize;
  document.body.append(ghost);

  // From font sizes, not heights: the target may wrap onto several lines.
  const scale = parseFloat(getComputedStyle(target).fontSize) / parseFloat(fontSize);
  const translate = `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${scale})`;
  const timing = { duration: DURATION_MS, easing: "ease" };

  if (row === list.firstElementChild) {
    const endColor = `var(--color-${correct ? "correct" : "incorrect"})`;
    const flight = ghost.animate(
      [{ transform: "none" }, { transform: translate, color: endColor }],
      timing,
    );

    // The list makes room for the new row while its word is in the air.
    row.style.visibility = "hidden";
    list.animate(
      [{ transform: `translateY(-${row.offsetHeight}px)` }, { transform: "none" }],
      { duration: DURATION_MS, easing: "ease-in-out" },
    );

    flight.finished.catch(() => {}).finally(() => {
      ghost.remove();
      row.style.visibility = "";
    });
    return;
  }

  // A pinned row (the long word): its box is already in place, the word flies into it
  // and cross-fades into the wrapped text, and then the box lights up.
  const lightUp = row.getAnimations();
  lightUp.forEach((animation) => animation.cancel());

  const flight = ghost.animate(
    [
      { transform: "none" },
      { opacity: 1, offset: 0.7 },
      { transform: translate, color: getComputedStyle(row).color, opacity: 0 },
    ],
    timing,
  );
  target.animate([{ opacity: 0 }, { opacity: 0, offset: 0.7 }, { opacity: 1 }], timing);

  flight.finished.catch(() => {}).finally(() => {
    ghost.remove();
    lightUp.forEach((animation) => animation.play());
  });
}
