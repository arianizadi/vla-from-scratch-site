"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { setup } from "@/data/notebook";
import { formatPercent } from "@/data/format";
import type { Weights } from "@/data/types";
import { Axis, GridLines, Marker, REFERENCE, linePath, niceTicks, scaleLinear } from "@/figures/kit";
import {
  MEASURES,
  SLOPE_MARK,
  SUCCESS_MARK,
  measureOf,
  revealedRows,
  sameStop,
  standAt,
  type Lead,
  type MeasureId,
  type OnsetGroup,
  type OnsetRun,
  type Stop,
} from "./model";

export interface DrawnRun {
  run: OnsetRun;
  /** Its place among the runs turned on (how many may be drawn at once); its look is `run.style`. */
  slot: number;
}

export interface ChartProps {
  group: OnsetGroup;
  runs: readonly DrawnRun[];
  weights: Weights;
  /** Where the cursor stands, in training samples: each run is drawn up to its last checkpoint at or before it. */
  cursor: number;
  /** The stop the cursor is at (the last one at or before it). */
  stop: Stop | undefined;
  /** The run whose slope reached its mark longest before its success did, among the drawn ones. */
  lead: Lead | undefined;
  /** Width of the stage in px; 0 until measured. */
  width: number;
  /** The reader pressed or dragged on the chart: move the cursor to this stop. */
  onScrub: (index: number) => void;
  /** Text alternative of the drawing in its current state. */
  label: string;
}

const MILLION = 1e6;
const CHANCE = setup.chance.percent / 100;
const SHARE_TICKS = [0, 0.5, 1];
const SLOPE_TICKS = [0, 0.5, 1];

/** Line-end labels: drawn while at most this many runs are, and the stage is wide enough for their column. */
export const DIRECT_LABELS_MAX = 4;
const DIRECT_LABELS_MIN_WIDTH = 600;
/** Approximate advance of a 13px label character (Archivo, 88% wide), for sizing the label column. */
const CHAR_PX = 6.6;
const LABEL_LINE = 15;
/** A label longer than this breaks onto a second line at a comma. */
const LABEL_WRAP = 24;
/** A touch has to move this far sideways before it scrubs; a vertical move is the page scrolling. */
const TOUCH_SLOP = 8;

/** Text for a value on a panel's axis. */
function tickText(measure: MeasureId, value: number): string {
  if (measure === "slope") return value === 0 ? "0" : String(value);
  return `${Math.round(value * 100)}%`;
}

/** A short label on one or two lines, broken at the last comma that keeps the first line short. */
function wrapLabel(text: string): string[] {
  if (text.length <= LABEL_WRAP) return [text];
  const parts = text.split(", ");
  let first = parts[0];
  let index = 1;
  while (index < parts.length && `${first}, ${parts[index]}`.length <= LABEL_WRAP) {
    first = `${first}, ${parts[index]}`;
    index += 1;
  }
  return index < parts.length ? [`${first},`, parts.slice(index).join(", ")] : [first];
}

/**
 * Three panels on one training axis: the slope, the share of episodes that
 * closed at the named object, and success. One measure per panel, each with
 * its own y axis (DESIGN.md, section 9); the cursor runs through all three.
 * Each run is drawn up to its last checkpoint at or before the cursor and no
 * further: what the run did later is not known at that point of training.
 */
