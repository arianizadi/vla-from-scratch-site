"use client";

import { memo, useId, useState, type PointerEvent } from "react";
import { blockNote, cellAt, hitTest, type Geometry, type PlacedBlock } from "./layout";
import type { CellStyle, Panel } from "./model";

/** Styles drawn as an outline inside the cell rather than a fill. */
const OUTLINED = new Set<CellStyle>([
  "placeholder",
  "clean",
  "empty",
  "state",
  "unsplit",
]);

interface CellProps {
  style: CellStyle;
  size: number;
  /** How far a cell that names the object reaches above its row. */
  raise: number;
  hatch: string;
  /** In a panel with loss targets: a token the loss does not score is drawn faded. */
  muted?: boolean;
}

/** One token. Drawn at the origin; the caller moves it into place. */
export function CellShape({ style, size, raise, hatch, muted }: CellProps) {
  const inset = OUTLINED.has(style) ? 0.5 : 0;
  const side = size - 2 * inset;
  // A token that names the object is a taller cell: its shape, not only its colour, sets it apart.
  const lift = style === "key" ? raise : 0;
  return (
    <g className={muted ? "sl-muted" : undefined}>
      <rect
        className="sl-cell"
        data-s={style}
        x={inset}
        y={inset - lift}
        width={side}
        height={side + lift}
        fill={style === "state" ? `url(#${hatch})` : undefined}
      />
      {style === "summary" ? (
        <path className="sl-cell-half" d={`M${size} 0V${size}H0Z`} />
      ) : null}
    </g>
  );
}

/** Runs of consecutive marked offsets of a block, split where the block wraps to a new row. */
function runs(
  placed: PlacedBlock,
  pitch: number,
  marked: (offset: number) => boolean,
): { x: number; y: number; w: number }[] {
  const out: { x: number; y: number; w: number }[] = [];
  const { block, cols } = placed;
  let start = -1;
  for (let i = 0; i <= block.n; i += 1) {
    const on = i < block.n && marked(i);
    const rowBreak = start >= 0 && i % cols === 0;
    if (start >= 0 && (!on || rowBreak)) {
      const row = Math.floor(start / cols);
      out.push({
        x: placed.x + (start % cols) * pitch,
        y: placed.y + row * pitch,
        w: (i - start) * pitch - 1,
      });
      start = -1;
    }
    if (on && start < 0) start = i;
  }
  return out;
}

interface CellsProps {
  geometry: Geometry;
  hatch: string;
  animate: boolean;
}

/** Every cell of a panel. Memoised: moving the cursor redraws only the overlay. */
const Cells = memo(function Cells({ geometry, hatch, animate }: CellsProps) {
  const { cell, pitch, raise } = geometry;
  const scoring = geometry.under > 0;
  return (
    <g className={animate ? "sl-cells sl-animate" : "sl-cells"}>
      {geometry.placed.map((placed) =>
        placed.block.styles.map((style, i) => {
          const x = placed.x + (i % placed.cols) * pitch;
          const y = placed.y + Math.floor(i / placed.cols) * pitch;
          return (
            <g
              key={`${placed.block.key}:${i}`}
              className="sl-slot"
              style={{ transform: `translate(${x}px, ${y}px)` }}
            >
              <CellShape
                style={style}
                size={cell}
                raise={raise}
                hatch={hatch}
                muted={scoring && !placed.block.targets?.[i]}
              />
            </g>
          );
        }),
      )}
      {scoring
        ? geometry.placed.flatMap((placed) =>
            runs(placed, pitch, (i) => placed.block.targets?.[i] === true).map(
              (run) => (
                <rect
                  key={`${placed.block.key}:t:${run.x}:${run.y}`}
                  className="sl-target-bar"
                  x={run.x}
                  y={run.y + cell + 2}
                  width={run.w}
                  height={2}
                />
              ),
            ),
          )
        : null}
    </g>
  );
});

/** Labels under the blocks and brackets over the parts. */
const Labels = memo(function Labels({ geometry }: { geometry: Geometry }) {
  return (
    <g aria-hidden="true">
      {geometry.brackets.map((bracket) => (
        <g key={bracket.key}>
          <path
            className="sl-bracket"
            d={`M${bracket.x1} ${bracket.y + 4}V${bracket.y}H${bracket.x2}V${bracket.y + 4}`}
          />
          {bracket.label ? (
            <text
              className="fig-axis-text sl-bracket-text"
              x={bracket.x1}
              y={bracket.y - 5}
            >
              {bracket.label}
            </text>
          ) : null}
        </g>
      ))}
      {geometry.placed.map((placed) => (
        <text
          key={placed.block.key}
          className="fig-axis-text"
          x={placed.x}
          y={placed.y + placed.h + geometry.under + 15}
        >
          <tspan className="sl-label">{placed.block.label}</tspan>
          <tspan x={placed.x} dy={15}>
            {blockNote(placed.block)}
          </tspan>
        </text>
      ))}
    </g>
  );
});

