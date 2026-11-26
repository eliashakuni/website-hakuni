"use client";

import type { CSSProperties } from "react";
import { isAdjacent, type Position, samePosition } from "@/lib/game/rules";

const TILE_STATES = {
  available: "bg-tile hover:bg-tile-hover",
  path: "bg-tile-path",
  current: "bg-tile-path scale-110",
  blocked: "bg-tile cursor-not-allowed active:bg-tile-blocked",
} as const;

function tileState(position: Position, path: readonly Position[]): keyof typeof TILE_STATES {
  const last = path.at(-1);
  if (!last) return "available";
  if (samePosition(last, position)) return "current";
  if (path.some((step) => samePosition(step, position))) return "path";
  return isAdjacent(last, position) ? "available" : "blocked";
}

interface BoardProps {
  plane: string[][];
  label: string;
  path?: readonly Position[];
  /** Leave out to show the board read-only. */
  onTileClick?: (position: Position) => void;
}

export function Board({ plane, label, path = [], onTileClick }: BoardProps) {
  return (
    <div
      className="board area-board"
      role="group"
      aria-label={label}
      style={{ "--side": plane.length } as CSSProperties}
    >
      {plane.flatMap((letters, row) =>
        letters.map((letter, col) => {
          const position = { row, col };
          const key = `${row}-${col}`;
          if (!onTileClick) {
            return (
              <div
                key={key}
                className="tile flex items-center justify-center border-tile-edge bg-tile"
              >
                {letter}
              </div>
            );
          }
          const state = tileState(position, path);
          return (
            <button
              key={key}
              className={`tile border-tile-edge ${TILE_STATES[state]}`}
              aria-pressed={state === "path" || state === "current"}
              onClick={() => onTileClick(position)}
            >
              {letter}
            </button>
          );
        }),
      )}
    </div>
  );
}
