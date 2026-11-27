/** How long a game lasts. Only the client clock depends on it, not the board. */
export const GAME_DURATIONS = ["quick", "standard", "long", "veryLong"] as const;
export type GameDuration = (typeof GAME_DURATIONS)[number];

export const DEFAULT_GAME_DURATION: GameDuration = "standard";

export const GAME_DURATION_MINUTES: Record<GameDuration, number> = {
  quick: 2,
  standard: 3,
  long: 5,
  veryLong: 8,
};

export function gameDurationMs(duration: GameDuration): number {
  return GAME_DURATION_MINUTES[duration] * 60_000;
}

export function isGameDuration(value: unknown): value is GameDuration {
  return GAME_DURATIONS.includes(value as GameDuration);
}
