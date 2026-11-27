/**
 * `standard`: every tile is a weighted random letter.
 * `longWord`: one very long word is hidden on the board and the rest is filled as usual.
 */
export const GAME_MODES = ["standard", "longWord"] as const;
export type GameMode = (typeof GAME_MODES)[number];

export const DEFAULT_GAME_MODE: GameMode = "standard";

export function isGameMode(value: unknown): value is GameMode {
  return GAME_MODES.includes(value as GameMode);
}
