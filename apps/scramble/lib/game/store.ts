import type { Plane } from "../generatePlane";
import type { Language } from "../languages";
import {
  abandonGame,
  addGuess,
  EMPTY_STATE,
  expireGame,
  finishGame,
  type GameState,
  startGame,
} from "./state";

/** One store per language, so each language keeps its own game in sessionStorage. */
export class GameStore {
  private state: GameState | null = null;
  private listeners = new Set<() => void>();
  private planeRequest: Promise<void> | null = null;

  constructor(private readonly lang: Language) {}

  private get storageKey() {
    return `scramble:${this.lang}:v1`;
  }

  private load(): GameState {
    try {
      const saved = sessionStorage.getItem(this.storageKey);
      if (saved) return expireGame({ ...EMPTY_STATE, ...JSON.parse(saved) }, Date.now());
    } catch {
      // Storage blocked or data corrupt: start fresh.
    }
    return EMPTY_STATE;
  }

  private set(next: GameState) {
    if (next === this.state) return;
    this.state = next;
    try {
      const { game, nextPlane } = next;
      sessionStorage.setItem(this.storageKey, JSON.stringify({ game, nextPlane }));
    } catch {
      // The game still works for this page load, it just won't survive a refresh.
    }
    this.listeners.forEach((listener) => listener());
  }

  getState = (): GameState => (this.state ??= this.load());

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  start = () => this.set(startGame(this.getState(), Date.now()));
  guess = (word: string) => this.set(addGuess(this.getState(), word));
  finish = () => this.set(finishGame(this.getState()));
  abandon = () => this.set(abandonGame(this.getState()));

  /** Fetches the next plane unless one is already stored or on its way. */
  loadNextPlane = () => {
    if (this.getState().nextPlane || this.planeRequest) return;
    this.set({ ...this.getState(), planeLoadFailed: false });

    this.planeRequest = fetch(`/api/plane?lang=${this.lang}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Plane request failed: ${response.status}`);
        return response.json() as Promise<Plane>;
      })
      .then((nextPlane) => this.set({ ...this.getState(), nextPlane }))
      .catch((error) => {
        console.error(error);
        this.set({ ...this.getState(), planeLoadFailed: true });
      })
      .finally(() => {
        this.planeRequest = null;
      });
  };
}

const stores = new Map<Language, GameStore>();

export function getGameStore(lang: Language): GameStore {
  let store = stores.get(lang);
  if (!store) {
    store = new GameStore(lang);
    stores.set(lang, store);
  }
  return store;
}