export interface DrawingProps {
  panel: Panel;
  geometry: Geometry;
  /** The selected position in this panel, and the position it is linked to. */
  cursor: number | null;
  linked: number | null;
  /** Positions whose token changed with the last change of instruction. */
  changed: readonly number[];
  /** A click or tap on a cell selects it. */
  onSelect: (index: number) => void;
  animate: boolean;
  label: string;
}

export function Drawing({
  panel,
  geometry,
  cursor,
  linked,
  changed,
  onSelect,
  animate,
  label,
}: DrawingProps) {
  const hatch = `${useId().replace(/:/g, "")}-hatch`;
  const [hover, setHover] = useState<number | null>(null);
  const { width, height, cell, pitch, raise } = geometry;

  const indexAt = (event: PointerEvent<SVGSVGElement>): number | null => {
    const box = event.currentTarget.getBoundingClientRect();
    if (box.width === 0) return null;
    const scale = width / box.width;
    return hitTest(
      geometry,
      (event.clientX - box.left) * scale,
      (event.clientY - box.top) * scale,
    );
  };

  // Hover only lights the cell up; the selection (and the announced status) changes on a click or tap.
  const onMove = (event: PointerEvent<SVGSVGElement>) => {
    if (event.pointerType !== "mouse") return;
    const index = indexAt(event);
    if (index !== hover) setHover(index);
  };
  const onDown = (event: PointerEvent<SVGSVGElement>) => {
    const index = indexAt(event);
    if (index !== null && index !== cursor) onSelect(index);
  };

  const marks = [cursor, linked].flatMap((index) => {
    if (index === null) return [];
    const at = cellAt(geometry, index);
    if (!at) return [];
    const offset = index - at.placed.block.start;
    return [
      {
        index,
        ...at,
        style: at.placed.block.styles[offset],
        muted: geometry.under > 0 && !at.placed.block.targets?.[offset],
      },
    ];
  });
  const current = cursor !== null ? cellAt(geometry, cursor) : null;
  const hovered =
    hover !== null && hover !== cursor ? cellAt(geometry, hover) : null;

  const changedSet = new Set(changed);
  const changedRuns =
    changed.length > 0
      ? geometry.placed.flatMap((placed) =>
          runs(placed, pitch, (i) => changedSet.has(placed.block.start + i)),
        )
      : [];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="sl-svg"
      role="img"
      aria-label={label}
      onPointerMove={onMove}
      onPointerLeave={() => setHover(null)}
      onPointerDown={onDown}
      data-panel={panel.id}
    >
      <defs>
        <pattern
          id={hatch}
          width={3}
          height={3}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width={3} height={3} className="sl-hatch-ground" />
          <line x1={0.75} y1={0} x2={0.75} y2={3} className="sl-hatch-line" />
        </pattern>
      </defs>
      {current ? (
        <rect
          className="sl-block-outline"
          x={current.placed.x - 3.5}
          y={current.placed.y - 3.5}
          width={current.placed.w + 7}
          height={current.placed.h + 7}
        />
      ) : null}
      <Cells geometry={geometry} hatch={hatch} animate={animate} />
      <Labels geometry={geometry} />
      {changedRuns.map((run) => (
        <rect
          key={`c:${run.x}:${run.y}`}
          className="sl-changed"
          x={run.x - 2.5}
          y={run.y - 2.5 - raise}
          width={run.w + 5}
          height={cell + 5 + raise}
        />
      ))}
      {hovered ? (
        <rect
          className="sl-hover"
          x={hovered.x - 1.5}
          y={hovered.y - 1.5}
          width={cell + 3}
          height={cell + 3}
        />
      ) : null}
      {marks.map((mark) => (
        <g
          key={mark.index === cursor ? "cursor" : "linked"}
          transform={`translate(${mark.x} ${mark.y})`}
        >
          <rect
            className="sl-mark"
            x={-2.5}
            y={-2.5 - (mark.style === "key" ? raise : 0)}
            width={cell + 5}
            height={cell + 5 + (mark.style === "key" ? raise : 0)}
          />
          <CellShape
            style={mark.style}
            size={cell}
            raise={raise}
            hatch={hatch}
            muted={mark.muted}
          />
        </g>
      ))}
    </svg>
  );
}
