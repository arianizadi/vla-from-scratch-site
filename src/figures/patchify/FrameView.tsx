"use client";

import { useId, type KeyboardEvent, type MouseEvent } from "react";
import { cellOfToken, share, type Coverage, type Grid, type Window } from "./model";
import type { ObjectMask } from "./segment";

/** Room around the frame for the row and column numbers and the dimension line under it. */
export const FRAME_GUTTER = { left: 26, top: 20, right: 10, bottom: 30 } as const;

export interface FrameViewProps {
  src: string;
  /** Text alternative of the frame: what it shows, with its numbers. */
  alt: string;
  grid: Grid;
  /** The patches shown: the whole frame, or a square of patches around the object. */
  view: Window;
  /**
   * Drawn side of the shown square in CSS pixels, at most. The drawing scales
   * down with its container (it is laid out in percentages and a viewBox), so
   * that the static HTML, drawn before the stage is measured, never overflows.
   */
  size: number;
  mask?: ObjectMask;
  coverage?: Coverage;
  focus: number;
  onFocus: (token: number) => void;
  /** Accessible name of the keyboard-operable grid. */
  label: string;
  /** Id of the element that describes the focused patch. */
  describedBy?: string;
}

/**
 * The camera frame at its own pixels (scaled up without smoothing) with the
 * patch grid over it, the patches the object touches, the object's outline and
 * the focused patch. Close up, each touched patch also carries the share of it
 * the object fills. The object's box is measured in pixels in either view. A
 * click or tap, and the arrow keys, select a patch among those shown; moving
 * the pointer over the frame changes nothing.
 */
