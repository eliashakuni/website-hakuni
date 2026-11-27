import type { Position } from "./game/rules";

const NEIGHBOURS = [
  [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1],
];

// Search steps one attempt may take before it gives up and restarts from a new tile.
const STEPS_PER_ATTEMPT = 2000;
const MAX_ATTEMPTS = 40;

/**
 * A random path of `length` distinct tiles on a `side` × `side` board, each tile adjacent
 * (8 directions) to the previous one: a self-avoiding king's walk.
 *
 * Randomised backtracking search with two aids that keep it fast even when the path has to
 * cover the whole board:
 * - Pruning: a branch is dropped as soon as the free tiles reachable from the path's end
 *   are fewer than the letters still to place.
 * - Ordering: candidates with fewer free neighbours go first (Warnsdorff's rule), blurred
 *   by random noise so paths wander instead of hugging the edges. The noise is large when
 *   the board has room to spare and shrinks on each restart, so a hard case turns into
 *   plain Warnsdorff, which almost always finds a full-board path on the first try.
 *
 * If every attempt runs out of steps, it falls back to a randomly flipped and rotated
 * snake, which always exists, so it never fails.
 */
export function randomPath(side: number, length: number): Position[] {
  const cells = side * side;
  if (length < 1 || length > cells) {
    throw new RangeError(`A path of ${length} tiles doesn't fit on a ${side} × ${side} board`);
  }

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const slack = cells - length;
    // Lots of noise while there's room to spare; less on every restart.
    const noise = Math.max(0, (slack > 0 ? 4 : 1.5) * (1 - attempt / (MAX_ATTEMPTS / 2)));
    const path = searchPath(side, length, noise);
    if (path) return path;
  }
  return snakePath(side, length);
}

function searchPath(side: number, length: number, noise: number): Position[] | null {
  const visited = Array.from({ length: side }, () => new Array<boolean>(side).fill(false));
  const path: Position[] = [];
  let steps = 0;

  const inside = (row: number, col: number) =>
    row >= 0 && col >= 0 && row < side && col < side;

  const freeNeighbours = (row: number, col: number): Position[] => {
    const result: Position[] = [];
    for (const [dr, dc] of NEIGHBOURS) {
      const r = row + dr;
      const c = col + dc;
      if (inside(r, c) && !visited[r][c]) result.push({ row: r, col: c });
    }
    return result;
  };

  // Free tiles connected to (row, col), counting up to `needed` and stopping there.
  const reachable = (row: number, col: number, needed: number): number => {
    const seen = Array.from({ length: side }, () => new Array<boolean>(side).fill(false));
    const stack = freeNeighbours(row, col);
    for (const { row: r, col: c } of stack) seen[r][c] = true;
    let count = 0;
    while (stack.length > 0 && count < needed) {
      const { row: r, col: c } = stack.pop()!;
      count++;
      for (const next of freeNeighbours(r, c)) {
        if (seen[next.row][next.col]) continue;
        seen[next.row][next.col] = true;
        stack.push(next);
      }
    }
    return count;
  };

  const extend = (position: Position): boolean => {
    if (++steps > STEPS_PER_ATTEMPT) return false;
    visited[position.row][position.col] = true;
    path.push(position);
    if (path.length === length) return true;

    const remaining = length - path.length;
    if (reachable(position.row, position.col, remaining) >= remaining) {
      const candidates = freeNeighbours(position.row, position.col)
        .map((next) => ({
          next,
          key: freeNeighbours(next.row, next.col).length + Math.random() * noise,
        }))
        .sort((a, b) => a.key - b.key);
      for (const { next } of candidates) {
        if (extend(next)) return true;
        if (steps > STEPS_PER_ATTEMPT) break;
      }
    }

    visited[position.row][position.col] = false;
    path.pop();
    return false;
  };

  const start = {
    row: Math.floor(Math.random() * side),
    col: Math.floor(Math.random() * side),
  };
  return extend(start) ? path : null;
}

/** Row by row, turning at each edge, then flipped and rotated at random. */
function snakePath(side: number, length: number): Position[] {
  const flipRows = Math.random() < 0.5;
  const flipCols = Math.random() < 0.5;
  const transpose = Math.random() < 0.5;
  const path: Position[] = [];

  for (let i = 0; i < length; i++) {
    const r = Math.floor(i / side);
    const c = r % 2 === 0 ? i % side : side - 1 - (i % side);
    let row = flipRows ? side - 1 - r : r;
    let col = flipCols ? side - 1 - c : c;
    if (transpose) [row, col] = [col, row];
    path.push({ row, col });
  }
  return path;
}
