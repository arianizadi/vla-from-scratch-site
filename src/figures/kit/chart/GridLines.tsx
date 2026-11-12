import type { LinearScale } from "./scale";

export interface GridLinesProps {
  scale: LinearScale;
  /** "horizontal": one line per tick of a y scale. "vertical": one per tick of an x scale. */
  orientation: "horizontal" | "vertical";
  /** Where the lines start and end on the other dimension, in px. */
  extent: readonly [number, number];
  /** Tick values, or about how many. Default 5. Use the same value as the axis. */
  ticks?: readonly number[] | number;
}

/** Recessive gridlines in the grid colour. Draw them before the data. */
export function GridLines({ scale, orientation, extent, ticks = 5 }: GridLinesProps) {
  const values = typeof ticks === "number" ? scale.ticks(ticks) : ticks;
  const [from, to] = extent;
  return (
    <g aria-hidden="true" stroke="var(--grid)" strokeWidth={1} shapeRendering="crispEdges">
      {values.map((value) => {
        const at = scale(value);
        return orientation === "horizontal" ? (
          <line key={value} x1={from} x2={to} y1={at} y2={at} />
        ) : (
          <line key={value} x1={at} x2={at} y1={from} y2={to} />
        );
      })}
    </g>
  );
}
