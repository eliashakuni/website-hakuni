const DURATION_MS = 500;

interface Flight {
  word: string;
  correct: boolean;
  /** Where the word was before it was sent. */
  from: DOMRect;
  fontSize: string;
  /** The guess list, with the new guess already rendered as its first row. */
  list: HTMLElement;
}

/** Flies a sent word from the current-word bar to its row in the guess list. */
export function flyWord({ word, correct, from, fontSize, list }: Flight) {
  list.scrollTo({ top: 0 });
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const row = list.firstElementChild as HTMLElement | null;
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

  const scale = to.height / from.height;
  const endColor = `var(--color-${correct ? "correct" : "incorrect"})`;
  const flight = ghost.animate(
    [
      { transform: "none" },
      {
        transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${scale})`,
        color: endColor,
      },
    ],
    { duration: DURATION_MS, easing: "ease" },
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
}
