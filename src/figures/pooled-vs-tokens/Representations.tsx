"use client";

import type { CSSProperties } from "react";
import { GRID, PATCH_PX, TOKEN_COUNT, piecesAt, type Point } from "./model";
import { styles } from "./classes";

/** Gap between two token cells, in the cells' own pixels. */
const GAP = 4;
const STRIDE = PATCH_PX + GAP;
const SIDE = GRID * STRIDE - GAP;
const CELLS = Array.from({ length: TOKEN_COUNT }, (_, token) => token);

interface TokenGridProps {
  now: Point;
  before: Point;
  /** Tokens whose numbers differ from before. */
  changed: readonly number[];
}

/**
 * The 196 tokens, each drawn as its own 16 x 16 numbers (here: the pixels of
 * its patch, cube or table) and set out in the order of the patches, so a
 * token sits where its patch is. Tokens the move changed are outlined in ink;
 * where the cube was, a dashed outline.
 */
export function TokenGrid({ now, before, changed }: TokenGridProps) {
  const changedSet = new Set(changed);
  const pieces = piecesAt(now);
  const was = piecesAt(before);
  const cellX = (token: number) => (token % GRID) * STRIDE;
  const cellY = (token: number) => Math.floor(token / GRID) * STRIDE;

  return (
    <svg viewBox={`0 0 ${SIDE} ${SIDE}`} className={`${styles.scaled} ${styles.quiet}`} aria-hidden="true">
      {CELLS.map((token) => (
        <rect
          key={token}
          x={cellX(token)}
          y={cellY(token)}
          width={PATCH_PX}
          height={PATCH_PX}
          className={styles.cell}
        />
      ))}
      {pieces.map((piece) => (
        <rect
          key={piece.token}
          x={cellX(piece.token) + piece.x - piece.column * PATCH_PX}
          y={cellY(piece.token) + piece.y - piece.row * PATCH_PX}
          width={piece.width}
          height={piece.height}
          className={styles.cube}
        />
      ))}
      {was.map((piece) => (
        <rect
          key={piece.token}
          x={cellX(piece.token) + piece.x - piece.column * PATCH_PX}
          y={cellY(piece.token) + piece.y - piece.row * PATCH_PX}
          width={piece.width}
          height={piece.height}
          className={styles.ghost}
        />
      ))}
      {changed.map((token) => (
        <rect
          key={token}
          x={cellX(token) - 1}
          y={cellY(token) - 1}
          width={PATCH_PX + 2}
          height={PATCH_PX + 2}
          className={styles.changed}
        />
      ))}
      {/* Tokens that hold the cube and did not change: the vision outline alone. */}
      {pieces
        .filter((piece) => !changedSet.has(piece.token))
        .map((piece) => (
          <rect
            key={piece.token}
            x={cellX(piece.token)}
            y={cellY(piece.token)}
            width={PATCH_PX}
            height={PATCH_PX}
            className={styles.holding}
          />
        ))}
    </svg>
  );
}

interface PooledChipProps {
  /** The pooled vector up to its scale: counts out of TOKEN_COUNT, row by row. */
  counts: readonly number[];
  /** Positions whose value the move changed. */
  changed: readonly number[];
  /** 1 draws the values as they are, on the tokens' scale; more brightens them. */
  magnification: number;
}

/**
 * The pooled vector, drawn as the tokens are: 16 x 16 numbers, each as bright
 * as its value on the scale from table (0) to cube (1). Numbers the move
 * changed carry an ink dot.
 */
export function PooledChip({ counts, changed, magnification }: PooledChipProps) {
  return (
    <svg
      viewBox={`-0.5 -0.5 ${PATCH_PX + 1} ${PATCH_PX + 1}`}
      className={`${styles.scaled} ${styles.quiet}`}
      aria-hidden="true"
    >
      <rect width={PATCH_PX} height={PATCH_PX} className={styles.cell} />
      {counts.map((count, index) =>
        count > 0 ? (
          <rect
            key={index}
            x={index % PATCH_PX}
            y={Math.floor(index / PATCH_PX)}
            width={1}
            height={1}
            className={styles.cube}
            style={{ fillOpacity: Math.min(1, (count * magnification) / TOKEN_COUNT) } as CSSProperties}
          />
        ) : null,
      )}
      {/* A dot, not an outline: a vertical move changes whole rows, and outlines would read as a large change. */}
      {changed.map((index) => (
        <circle
          key={index}
          cx={(index % PATCH_PX) + 0.5}
          cy={Math.floor(index / PATCH_PX) + 0.5}
          r={0.2}
          className={styles.changedNumber}
        />
      ))}
    </svg>
  );
}

interface MeterProps {
  /** The largest change of one number, between 0 and 1 of the step from table to cube. */
  value: number;
  /** The same value as text: "1", "1/196", "0". */
  text: string;
}

/**
 * The largest change of any one number, on the scale from no change to the
 * whole step from table to cube. A change too small to see still gets one
 * pixel, so "small" and "none" look different; the text says which.
 */
export function Meter({ value, text }: MeterProps) {
  const fill = value <= 0 ? "0px" : `max(1px, ${value * 100}%)`;
  return (
    <span className={styles.meter}>
      <span className={styles.meterTrack} aria-hidden="true">
        <span className={styles.meterFill} style={{ width: fill }} />
      </span>
      <strong>{text}</strong>
    </span>
  );
}
