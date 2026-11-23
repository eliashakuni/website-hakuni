import { isAdjacent, type Position, samePosition } from "@/lib/game/rules";

// Board geometry in SVG units: four tiles and three gaps fill 400 units.
const TILE = 90;
const GAP = 40 / 3;
const STEP = TILE + GAP;
const BORDER = 5;

interface Point {
  x: number;
  y: number;
}

const center = ({ row, col }: Position): Point => ({
  x: col * STEP + TILE / 2,
  y: row * STEP + TILE / 2,
});

/** Arrowhead with its tip at `tip`, pointing away from `from`. */
function arrowhead(from: Point, tip: Point): string {
  const length = Math.hypot(tip.x - from.x, tip.y - from.y) || 1;
  const dx = (tip.x - from.x) / length;
  const dy = (tip.y - from.y) / length;
  const baseX = tip.x - dx * 30;
  const baseY = tip.y - dy * 30;
  return [
    `${tip.x},${tip.y}`,
    `${baseX - dy * 17},${baseY + dx * 17}`,
    `${baseX + dy * 17},${baseY - dx * 17}`,
  ].join(" ");
}

interface ExampleBoardProps {
  /** One string of four letters per row. */
  rows: readonly string[];
  /** Tiles in the order they are picked. */
  path?: readonly Position[];
  /** How many steps of `path` are allowed; the steps after them are drawn as forbidden. */
  allowedSteps?: number;
  /** Marks the tiles that can be picked after this one, and fades the rest. */
  neighboursOf?: Position;
  className?: string;
}

/**
 * A small drawn board for the rules: the game's tile colours, with the picked path drawn
 * over it. Allowed steps are solid lines, forbidden steps dashed and crossed out.
 * Decorative: the caption next to it says the same thing in words.
 */
export function ExampleBoard({
  rows,
  path = [],
  allowedSteps = path.length - 1,
  neighboursOf,
  className = "",
}: ExampleBoardProps) {
  const allowed = path.slice(0, allowedSteps + 1).map(center);
  const forbidden = path.slice(allowedSteps).map(center);
  // Forbidden steps bow out to the side, so a step back over an allowed one stays visible.
  // Short steps bow out further, or the curve would hide behind the two tiles.
  const curves = forbidden.slice(1).map((end, i) => {
    const start = forbidden[i];
    const length = Math.hypot(end.x - start.x, end.y - start.y) || 1;
    const bow = Math.max(length * 0.35, 1.3 * STEP) / length;
    const control = {
      x: (start.x + end.x) / 2 + (end.y - start.y) * bow,
      y: (start.y + end.y) / 2 - (end.x - start.x) * bow,
    };
    // A quadratic curve's midpoint lies halfway between the chord's midpoint and the control.
    const middle = {
      x: (start.x + end.x) / 4 + control.x / 2,
      y: (start.y + end.y) / 4 + control.y / 2,
    };
    return { start, end, control, middle };
  });

  const tiles = rows.flatMap((letters, row) =>
    [...letters].map((letter, col) => {
      const position = { row, col };
      const picked =
        path.some((step) => samePosition(step, position)) ||
        (neighboursOf !== undefined && samePosition(neighboursOf, position));
      const pickable =
        neighboursOf !== undefined && !picked && isAdjacent(neighboursOf, position);
      const faded = neighboursOf !== undefined && !picked && !pickable;
      return { position, letter, picked, pickable, faded };
    }),
  );

  return (
    <svg
      viewBox={`${-BORDER} ${-BORDER} ${400 + 2 * BORDER} ${400 + 2 * BORDER}`}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {tiles.map(({ position, picked, pickable, faded }) => (
        <rect
          key={`tile-${position.row}-${position.col}`}
          x={position.col * STEP}
          y={position.row * STEP}
          width={TILE}
          height={TILE}
          rx={18}
          opacity={faded ? 0.35 : 1}
          fill={picked ? "var(--color-tile-path)" : "var(--color-tile)"}
          stroke={pickable ? "var(--color-correct)" : "var(--color-tile-edge)"}
          strokeWidth={pickable ? 9 : BORDER}
        />
      ))}

      <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={11} opacity={0.8}>
        {allowed.length > 1 ? (
          <>
            <circle cx={allowed[0].x} cy={allowed[0].y} r={13} fill="var(--color-correct)" />
            <polyline
              points={allowed.map(({ x, y }) => `${x},${y}`).join(" ")}
              stroke="var(--color-correct)"
            />
            {curves.length === 0 ? (
              <polygon
                points={arrowhead(allowed.at(-2)!, allowed.at(-1)!)}
                fill="var(--color-correct)"
                stroke="var(--color-correct)"
                strokeWidth={4}
              />
            ) : null}
          </>
        ) : null}

        {curves.map(({ start, end, control }, i) => (
          <g key={`forbidden-${i}`} stroke="var(--color-incorrect)">
            <path
              d={`M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`}
              strokeDasharray="16 14"
            />
            <polygon
              points={arrowhead(control, end)}
              fill="var(--color-incorrect)"
              strokeWidth={4}
            />
          </g>
        ))}
      </g>

      {tiles.map(({ position, letter, faded }) => {
        const { x, y } = center(position);
        return (
          <text
            key={`letter-${position.row}-${position.col}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={52}
            fill="var(--color-ink)"
            opacity={faded ? 0.35 : 1}
            style={{ fontFamily: "var(--font-tile)" }}
          >
            {letter.toUpperCase()}
          </text>
        );
      })}

      {/* Crosses go on top of the letters so they are never hidden. */}
      {curves.map(({ middle }, i) => (
        <g key={`cross-${i}`} strokeLinecap="round">
          <circle
            cx={middle.x}
            cy={middle.y}
            r={24}
            fill="var(--color-dialog)"
            stroke="var(--color-incorrect)"
            strokeWidth={5}
          />
          <path
            d={`M ${middle.x - 10} ${middle.y - 10} L ${middle.x + 10} ${middle.y + 10} M ${middle.x + 10} ${middle.y - 10} L ${middle.x - 10} ${middle.y + 10}`}
            stroke="var(--color-incorrect)"
            strokeWidth={6}
          />
        </g>
      ))}
    </svg>
  );
}
