"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import type { Coverage, Grid } from "./model";

export interface TokenStripProps {
  grid: Grid;
  /** Available width in CSS pixels. */
  width: number;
  coverage?: Coverage;
  focus: number;
  onFocus: (token: number) => void;
  /** Accessible name and current value, as a slider over the sequence. */
  label: string;
  valueText: string;
}

const GUTTER = 34;
const GAP = 2;
/** Room above the cells for a row number. */
const LABEL_BAND = 15;

/**
 * Tokens per line: as many as fit at the pitch, but never a multiple or a
 * divisor of the patches per row, so the lines do not stack back into the
 * frame's grid. The sequence is one dimensional; only the ticks say where a
 * row of patches began.
 */
function tokensPerLine(available: number, pitch: number, grid: Grid): number {
  let perLine = Math.max(1, Math.floor(available / pitch));
  if (perLine >= grid.tokens) return grid.tokens;
  while (perLine > 2 && (perLine % grid.side === 0 || grid.side % perLine === 0)) perLine -= 1;
  return perLine;
}

/**
 * The frame as the transformer receives it: one token per patch, in reading
 * order, wrapped like a line of text. A tall tick, with the row's number when
 * there is room, marks where each row of patches starts; each line begins
 * with the index of its first token.
 */
export function TokenStrip({ grid, width, coverage, focus, onFocus, label, valueText }: TokenStripProps) {
  const roomy = width >= 600;
  const available = Math.max(60, width - GUTTER);
  const targetPitch = roomy ? 12 : 9;
  const perLine = tokensPerLine(available, targetPitch, grid);
  const lines = Math.ceil(grid.tokens / perLine);
  const pitch = Math.min(roomy ? 16 : 12, Math.max(6, Math.floor(available / perLine)));
  const cell = pitch - GAP;
  const band = roomy ? LABEL_BAND : 4;
  const lineHeight = band + cell + 8;
  const height = lines * lineHeight;
  const drawnWidth = GUTTER + perLine * pitch;
  const touched = new Set(coverage?.tokens ?? []);

  const place = (token: number) => {
    const line = Math.floor(token / perLine);
    return { x: GUTTER + (token % perLine) * pitch, y: line * lineHeight + band };
  };

  const pick = (event: MouseEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * drawnWidth - GUTTER;
    const y = ((event.clientY - box.top) / box.height) * height;
    if (x < 0) return;
    const at = Math.min(perLine - 1, Math.floor(x / pitch));
    const line = Math.min(lines - 1, Math.max(0, Math.floor(y / lineHeight)));
    const token = line * perLine + at;
    if (token < grid.tokens) onFocus(token);
  };

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    let next: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") next = focus + 1;
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = focus - 1;
    else if (event.key === "PageUp") next = focus + grid.side;
    else if (event.key === "PageDown") next = focus - grid.side;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = grid.tokens - 1;
    if (next === null) return;
    event.preventDefault();
    onFocus(Math.max(0, Math.min(grid.tokens - 1, next)));
  };

  const focused = place(focus);

  return (
    <svg
      className="pf-strip"
      width={drawnWidth}
      height={height}
      viewBox={`0 0 ${drawnWidth} ${height}`}
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={grid.tokens - 1}
      aria-valuenow={focus}
      aria-valuetext={valueText}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onClick={pick}
    >
      {Array.from({ length: lines }, (_, line) => (
        <text
          key={line}
          x={GUTTER - 6}
          y={line * lineHeight + band + cell / 2}
          textAnchor="end"
          dominantBaseline="central"
          className="fig-axis-text"
        >
          {line * perLine}
        </text>
      ))}
      {Array.from({ length: grid.tokens }, (_, token) => {
        const { x, y } = place(token);
        return (
          <rect key={token} x={x} y={y} width={cell} height={cell} className={touched.has(token) ? "pf-token pf-token-object" : "pf-token"} />
        );
      })}
      {/* where each row of patches starts: a tall tick and, when there is room, the row's number */}
      {Array.from({ length: grid.side }, (_, row) => {
        const { x, y } = place(row * grid.side);
        return (
          <g key={row}>
            <line x1={x - GAP / 2} x2={x - GAP / 2} y1={y - (roomy ? 6 : 4)} y2={y + cell + 3} className="pf-row-break" />
            {roomy ? (
              <text x={x - GAP / 2 + 3} y={y - 4} className="fig-axis-text pf-row-number">
                {row}
              </text>
            ) : null}
          </g>
        );
      })}
      <rect x={focused.x - 1} y={focused.y - 1} width={cell + 2} height={cell + 2} className="pf-token-focus" />
      {touched.has(focus) && cell >= 8 ? (
        <rect x={focused.x + 3} y={focused.y + 3} width={cell - 6} height={cell - 6} className="pf-token-focus-object" />
      ) : null}
    </svg>
  );
}
