import { Marker, type MarkerShape } from "./Marker";

export interface LegendItem {
  label: string;
  /** A CSS colour, normally one of SERIES. */
  color: string;
  /** The marker the series is drawn with, or "line" for a line without markers. Default "line". */
  shape?: MarkerShape | "line";
  /** A dashed line: reference series such as the expert or the chance level. */
  dashed?: boolean;
}

export interface LegendProps {
  items: readonly LegendItem[];
  /** Names the list for screen readers. Default "Legend". */
  label?: string;
  className?: string;
}

/**
 * The key to a chart with two or more series. HTML, not SVG, so it wraps on a
 * narrow screen; place it above the chart. The labels are in ink and the
 * swatch beside each carries the colour and the shape.
 */
export function Legend({ items, label = "Legend", className = "" }: LegendProps) {
  return (
    <ul aria-label={label} className={`fig-legend ${className}`}>
      {items.map((item) => (
        <li key={item.label}>
          <svg width={22} height={12} viewBox="0 0 22 12" aria-hidden="true" focusable="false">
            <line
              x1={1}
              x2={21}
              y1={6}
              y2={6}
              stroke={item.color}
              strokeWidth={2}
              strokeDasharray={item.dashed ? "4 3" : undefined}
            />
            {item.shape && item.shape !== "line" ? <Marker shape={item.shape} x={11} y={6} color={item.color} /> : null}
          </svg>
          {item.label}
        </li>
      ))}
    </ul>
  );
}