export function FrameView({ src, alt, grid, view, size, mask, coverage, focus, onFocus, label, describedBy }: FrameViewProps) {
  const { left, top, right, bottom } = FRAME_GUTTER;
  const clipId = useId();
  const close = view.n < grid.side;
  // The square shown, in frame pixels; the whole frame includes any remainder a patch grid leaves.
  const x0 = view.col0 * grid.patch;
  const y0 = view.row0 * grid.patch;
  const span = close ? view.n * grid.patch : grid.size;
  const scale = size / span;
  const cell = grid.patch * scale;
  const width = left + size + right;
  const height = top + size + bottom;
  const labelStep = cell < 20 ? 2 : 1;
  const focused = cellOfToken(grid, focus);
  const inView = (row: number, col: number) =>
    row >= view.row0 && row < view.row0 + view.n && col >= view.col0 && col < view.col0 + view.n;
  const px = (x: number) => (x - x0) * scale;
  const py = (y: number) => (y - y0) * scale;
  const indices = Array.from({ length: view.n }, (_, index) => index);

  const pick = (event: MouseEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const col = view.col0 + Math.floor((((event.clientX - box.left) / box.width) * span) / grid.patch);
    const row = view.row0 + Math.floor((((event.clientY - box.top) / box.height) * span) / grid.patch);
    if (!inView(row, col)) return;
    onFocus(row * grid.side + col);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // From outside the window (the stepper can go anywhere), the keys start at its first patch.
    const from = inView(focused.row, focused.col) ? focused : cellOfToken(grid, view.row0 * grid.side + view.col0);
    const lastRow = view.row0 + view.n - 1;
    const lastCol = view.col0 + view.n - 1;
    let row = from.row;
    let col = from.col;
    if (event.key === "ArrowRight") col = Math.min(lastCol, col + 1);
    else if (event.key === "ArrowLeft") col = Math.max(view.col0, col - 1);
    else if (event.key === "ArrowDown") row = Math.min(lastRow, row + 1);
    else if (event.key === "ArrowUp") row = Math.max(view.row0, row - 1);
    else if (event.key === "Home") [row, col] = [view.row0, view.col0];
    else if (event.key === "End") [row, col] = [lastRow, lastCol];
    else return;
    event.preventDefault();
    onFocus(row * grid.side + col);
  };

  // The object's size close up: a dimension line across it (above, or below when there is no room) and one down beside it.
  const box = mask?.box;
  // Drawn outside the touched patches, with extension lines back to the object, so they never cover a share.
  const dims =
    box && coverage && coverage.tokens.length > 0
      ? (() => {
          const rows = coverage.tokens.map((token) => Math.floor(token / grid.side));
          const cols = coverage.tokens.map((token) => token % grid.side);
          const regionTop = py(Math.min(...rows) * grid.patch);
          const regionBottom = py((Math.max(...rows) + 1) * grid.patch);
          const regionLeft = px(Math.min(...cols) * grid.patch);
          const regionRight = px((Math.max(...cols) + 1) * grid.patch);
          const dx0 = px(box.x);
          const dx1 = px(box.x + box.width);
          const dy0 = py(box.y);
          const dy1 = py(box.y + box.height);
          const above = regionTop >= 30;
          const toRight = regionRight <= size - 60;
          return {
            dx0,
            dx1,
            dy0,
            dy1,
            above,
            lineY: above ? regionTop - 12 : regionBottom + 12,
            toRight,
            lineX: toRight ? regionRight + 12 : regionLeft - 12,
          };
        })()
      : null;

  return (
    <div className="pf-frame" style={{ maxWidth: width, aspectRatio: `${width} / ${height}` }}>
      <div className="pf-window" style={percentBox(left, top, size, width, height)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- the frame is shown at its own pixels: next/image would resample it */}
        <img
          src={src}
          alt={alt}
          width={grid.size}
          height={grid.size}
          className="pf-pixels"
          style={{
            left: `${(-x0 / span) * 100}%`,
            top: `${(-y0 / span) * 100}%`,
            width: `${(grid.size / span) * 100}%`,
            height: `${(grid.size / span) * 100}%`,
          }}
          draggable={false}
        />
      </div>
      <svg
        className="pf-overlay"
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={-1} y={-1} width={size + 2} height={size + 2} />
          </clipPath>
        </defs>

        {/* column and row numbers */}
        {indices.map((index) =>
          index % labelStep !== 0 && index !== view.n - 1 ? null : (
            <g key={index}>
              <text
                x={left + (index + 0.5) * cell}
                y={top - 6}
                textAnchor="middle"
                className={`fig-axis-text ${view.col0 + index === focused.col ? "pf-num-on" : ""}`}
              >
                {view.col0 + index}
              </text>
              <text
                x={left - 6}
                y={top + (index + 0.5) * cell}
                textAnchor="end"
                dominantBaseline="central"
                className={`fig-axis-text ${view.row0 + index === focused.row ? "pf-num-on" : ""}`}
              >
                {view.row0 + index}
              </text>
            </g>
          ),
        )}

        <g transform={`translate(${left} ${top})`}>
          <g clipPath={`url(#${clipId})`}>
            {/* the patch grid */}
            <g className="pf-grid">
              {Array.from({ length: view.n + 1 }, (_, index) => (
                <g key={index}>
                  <line x1={index * cell} x2={index * cell} y1={0} y2={view.n * cell} />
                  <line x1={0} x2={view.n * cell} y1={index * cell} y2={index * cell} />
                </g>
              ))}
            </g>

            {/* patches the object touches */}
            {coverage?.tokens.map((token) => {
              const at = cellOfToken(grid, token);
              if (!inView(at.row, at.col)) return null;
              return <rect key={token} x={px(at.x) + 1} y={py(at.y) + 1} width={cell - 2} height={cell - 2} className="pf-touched" />;
            })}

            {/* the object's own pixels */}
            {mask ? (
              <g transform={`scale(${scale}) translate(${-x0} ${-y0})`}>
                <path d={mask.outline} className="pf-outline-halo" vectorEffect="non-scaling-stroke" />
                <path d={mask.outline} className="pf-outline" vectorEffect="non-scaling-stroke" />
              </g>
            ) : null}

            {/* the focused patch */}
            {inView(focused.row, focused.col) ? (
              <rect x={px(focused.x)} y={py(focused.y)} width={cell} height={cell} className="pf-focus" />
            ) : null}

            {/* close up: the share of each touched patch the object fills */}
            {close
              ? coverage?.tokens.map((token) => {
                  const at = cellOfToken(grid, token);
                  if (!inView(at.row, at.col)) return null;
                  return (
                    <text
                      key={token}
                      x={px(at.x) + 6}
                      y={py(at.y) + 17}
                      className="fig-axis-text pf-halo"
                    >
                      {share((coverage.byToken.get(token) ?? 0) / (grid.patch * grid.patch))}
                    </text>
                  );
                })
              : null}
          </g>

          {/* close up: the object's size */}
          {box && dims ? (
            <g className="pf-dim">
              <line x1={dims.dx0} x2={dims.dx0} y1={dims.above ? dims.dy0 : dims.dy1} y2={dims.lineY} className="pf-extension" />
              <line x1={dims.dx1} x2={dims.dx1} y1={dims.above ? dims.dy0 : dims.dy1} y2={dims.lineY} className="pf-extension" />
              <line x1={dims.toRight ? dims.dx1 : dims.dx0} x2={dims.lineX} y1={dims.dy0} y2={dims.dy0} className="pf-extension" />
              <line x1={dims.toRight ? dims.dx1 : dims.dx0} x2={dims.lineX} y1={dims.dy1} y2={dims.dy1} className="pf-extension" />
              <line x1={dims.dx0} x2={dims.dx1} y1={dims.lineY} y2={dims.lineY} />
              <line x1={dims.dx0} x2={dims.dx0} y1={dims.lineY - 4} y2={dims.lineY + 4} />
              <line x1={dims.dx1} x2={dims.dx1} y1={dims.lineY - 4} y2={dims.lineY + 4} />
              <text
                x={(dims.dx0 + dims.dx1) / 2}
                y={dims.above ? dims.lineY - 6 : dims.lineY + 16}
                textAnchor="middle"
                className="fig-axis-text pf-halo"
              >
                {box.width} px
              </text>
              <line x1={dims.lineX} x2={dims.lineX} y1={dims.dy0} y2={dims.dy1} />
              <line x1={dims.lineX - 4} x2={dims.lineX + 4} y1={dims.dy0} y2={dims.dy0} />
              <line x1={dims.lineX - 4} x2={dims.lineX + 4} y1={dims.dy1} y2={dims.dy1} />
              <text
                x={dims.toRight ? dims.lineX + 6 : dims.lineX - 6}
                y={(dims.dy0 + dims.dy1) / 2}
                textAnchor={dims.toRight ? "start" : "end"}
                dominantBaseline="central"
                className="fig-axis-text pf-halo"
              >
                {box.height} px
              </text>
            </g>
          ) : null}

          {/* the side of what is shown */}
          <g className="pf-dim pf-dim-frame">
            <line x1={0} x2={size} y1={size + 14} y2={size + 14} />
            <line x1={0} x2={0} y1={size + 9} y2={size + 19} />
            <line x1={size} x2={size} y1={size + 9} y2={size + 19} />
            <rect x={size / 2 - 60} y={size + 5} width={120} height={18} className="pf-dim-gap" />
            <text x={size / 2} y={size + 19} textAnchor="middle" className="fig-axis-text pf-dim-text">
              {close ? `${span} of ${grid.size} px` : `${grid.size} px`}
            </text>
          </g>
        </g>
      </svg>
      <div
        className="pf-hit"
        style={percentBox(left, top, size, width, height)}
        // A slider over the patches (as the token strip is), not role="application", so a screen
        // reader keeps its reading commands; the arrow keys move in two dimensions as described.
        role="slider"
        aria-roledescription="patch grid"
        aria-label={label}
        aria-describedby={describedBy}
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={grid.side * grid.side - 1}
        aria-valuenow={focused.row * grid.side + focused.col}
        aria-valuetext={`Patch in row ${focused.row + 1}, column ${focused.col + 1}, of ${grid.side} by ${grid.side}`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onClick={pick}
      />
    </div>
  );
}

/** A square of `size` at (`left`, `top`) inside a `width` × `height` box, in percentages of that box. */
function percentBox(left: number, top: number, size: number, width: number, height: number) {
  return {
    left: `${(left / width) * 100}%`,
    top: `${(top / height) * 100}%`,
    width: `${(size / width) * 100}%`,
    height: `${(size / height) * 100}%`,
  };
}