export function Chart({ group, runs, weights, cursor, stop, lead, width: measured, onScrub, label }: ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: number; touch: boolean; x: number; y: number; scrubbing: boolean } | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const width = measured || 640;
  const narrow = width < 520;

  // Labels at the line ends, in a column right of the panels (DESIGN.md, section 9).
  const labelled =
    runs.length > 0 && runs.length <= DIRECT_LABELS_MAX && width >= DIRECT_LABELS_MIN_WIDTH
      ? runs.map((entry) => ({ ...entry, lines: wrapLabel(entry.run.short) }))
      : [];
  const labelColumn =
    labelled.length > 0
      ? Math.min(
          Math.round(width * 0.3),
          Math.ceil(Math.max(...labelled.flatMap((entry) => entry.lines.map((line) => line.length))) * CHAR_PX) + 30,
        )
      : 0;

  const margin = { top: 2, right: labelColumn > 0 ? labelColumn : 14, bottom: 50, left: 46 };
  const titleHeight = 24;
  const plotHeight = Math.round(Math.min(132, Math.max(76, width * 0.17)));
  const gap = narrow ? 12 : 18;
  const panelHeight = titleHeight + plotHeight;
  const height = margin.top + MEASURES.length * panelHeight + (MEASURES.length - 1) * gap + margin.bottom;
  const plotBottom = (index: number) => margin.top + index * (panelHeight + gap) + panelHeight;
  const plotTop = (index: number) => plotBottom(index) - plotHeight;
  const firstTop = plotTop(0);
  const lastBottom = plotBottom(MEASURES.length - 1);
  const plotRight = width - margin.right;

  const xEnd = group.xMax / MILLION;
  const xTicks = niceTicks(0, xEnd, narrow ? 3 : 5).filter((tick) => tick <= xEnd + 1e-9);
  const x = scaleLinear([0, Math.max(xEnd, xTicks.at(-1) ?? xEnd)], [margin.left, plotRight]);
  const yOf = (measure: MeasureId, index: number) =>
    scaleLinear(measure === "slope" ? group.slopeDomain : [-0.04, 1.04], [plotBottom(index), plotTop(index)]);

  const cursorX = x(cursor / MILLION);
  const stopIndexAt = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg || group.stops.length === 0) return -1;
    const box = svg.getBoundingClientRect();
    const samples = x.invert(((clientX - box.left) / box.width) * width) * MILLION;
    let best = 0;
    group.stops.forEach((candidate, index) => {
      if (Math.abs(candidate.samples - samples) < Math.abs(group.stops[best].samples - samples)) best = index;
    });
    return best;
  };
  const scrubTo = (clientX: number) => {
    const index = stopIndexAt(clientX);
    if (index >= 0) onScrub(index);
  };

  // Mouse and pen scrub from the press. A touch scrubs only once it has moved sideways, so a
  // vertical scroll that starts on the chart scrolls the page and leaves the cursor where it was.
  const onPointerDown = (event: ReactPointerEvent<SVGRectElement>) => {
    const touch = event.pointerType === "touch";
    drag.current = { id: event.pointerId, touch, x: event.clientX, y: event.clientY, scrubbing: !touch };
    if (!touch) {
      event.currentTarget.setPointerCapture(event.pointerId);
      scrubTo(event.clientX);
    }
  };
  const onPointerMove = (event: ReactPointerEvent<SVGRectElement>) => {
    const state = drag.current;
    if (!state || state.id !== event.pointerId) {
      if (event.pointerType === "mouse") setHover(stopIndexAt(event.clientX));
      return;
    }
    if (!state.scrubbing) {
      const dx = Math.abs(event.clientX - state.x);
      const dy = Math.abs(event.clientY - state.y);
      if (dx < TOUCH_SLOP || dx < dy) return;
      state.scrubbing = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    scrubTo(event.clientX);
  };
  const onPointerUp = (event: ReactPointerEvent<SVGRectElement>) => {
    const state = drag.current;
    drag.current = null;
    // A tap (a touch that neither scrolled nor slid) moves the cursor too.
    if (state && state.touch && !state.scrubbing) scrubTo(event.clientX);
  };
  const endPointer = () => {
    drag.current = null;
  };

  const pill = stop ? stop.label : "";
  const pillAt = (atX: number, text: string) => {
    const pillWidth = text.length * 7.5 + 14;
    return { pillWidth, pillX: Math.min(Math.max(atX - pillWidth / 2, margin.left - 6), plotRight - pillWidth + 6) };
  };
  const { pillWidth, pillX } = pillAt(cursorX, pill);
  const hoverStop = hover !== null && group.stops[hover] && group.stops[hover] !== stop ? group.stops[hover] : undefined;

  // Line-end labels on the success panel, at the height of each run's last drawn value, kept apart.
  const rateIndex = MEASURES.findIndex((measure) => measure.id === "rate");
  const yRate = yOf("rate", rateIndex);
  const placed = labelled
    .map((entry) => {
      const last = revealedRows(entry.run, weights, cursor).at(-1);
      const value = measureOf(last?.[weights] ?? null, "rate");
      return value === null ? null : { ...entry, want: yRate(value) - ((entry.lines.length - 1) * LABEL_LINE) / 2 };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => a.want - b.want);
  {
    const top = plotTop(rateIndex) + 4;
    const bottom = plotBottom(rateIndex) + 8;
    let next = top;
    for (const entry of placed) {
      entry.want = Math.max(entry.want, next);
      next = entry.want + entry.lines.length * LABEL_LINE + 3;
    }
    // Pushed past the bottom: move the stack up as far as it overflows.
    let limit = bottom;
    for (let index = placed.length - 1; index >= 0; index -= 1) {
      const entry = placed[index];
      const span = (entry.lines.length - 1) * LABEL_LINE;
      if (entry.want + span > limit) entry.want = limit - span;
      limit = entry.want - LABEL_LINE - 3;
    }
  }

  // Where the slope reached its mark before success reached its own, for one run.
  const leadSlopeIndex = MEASURES.findIndex((measure) => measure.id === "slope");
  const leadMarks = lead
    ? {
        slopeX: x(lead.slope.samples / MILLION),
        slopeY: yOf("slope", leadSlopeIndex)(lead.slope[weights]?.slope ?? 0),
        successX: lead.success ? x(lead.success.samples / MILLION) : null,
        successY: lead.success ? yRate(lead.success[weights]?.rate ?? 0) : null,
      }
    : null;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="onset-chart block h-auto w-full"
      role="img"
      aria-label={label}
    >
      {MEASURES.map((measure, index) => {
        const y = yOf(measure.id, index);
        const ticks = measure.kind === "share" ? SHARE_TICKS : SLOPE_TICKS;
        const titleY = plotTop(index) - 9;
        return (
          <g key={measure.id}>
            <text x={4} y={titleY} className="onset-panel-title">
              {measure.label}
              {narrow ? null : <tspan className="onset-panel-hint">{`  ${measure.hint}`}</tspan>}
            </text>
            <GridLines scale={y} orientation="horizontal" extent={[margin.left, plotRight]} ticks={ticks} />
            <GridLines scale={x} orientation="vertical" extent={[plotTop(index), plotBottom(index)]} ticks={xTicks} />
            <Axis
              scale={y}
              orientation="left"
              offset={margin.left}
              ticks={ticks}
              format={(value) => tickText(measure.id, value)}
              tickSize={0}
              hideLine
            />
            <line
              x1={margin.left}
              x2={plotRight}
              y1={plotBottom(index)}
              y2={plotBottom(index)}
              stroke="var(--border-strong)"
              strokeWidth={1}
              shapeRendering="crispEdges"
            />
            {measure.id === "named" ? (
              <g aria-hidden="true">
                <line
                  x1={margin.left}
                  x2={plotRight}
                  y1={y(CHANCE)}
                  y2={y(CHANCE)}
                  stroke={REFERENCE.color}
                  strokeWidth={1.5}
                  strokeDasharray={REFERENCE.dash}
                />
                <text x={plotRight - 2} y={y(CHANCE) - 5} textAnchor="end" className="fig-axis-text onset-halo">
                  {`chance ${formatPercent(CHANCE)}`}
                </text>
              </g>
            ) : null}
          </g>
        );
      })}

      <Axis
        scale={x}
        orientation="bottom"
        offset={lastBottom}
        ticks={xTicks}
        format={(value) => (value === 0 ? "0" : `${value}M`)}
        label="Training samples"
        hideLine
      />

      {/* The lead: 1px leaders ending in a 3px dot at the two checkpoints (DESIGN.md, section 9). */}
      {leadMarks ? (
        <g aria-hidden="true" className="onset-lead-marks">
          <line
            x1={leadMarks.slopeX}
            x2={leadMarks.slopeX}
            y1={leadMarks.slopeY}
            y2={lastBottom}
            stroke="var(--text-faint)"
            strokeWidth={1}
            strokeDasharray="2 3"
            shapeRendering="crispEdges"
          />
          <circle cx={leadMarks.slopeX} cy={leadMarks.slopeY} r={3} fill="var(--text-faint)" />
          <text
            x={leadMarks.slopeX - 5}
            y={plotTop(rateIndex) + 12}
            textAnchor="end"
            className="fig-axis-text onset-halo"
          >
            {`slope ${SLOPE_MARK}`}
          </text>
          {leadMarks.successX !== null && leadMarks.successY !== null ? (
            <>
              <line
                x1={leadMarks.successX}
                x2={leadMarks.successX}
                y1={leadMarks.successY}
                y2={lastBottom}
                stroke="var(--text-faint)"
                strokeWidth={1}
                strokeDasharray="2 3"
                shapeRendering="crispEdges"
              />
              <circle cx={leadMarks.successX} cy={leadMarks.successY} r={3} fill="var(--text-faint)" />
              <text
                x={leadMarks.successX + 5}
                y={plotTop(rateIndex) + 12}
                textAnchor="start"
                className="fig-axis-text onset-halo"
              >
                {`success ${formatPercent(SUCCESS_MARK)}`}
              </text>
            </>
          ) : null}
        </g>
      ) : null}

      {runs.map(({ run }) => {
        const rows = revealedRows(run, weights, cursor);
        return (
          <g key={run.name}>
            {MEASURES.map((measure, index) => {
              const y = yOf(measure.id, index);
              const points = rows.map((row) => ({ at: row.samples / MILLION, value: measureOf(row[weights], measure.id) }));
              // Two checkpoints of one stop (a checkpoint and the final one just after it) are not
              // joined: a segment between them would read as a drop within a few thousand samples.
              const path = rows.flatMap((row, rowIndex) => {
                const point = points[rowIndex];
                const previous = rows[rowIndex - 1];
                return previous && sameStop(previous.samples, row.samples) ? [{ at: point.at, value: null }, point] : [point];
              });
              return (
                <g key={measure.id}>
                  <path
                    d={linePath(
                      path,
                      (point) => x(point.at),
                      (point) => y(point.value ?? Number.NaN),
                      { defined: (point) => point.value !== null },
                    )}
                    fill="none"
                    stroke={run.style.color}
                    strokeWidth={2}
                    strokeDasharray={run.style.dash}
                    strokeLinejoin="round"
                    strokeLinecap={run.style.dash ? "butt" : "round"}
                  />
                  {/* Success is a rate: each point carries its 95% interval, thin (DESIGN.md, section 9). */}
                  {measure.id === "rate"
                    ? rows.map((row) => {
                        const evaluation = row[weights];
                        if (!evaluation) return null;
                        const px = x(row.samples / MILLION);
                        return (
                          <line
                            key={`ci-${row.samples}`}
                            x1={px}
                            x2={px}
                            y1={y(evaluation.ci[0])}
                            y2={y(evaluation.ci[1])}
                            stroke={run.style.color}
                            strokeWidth={1}
                            strokeOpacity={0.7}
                          />
                        );
                      })
                    : null}
                  {points.map((point) =>
                    point.value === null ? null : (
                      <Marker
                        key={point.at}
                        shape={run.style.shape}
                        x={x(point.at)}
                        y={y(point.value)}
                        color={run.style.color}
                        hollow={run.style.hollow}
                      />
                    ),
                  )}
                </g>
              );
            })}
          </g>
        );
      })}

      {placed.length > 0 ? (
        <g aria-hidden="true">
          {placed.map((entry) => (
            <g key={entry.run.name} transform={`translate(${plotRight + 12},${entry.want})`}>
              <Marker
                shape={entry.run.style.shape}
                x={5}
                y={-4}
                size={10}
                color={entry.run.style.color}
                hollow={entry.run.style.hollow}
                ring={false}
              />
              <text x={15} y={0} className="onset-end-label">
                {entry.lines.map((line, index) => (
                  <tspan key={index} x={15} dy={index === 0 ? 0 : LABEL_LINE}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          ))}
        </g>
      ) : null}

      {hoverStop ? (
        <g aria-hidden="true" pointerEvents="none">
          <line
            x1={x(hoverStop.samples / MILLION)}
            x2={x(hoverStop.samples / MILLION)}
            y1={firstTop - 4}
            y2={lastBottom}
            stroke="var(--text-faint)"
            strokeWidth={1}
            strokeDasharray="3 3"
            shapeRendering="crispEdges"
          />
          {(() => {
            const at = pillAt(x(hoverStop.samples / MILLION), hoverStop.label);
            return (
              <g transform={`translate(${at.pillX},${lastBottom + 6})`}>
                <rect width={at.pillWidth} height={22} rx={2} fill="var(--surface)" stroke="var(--border-strong)" strokeWidth={1} />
                <text x={at.pillWidth / 2} y={15} textAnchor="middle" className="onset-pill-text onset-pill-ghost">
                  {hoverStop.label}
                </text>
              </g>
            );
          })()}
        </g>
      ) : null}

      {stop ? (
        <g aria-hidden="true">
          <line
            x1={cursorX}
            x2={cursorX}
            y1={firstTop - 4}
            y2={lastBottom}
            stroke="var(--text-muted)"
            strokeWidth={1}
            shapeRendering="crispEdges"
          />
          {/* The checkpoints evaluated at this stop, larger; success with its 95% interval. */}
          {runs.map(({ run }) =>
            MEASURES.map((measure, index) => {
              const at = standAt(run, weights, cursor, stop);
              if (!at || !at.here) return null;
              const value = measureOf(at.evaluation, measure.id);
              if (value === null) return null;
              const y = yOf(measure.id, index);
              const px = x(at.row.samples / MILLION);
              return (
                <g key={`${run.name}-${measure.id}`}>
                  {measure.id === "rate" ? (
                    <line
                      x1={px}
                      x2={px}
                      y1={y(at.evaluation.ci[0])}
                      y2={y(at.evaluation.ci[1])}
                      stroke={run.style.color}
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  ) : null}
                  <Marker
                    shape={run.style.shape}
                    x={px}
                    y={y(value)}
                    size={12}
                    color={run.style.color}
                    hollow={run.style.hollow}
                  />
                </g>
              );
            }),
          )}
          <g transform={`translate(${pillX},${lastBottom + 6})`}>
            <rect width={pillWidth} height={22} rx={2} fill="var(--mark)" stroke="var(--text)" strokeWidth={1} />
            <text x={pillWidth / 2} y={15} textAnchor="middle" className="onset-pill-text">
              {pill}
            </text>
          </g>
        </g>
      ) : null}

      {/* Press or drag anywhere on the panels to move the cursor to the nearest checkpoint. */}
      <rect
        x={margin.left}
        y={firstTop - 4}
        width={Math.max(0, plotRight - margin.left)}
        height={lastBottom - firstTop + 4}
        fill="transparent"
        className="onset-scrub"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={endPointer}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") setHover(null);
        }}
      />
    </svg>
  );
}
