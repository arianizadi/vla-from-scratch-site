"use client";

import { useRef, type PointerEvent } from "react";
import { Axis, GridLines, Marker, SERIES, scaleLinear } from "@/figures/kit";
import { round2 } from "./draw";
import {
  DISTINCT_CORNERS,
  LANDMARKS,
  LAST_POSITION,
  MEASURED_DISTINCT,
  TABLE_SIZE,
  ZONES,
  clamp,
  distinctUpTo,
} from "./model";

export interface CountChartProps {
  width: number;
  /** The query's position: the crosshair. */
  position: number;
  /** Called while the reader points at or drags along the chart. */
  onPick: (position: number) => void;
}

/**
 * Distinct positions the table holds, counted from position 0 up to each
 * position: float32 climbs one per position to the size of the table; bfloat16
 * climbs one per position up to 256, then one per two, one per four and one
 * per eight. Its end is the notebook's count, which the figure only draws when
 * rounding here gives the same number.
 */
export function CountChart({ width, position, onPick }: CountChartProps) {
  const svg = useRef<SVGSVGElement>(null);
  const narrow = width < 520;
  const height = narrow ? 230 : 260;
  const margin = { top: 34, right: 52, bottom: 52, left: 48 };
  const x = scaleLinear([0, LAST_POSITION], [margin.left, width - margin.right]);
  const y = scaleLinear([0, TABLE_SIZE], [height - margin.bottom, margin.top]);

  // Ticks at the zone edges, where the steps change; the last one is the end of the table.
  const edges = ZONES.slice(0, -1).map((zone) => zone.to);
  // Narrow, the second edge is left out: the first, where collapsing starts, matters most.
  const xTicks = narrow ? [0, ...edges.filter((_, index) => index !== 1), LAST_POSITION] : [0, ...edges, LAST_POSITION];
  const yTicks = [0, TABLE_SIZE / 4, TABLE_SIZE / 2, (TABLE_SIZE * 3) / 4, TABLE_SIZE];

  const floatPath = `M${x(0)},${y(distinctUpTo(0, "float32"))}L${x(LAST_POSITION)},${y(distinctUpTo(LAST_POSITION, "float32"))}`;
  const bfloatPath = DISTINCT_CORNERS.map(([px, py], index) => `${index === 0 ? "M" : "L"}${round2(x(px))},${round2(y(py))}`).join("");

  const cx = x(position);
  const floatCount = distinctUpTo(position, "float32");
  const bfloatCount = distinctUpTo(position, "bfloat16");

  const pick = (event: PointerEvent<SVGSVGElement>) => {
    const box = svg.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    const local = ((event.clientX - box.left) / box.width) * width;
    onPick(clamp(Math.round(x.invert(local)), 0, LAST_POSITION));
  };

  return (
    <svg
      ref={svg}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="rot-chart"
      aria-hidden="true"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        pick(event);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) pick(event);
      }}
    >
      <GridLines scale={y} orientation="horizontal" extent={[margin.left, width - margin.right]} ticks={yTicks} />

      {/* Where the action-step tokens of the two policies sit. */}
      {/* Wide, every label sits to the right of its band. Narrow, the bands are close together, so the
          first label sits to the left of its band and the others to the right of theirs. */}
      {LANDMARKS.map((landmark, index) => {
        const before = narrow && index === 0;
        return (
          <g key={landmark.id}>
            <rect
              x={round2(x(landmark.first) - 1)}
              y={margin.top}
              width={round2(Math.max(3, x(landmark.last) - x(landmark.first) + 2))}
              height={height - margin.top - margin.bottom}
              className="rot-band"
            />
            <text
              x={round2(before ? x(landmark.first) - 5 : x(landmark.last) + 5)}
              y={margin.top + 22}
              textAnchor={before ? "end" : "start"}
              className="fig-axis-text rot-band-label"
            >
              {landmark.short}
            </text>
          </g>
        );
      })}

      <Axis scale={x} orientation="bottom" offset={height - margin.bottom} ticks={xTicks} label="Position" />
      <Axis
        scale={y}
        orientation="left"
        offset={margin.left}
        ticks={yTicks}
        label="Distinct positions from 0 up to here"
        tickSize={0}
        hideLine
      />

      <path d={floatPath} className="rot-line" stroke={SERIES[0]} />
      <path d={bfloatPath} className="rot-line" stroke={SERIES[1]} />

      {/* The ends: the size of the table, and the notebook's count. */}
      <text x={width - margin.right + 8} y={y(TABLE_SIZE)} dy="0.35em" className="rot-end-label">
        {TABLE_SIZE}
      </text>
      <text x={width - margin.right + 8} y={y(MEASURED_DISTINCT)} dy="0.35em" className="rot-end-label">
        {MEASURED_DISTINCT}
      </text>

      {/* The crosshair at the query's position. */}
      <line x1={cx} x2={cx} y1={margin.top} y2={height - margin.bottom} className="rot-crosshair" />
      <Marker x={cx} y={y(floatCount)} size={9} color={SERIES[0]} />
      <Marker x={cx} y={y(bfloatCount)} size={9} color={SERIES[1]} shape="square" />
    </svg>
  );
}
