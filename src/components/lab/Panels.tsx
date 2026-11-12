"use client";

/**
 * Aligned line panels for the lab page's charts (DESIGN.md, section 9): one
 * y-axis per panel, two or more measures become two or more panels that share
 * the x-axis and one crosshair. The pointer or the arrow keys move the
 * crosshair from one x position to the next; the caller turns the position
 * into the words of the frame's status line.
 *
 * The panels are drawn from the data they are given; nothing here knows a value.
 */

import { useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import {
  Axis,
  GridLines,
  Marker,
  REFERENCE,
  linePath,
  niceTicks,
  scaleLinear,
  useElementSize,
  type MarkerShape,
} from "@/figures/kit";
import styles from "./styles";

export interface ChartPoint {
  x: number;
  y: number | null;
  /** The 95% interval, drawn as a whisker at the crosshair. */
  low?: number | null;
  high?: number | null;
}

export interface ChartSeries {
  id: string;
  label: string;
  /** A CSS colour: one of the kit's series, or REFERENCE.color. */
  color: string;
  shape: MarkerShape | null;
  dashed?: boolean;
  /** Open markers: the second of two sets of weights, or the run before the fix, in the same hue. */
  hollow?: boolean;
  points: ChartPoint[];
}

export interface ChartPanel {
  id: string;
  title: ReactNode;
  series: ChartSeries[];
  y: { domain: readonly [number, number]; ticks: readonly number[]; format: (value: number) => string };
  /** Horizontal levels drawn dashed: chance, slope 1. */
  levels?: { value: number; label: string }[];
  /** Drawn instead of the plot: a run in progress has no line to draw. */
  empty?: ReactNode;
  /** Its own x-axis, when the panels do not share one. */
  x?: XAxis;
}

export interface XAxis {
  domain: readonly [number, number];
  ticks: readonly number[];
  format: (value: number) => string;
}

interface PanelsProps {
  panels: ChartPanel[];
  x: XAxis;
  /** What the x-axis measures, printed once under the panels. */
  xLabel: string;
  /** The x positions the crosshair stops at, in order. Empty: no crosshair. */
  stops: readonly number[];
  active: number | null;
  onActive: (index: number | null) => void;
  /** Panels side by side from this container width on. */
  columns?: number;
  height?: number;
  /** Names the group of panels for a screen reader, and says how to use it. */
  label: string;
}

const MARGIN = { top: 10, right: 14, bottom: 30, left: 42 };
const DEFAULT_WIDTH = 640;

/** Y ticks for shares: 0 to 100%. */
export const SHARE_AXIS = {
  domain: [0, 1] as const,
  ticks: [0, 0.25, 0.5, 0.75, 1] as const,
  format: (value: number) => `${Math.round(value * 100)}%`,
};

/** A y-axis that holds every value and the given levels, on round ticks. */
export function fittedAxis(values: (number | null | undefined)[], include: number[], format: (value: number) => string) {
  const finite = [...values.filter((value): value is number => typeof value === "number" && Number.isFinite(value)), ...include];
  const low = Math.min(...finite);
  const high = Math.max(...finite);
  const ticks = niceTicks(low, high, 4);
  const step = ticks.length > 1 ? ticks[1] - ticks[0] : 1;
  const first = ticks[0] > low ? ticks[0] - step : ticks[0];
  const last = ticks[ticks.length - 1] < high ? ticks[ticks.length - 1] + step : ticks[ticks.length - 1];
  return { domain: [first, last] as const, ticks: niceTicks(first, last, 4), format };
}

function Panel({
  panel,
  x: sharedX,
  width,
  height,
  stops,
  active,
  onPick,
  showXAxis,
}: {
  panel: ChartPanel;
  x: XAxis;
  width: number;
  height: number;
  stops: readonly number[];
  active: number | null;
  onPick: (index: number | null) => void;
  showXAxis: boolean;
}) {
  const xAxis = panel.x ?? sharedX;
  const bottom = showXAxis ? MARGIN.bottom : 10;
  const x = scaleLinear(xAxis.domain, [MARGIN.left, width - MARGIN.right]);
  const y = scaleLinear(panel.y.domain, [height - bottom, MARGIN.top]);
  const activeX = active !== null && !panel.x ? stops[active] : null;

  const pick = (event: PointerEvent<SVGSVGElement>) => {
    if (stops.length === 0 || panel.x) return;
    const box = event.currentTarget.getBoundingClientRect();
    const value = x.invert(((event.clientX - box.left) / box.width) * width);
    let best = 0;
    stops.forEach((stop, index) => {
      if (Math.abs(stop - value) < Math.abs(stops[best] - value)) best = index;
    });
    onPick(best);
  };

  return (
    <div className={styles.panel}>
      <p className={styles.panelTitle}>{panel.title}</p>
      {panel.empty ? (
        <div className={`${styles.facetEmpty} ${styles.hatched}`} style={{ height }}>
          {panel.empty}
        </div>
      ) : (
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          aria-hidden="true"
          focusable="false"
          onPointerMove={pick}
          onPointerDown={pick}
        >
          <GridLines scale={y} orientation="horizontal" extent={[MARGIN.left, width - MARGIN.right]} ticks={panel.y.ticks} />
          <Axis scale={y} orientation="left" offset={MARGIN.left} ticks={panel.y.ticks} format={panel.y.format} />
          {showXAxis ? (
            <Axis scale={x} orientation="bottom" offset={height - bottom} ticks={xAxis.ticks} format={xAxis.format} />
          ) : (
            <line
              x1={MARGIN.left}
              x2={width - MARGIN.right}
              y1={height - bottom}
              y2={height - bottom}
              stroke="var(--border-strong)"
              shapeRendering="crispEdges"
            />
          )}

          {(panel.levels ?? []).map((level) => (
            <g key={level.label}>
              <line
                x1={MARGIN.left}
                x2={width - MARGIN.right}
                y1={y(level.value)}
                y2={y(level.value)}
                stroke={REFERENCE.color}
                strokeDasharray={REFERENCE.dash}
                strokeWidth={1}
              />
              <text x={width - MARGIN.right} y={y(level.value) - 4} textAnchor="end" className="fig-axis-text">
                {level.label}
              </text>
            </g>
          ))}

          {activeX !== null ? (
            <line
              x1={x(activeX)}
              x2={x(activeX)}
              y1={MARGIN.top}
              y2={height - bottom}
              stroke="var(--text-faint)"
              strokeWidth={1}
            />
          ) : null}

          {panel.series.map((series) => {
            const defined = series.points.filter((point) => point.y !== null);
            const current =
              activeX === null ? undefined : defined.find((point) => Math.abs(point.x - activeX) < 1e-9);
            return (
              <g key={series.id}>
                <path
                  d={linePath(
                    series.points,
                    (point) => x(point.x),
                    (point) => y(point.y ?? 0),
                    { defined: (point) => point.y !== null },
                  )}
                  fill="none"
                  stroke={series.color}
                  strokeWidth={2}
                  strokeDasharray={series.dashed ? REFERENCE.dash : undefined}
                  strokeLinejoin="round"
                />
                {/* The 95% interval of every success rate, thin; the one at the crosshair is drawn bold below. */}
                {defined.map((point) =>
                  point.low !== undefined && point.low !== null && point.high !== undefined && point.high !== null ? (
                    <line
                      key={`ci-${point.x}`}
                      x1={x(point.x)}
                      x2={x(point.x)}
                      y1={y(point.low)}
                      y2={y(point.high)}
                      stroke={series.color}
                      strokeWidth={1}
                      strokeOpacity={0.7}
                    />
                  ) : null,
                )}
                {series.shape
                  ? defined.map((point) => (
                      <Marker
                        key={point.x}
                        shape={series.shape ?? "circle"}
                        x={x(point.x)}
                        y={y(point.y ?? 0)}
                        color={series.color}
                        hollow={series.hollow}
                      />
                    ))
                  : null}
                {current && current.low !== undefined && current.low !== null && current.high !== undefined && current.high !== null ? (
                  <line
                    x1={x(current.x)}
                    x2={x(current.x)}
                    y1={y(current.low)}
                    y2={y(current.high)}
                    stroke={series.color}
                    strokeWidth={2}
                  />
                ) : null}
                {current ? (
                  <Marker
                    shape={series.shape ?? "circle"}
                    x={x(current.x)}
                    y={y(current.y ?? 0)}
                    size={12}
                    color={series.color}
                    hollow={series.hollow}
                  />
                ) : null}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

/** The panels, laid out in one column or several, with one crosshair across them. */
export function Panels({
  panels,
  x,
  xLabel,
  stops,
  active,
  onActive,
  columns = 1,
  height = 150,
  label,
}: PanelsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { width: measured } = useElementSize(ref);
  const total = measured || DEFAULT_WIDTH;
  const shown = total < 520 ? 1 : Math.min(columns, panels.length);
  const gap = 24;
  const width = Math.max(200, Math.floor((total - gap * (shown - 1)) / shown));
  const interactive = stops.length > 0;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const last = stops.length - 1;
    let next: number | null | undefined;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") next = active === null ? 0 : Math.min(last, active + 1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = active === null ? last : Math.max(0, active - 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else if (event.key === "Escape") next = null;
    if (next === undefined) return;
    event.preventDefault();
    onActive(next);
  };

  return (
    <div>
      <div
        ref={ref}
        role="group"
        aria-label={label}
        tabIndex={interactive ? 0 : undefined}
        onKeyDown={onKeyDown}
        className={styles.panels}
        style={{ gridTemplateColumns: `repeat(${shown}, minmax(0, 1fr))` }}
      >
        {panels.map((panel, index) => (
          <Panel
            key={panel.id}
            panel={panel}
            x={x}
            width={width}
            height={height}
            stops={stops}
            active={active}
            onPick={onActive}
            showXAxis={Boolean(panel.x) || shown > 1 || index === panels.length - 1}
          />
        ))}
      </div>
      <p className={styles.xLabel}>{xLabel}</p>
    </div>
  );
}

/** The sorted x positions of every point of the given series, without repeats. */
export function stopsOf(series: ChartSeries[]): number[] {
  const all = new Set<number>();
  for (const entry of series) for (const point of entry.points) if (point.y !== null) all.add(point.x);
  return [...all].sort((a, b) => a - b);
}

/** An x-axis in millions of training samples, from 0 to the largest value. */
export function samplesAxis(maxMillions: number): XAxis {
  const ticks = niceTicks(0, maxMillions, 5);
  const step = ticks.length > 1 ? ticks[1] - ticks[0] : 1;
  const last = ticks[ticks.length - 1] < maxMillions ? ticks[ticks.length - 1] + step : ticks[ticks.length - 1];
  return {
    domain: [0, last],
    ticks: niceTicks(0, last, 5),
    format: (value: number) => (value === 0 ? "0" : `${value}M`),
  };
}
