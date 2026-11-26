import { type BoardSize, DEFAULT_BOARD_SIZE, isBoardSize } from "../boardSizes";

// localStorage, not sessionStorage: the choice is remembered between visits.
const STORAGE_KEY = "scramble:boardSize";
const listeners = new Set<() => void>();
let current: BoardSize | null = null;

export function getBoardSize(): BoardSize {
  if (current) return current;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    current = isBoardSize(saved) ? saved : DEFAULT_BOARD_SIZE;
  } catch {
    current = DEFAULT_BOARD_SIZE;
  }
  return current;
}

export const getServerBoardSize = (): BoardSize => DEFAULT_BOARD_SIZE;

export function setBoardSize(size: BoardSize) {
  if (size === getBoardSize()) return;
  current = size;
  try {
    localStorage.setItem(STORAGE_KEY, size);
  } catch {
    // Still applies for this page load, it just won't be remembered.
  }
  listeners.forEach((listener) => listener());
}

export function subscribeBoardSize(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
