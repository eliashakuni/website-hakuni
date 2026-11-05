export function buttonClass(extra = "") {
  return `rounded-2xl border-4 border-tile-edge bg-tile text-center text-ink transition-colors hover:bg-tile-hover disabled:bg-tile-path disabled:text-ink-soft ${extra}`;
}
