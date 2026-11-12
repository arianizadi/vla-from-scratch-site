import type { LinearScale } from "./scale";

export interface AxisProps {
  scale: LinearScale;
  /** "bottom": a horizontal axis under the plot. "left": a vertical axis at its left. */
  orientation: "bottom" | "left";
  /** Where the axis line sits on the other dimension: its y for "bottom", its x for "left". */
  offset: number;
  /** Tick values, or about how many to draw. Default 5. */
  ticks?: readonly number[] | number;
  /** Text of a tick: (v) => `${v}%`. */
  format?: (value: number) => string;
  /** What the axis measures, with its unit: "Samples seen (millions)". */
  label?: string;
  /** Length of the tick marks. Default 4; 0 hides them. */
  tickSize?: number;
  /** Leave out the axis line (a chart whose gridlines already mark the baseline). */
  hideLine?: boolean;
}

/**
 * An axis inside an <svg>: baseline in the strong border colour, ticks and
 * their text in faint ink at 13px. The bottom axis prints its label centred
 * underneath; the left axis prints it above the top of the axis, upright.
 *
 * Space to leave in the chart's margins: about 36px under a bottom axis
 * (52px with a label) and 40px beside a left axis.
 */
export function Axis({
  scale,
  orientation,
  offset,
  ticks = 5,
  format = String,
  label,
  tickSize = 4,
  hideLine = false,
}: AxisProps) {
  const values = typeof ticks === "number" ? scale.ticks(ticks) : ticks;
  const [r0, r1] = scale.range;
  const line = { stroke: "var(--border-strong)", strokeWidth: 1, shapeRendering: "crispEdges" as const };

  if (orientation === "bottom") {
    return (
      <g aria-hidden="true">
        {hideLine ? null : <line x1={r0} x2={r1} y1={offset} y2={offset} {...line} />}
        {values.map((value) => (
          <g key={value} transform={`translate(${scale(value)},${offset})`}>
            {tickSize > 0 ? <line y2={tickSize} {...line} /> : null}
            <text y={tickSize + 14} textAnchor="middle" className="fig-axis-text">
              {format(value)}
            </text>
          </g>
        ))}
        {label ? (
          <text x={(r0 + r1) / 2} y={offset + tickSize + 34} textAnchor="middle" className="fig-axis-text fig-axis-label">
            {label}
          </text>
        ) : null}
      </g>
    );
  }

  const top = Math.min(r0, r1);
  return (
    <g aria-hidden="true">
      {hideLine ? null : <line x1={offset} x2={offset} y1={r0} y2={r1} {...line} />}
      {values.map((value) => (
        <g key={value} transform={`translate(${offset},${scale(value)})`}>
          {tickSize > 0 ? <line x2={-tickSize} {...line} /> : null}
          <text x={-(tickSize + 6)} dy="0.32em" textAnchor="end" className="fig-axis-text">
            {format(value)}
          </text>
        </g>
      ))}
      {label ? (
        <text x={offset - tickSize - 6} y={top - 14} textAnchor="start" className="fig-axis-text fig-axis-label">
          {label}
        </text>
      ) : null}
    </g>
  );
}
