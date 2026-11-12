"use client";

import { Marker, SERIES } from "@/figures/kit";
import { round2 } from "./draw";
import { LAST_POSITION, SIGNIFICANT_BITS, blocksBetween, clamp, stored } from "./model";

/** Narrowest column a position gets, in px: four digits at 13 px fit with room on both sides. */
const MIN_COLUMN = 38;
const MIN_COLUMNS = 7;
const MAX_COLUMNS = 17;

const ROW = 30;
const TOP_LABEL = 16;
const ROW1 = 40;
const ROW2 = ROW1 + ROW + 54;
const MARKS = ROW2 + ROW + 17;
const BOTTOM_LABEL = MARKS + 22;
export const LENS_HEIGHT = BOTTOM_LABEL + 10;

/** How many positions the lens shows at a width: odd, so the pair sits in the middle. */
export function lensColumns(width: number): number {
  const fit = Math.floor(width / MIN_COLUMN);
  const odd = fit % 2 === 0 ? fit - 1 : fit;
  return clamp(odd, MIN_COLUMNS, MAX_COLUMNS);
}

/** The first and last position in the lens, centred on the pair and kept inside the table. */
export function lensWindow(query: number, key: number, columns: number): [number, number] {
  const half = (columns - 1) / 2;
  const centre = Math.round((query + key) / 2);
  const first = clamp(centre - half, 0, Math.max(0, LAST_POSITION - columns + 1));
  return [first, Math.min(LAST_POSITION, first + columns - 1)];
}

export interface LensProps {
  query: number;
  /** The key's position ("key" itself is taken by React). */
  keyPosition: number;
  width: number;
}

/**
 * A run of neighbouring positions as two rows: above, each position as float32
 * holds it (itself); below, what bfloat16 keeps, one box per value with the
 * positions that round to it joined into it. A line runs from every position
 * to the value it becomes, so the lines stay straight where nothing is lost
 * and converge where neighbours collapse.
 */
export function Lens({ query, keyPosition: key, width }: LensProps) {
  const columns = lensColumns(width);
  const [first, last] = lensWindow(query, key, columns);
  const column = width / columns;
  const centre = (position: number) => round2((position - first + 0.5) * column);
  const positions = Array.from({ length: last - first + 1 }, (_, index) => first + index);
  const blocks = blocksBetween(first, last);

  const storedQuery = stored(query, "bfloat16");
  const storedKey = stored(key, "bfloat16");
  const together = storedQuery === storedKey;
  const bits = SIGNIFICANT_BITS;

  return (
    <svg viewBox={`0 0 ${width} ${LENS_HEIGHT}`} width={width} height={LENS_HEIGHT} className="rot-lens" aria-hidden="true">
      <g transform={`translate(0,${TOP_LABEL - 4})`}>
        <Marker x={6} y={0} size={8} color={SERIES[0]} />
        <text x={16} y={0} dy="0.35em" className="rot-row-label">
          float32 holds every position
        </text>
      </g>

      {/* The lines from each position to the value it is stored as. */}
      {positions.map((position) => {
        const target = stored(position, "bfloat16");
        const moved = target !== position;
        // A value outside the lens: aim at the edge, where its box continues.
        const x2 = clamp(centre(target), 0, width);
        return (
          <line
            key={`line-${position}`}
            x1={centre(position)}
            y1={ROW1 + ROW}
            x2={x2}
            y2={ROW2}
            className={moved ? "rot-link rot-link-moved" : "rot-link"}
          />
        );
      })}

      {/* Row 1: every position. */}
      {positions.map((position) => {
        const selected = position === query || position === key;
        const x = (position - first) * column;
        return (
          <g key={`top-${position}`}>
            <rect
              x={round2(x + 1)}
              y={ROW1}
              width={round2(column - 2)}
              height={ROW}
              rx={2}
              className={selected ? "rot-cell rot-cell-selected" : "rot-cell"}
            />
            <text x={centre(position)} y={ROW1 + ROW / 2} dy="0.35em" textAnchor="middle" className="rot-cell-text">
              {position}
            </text>
            {selected ? (
              <text x={centre(position)} y={ROW1 - 7} textAnchor="middle" className="rot-pair-label">
                {position === query ? "q" : "k"}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* Row 2: one box per value bfloat16 keeps, as wide as the positions that round to it. */}
      {blocks.map((block) => {
        const from = Math.max(block.from, first);
        const to = Math.min(block.to, last);
        const x = (from - first) * column;
        const boxWidth = (to - from + 1) * column;
        const holdsPair = block.value === storedQuery || block.value === storedKey;
        const textX = block.value >= from && block.value <= to ? centre(block.value) : round2(x + boxWidth / 2);
        return (
          <g key={`block-${block.value}`}>
            <rect
              x={round2(x + 1)}
              y={ROW2}
              width={round2(boxWidth - 2)}
              height={ROW}
              rx={2}
              className={holdsPair ? "rot-block rot-block-pair" : "rot-block"}
            />
            <text x={textX} y={ROW2 + ROW / 2} dy="0.35em" textAnchor="middle" className="rot-cell-text">
              {block.value}
            </text>
          </g>
        );
      })}

      {/* Where the pair lands. */}
      {together ? (
        <text x={clamp(centre(storedQuery), 14, width - 14)} y={MARKS} textAnchor="middle" className="rot-pair-label">
          q, k
        </text>
      ) : (
        <>
          <text x={clamp(centre(storedQuery), 8, width - 8)} y={MARKS} textAnchor="middle" className="rot-pair-label">
            q
          </text>
          <text x={clamp(centre(storedKey), 8, width - 8)} y={MARKS} textAnchor="middle" className="rot-pair-label">
            k
          </text>
        </>
      )}

      <g transform={`translate(0,${BOTTOM_LABEL})`}>
        <Marker x={6} y={0} size={8} color={SERIES[1]} shape="square" />
        <text x={16} y={0} dy="0.35em" className="rot-row-label">
          bfloat16 ({bits} significant bits) rounds them to these
        </text>
      </g>
    </svg>
  );
}
