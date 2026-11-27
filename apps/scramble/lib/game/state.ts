import type { Plane } from "../generatePlane";
import { GAME_DURATION_MS, type Guess } from "./rules";

export interface Game {
  plane: string[][];
  wordList: string[];
  /** Word -> dictionary slug, for the words that need one. */
  slugs?: Record<string, string>;
  maxPoints: number;
  /** Long-word mode: the long word hidden on the board. */
  longWord?: string;
  guesses: Guess[];
  /** Epoch ms. An absolute time, so a reload can't pause or reset the clock. */
  deadline: number;
  finished: boolean;
}

export interface GameState {
  game: Game | null;
  /** Fetched ahead of time so starting a game is instant. */
  nextPlane: Plane | null;
  planeLoadFailed: boolean;
}

export const EMPTY_STATE: GameState = {
  game: null,
  nextPlane: null,
  planeLoadFailed: false,
};

export function startGame(state: GameState, now: number): GameState {
  if (!state.nextPlane) return state;
  const { plane, wordList, slugs, points, longWord } = state.nextPlane;
  return {
    ...state,
    nextPlane: null,
    game: {
      plane,
      wordList,
      slugs,
      maxPoints: points,
      longWord,
      guesses: [],
      deadline: now + GAME_DURATION_MS,
      finished: false,
    },
  };
}

export function addGuess(state: GameState, word: string): GameState {
  const { game } = state;
  if (!game || game.finished || game.guesses.some((guess) => guess.word === word)) {
    return state;
  }
  const guess: Guess = { word, correct: game.wordList.includes(word) };
  return { ...state, game: { ...game, guesses: [guess, ...game.guesses] } };
}

export function finishGame(state: GameState): GameState {
  if (!state.game || state.game.finished) return state;
  return { ...state, game: { ...state.game, finished: true } };
}

export function abandonGame(state: GameState): GameState {
  return { ...state, game: null };
}

/** Ends a game whose time ran out while the page was closed. */
export function expireGame(state: GameState, now: number): GameState {
  return state.game && now >= state.game.deadline ? finishGame(state) : state;
}
