export const BOARD_SIZES = ["standard", "large", "huge"] as const;
export type BoardSize = (typeof BOARD_SIZES)[number];

export const DEFAULT_BOARD_SIZE: BoardSize = "standard";

/** Tiles per side. Keep in sync with BOARD_SIZES in lib/data/fix-word-files.mjs. */
export const BOARD_DIMENSIONS: Record<BoardSize, number> = {
  standard: 4,
  large: 5,
  huge: 6,
};

export function isBoardSize(value: unknown): value is BoardSize {
  return BOARD_SIZES.includes(value as BoardSize);
}
