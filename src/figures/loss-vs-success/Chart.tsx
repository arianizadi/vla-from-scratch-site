"use client";

import { useId, useMemo, useRef, type PointerEvent } from "react";
import { formatBudget, formatCount, formatPercent } from "@/data/format";
import type { Weights } from "@/data/types";
import { Axis, GridLines, Marker, linePath, niceTicks, scaleLinear, tickStep } from "@/figures/kit";
import {
  LOSS_COLOR,
  describe,
  evaluationAt,
  formatLoss,
  interval,
  nearestStop,
  type RunModel,
} from "./model";

/** Below this stage width the panels are lower and the axes carry fewer ticks. Matches the `@[500px]` classes. */
export const NARROW = 500;

/** Geometry of the drawing for a stage width; its two heights are the SVG's CSS heights below. */
function geometry(width: number) {
  const narrow = width < NARROW;
  const lossTop = 26;
  const lossBottom = lossTop + (narrow ? 104 : 150);
  const successTop = lossBottom + 44;
  const axisY = successTop + (narrow ? 150 : 190);
  return { narrow, left: 42, right: width - 16, lossTop, lossBottom, successTop, axisY, height: axisY + 54 };
}

/** How far a marker stands to the side of its checkpoint, so the two sets of weights do not cover each other. */
const SIDE = 4.5;
/** A pointer this close to a checkpoint lands on it. */
const MAGNET = 6;
/** Opacity of what the scrubber has not reached yet: faint, still legible. */
const AHEAD = 0.35;
/** A touch has to travel this far sideways, and further than up or down, before it scrubs instead of scrolling. */
const TOUCH_SLOP = 8;
/** Loss tick labels closer than this are not drawn: they would overlap while the axis is stretching. */
const MIN_TICK_GAP = 14;
/** Approximate width of a character of 13px axis text, for placing labels. */
const CHAR = 7;

const HAIRLINE = { strokeWidth: 1, shapeRendering: "crispEdges" as const };
const FADE = { transition: "opacity var(--duration-micro) var(--ease-standard)" };
const HALO = { stroke: "var(--surface)", strokeWidth: 4, paintOrder: "stroke" as const, strokeLinejoin: "round" as const };

function lossTick(step: number): (value: number) => string {
  const decimals = Math.max(0, -Math.floor(Math.log10(step)));
  return (value) => (value === 0 ? "0" : value.toFixed(decimals));
}

interface Point {
  kind: Weights;
  index: number;
  x: number;
  y: number;
  low: number;
  high: number;
}

/** Consecutive runs of points, broken where a checkpoint lacks this set of weights. */
function segments(points: (Point | null)[]): Point[][] {
  const out: Point[][] = [];
  let current: Point[] = [];
  for (const point of points) {
    if (point) current.push(point);
    else if (current.length) {
      out.push(current);
      current = [];
    }
  }
  if (current.length) out.push(current);
  return out;
}

export interface ChartProps {
  model: RunModel;
  /** Index of the stop the scrubber is at. */
  at: number;
  /** Top of the loss axis; it changes frame by frame while the axis is being magnified. */
  lossMax: number;
  /**
   * Where the top of the loss axis is going (equal to `lossMax` at rest). Its
   * ticks are the ones drawn, sliding with the axis while it stretches.
   */
  lossTarget: number;
  /** Width of the stage in CSS pixels. */
  width: number;
  /**
   * False until the stage has been measured (and in the static HTML): `width`
   * is then a guess, and the drawing keeps its own proportions instead of the
   * heights that match the measured geometry.
   */
  measured: boolean;
  /** The reader pressed or dragged in the plot: move the scrubber to this stop. */
  onScrub: (stop: number) => void;
}

/**
 * The drawing: the training loss above, the closed-loop success of the
 * checkpoints below, on one axis of training samples. A hairline drops from
 * each checkpoint's place on the loss curve to its success markers, the way a
 * projection line joins one feature in two views of a drawing.
 *
 * The interval between the last two checkpoints the scrubber has reached is
 * shaded in both panels, so what success did there stands next to what the
 * loss did. What the scrubber has passed is drawn in full; what lies ahead
 * is faint.
 */
export function Chart({ model, at, lossMax, lossTarget, width, measured, onScrub }: ChartProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const svg = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  /** Where a touch went down, until it is known to be a scrub (sideways) or a scroll (up or down). */
  const touch = useRef<{ id: number; x: number; y: number } | null>(null);

  const plot = useMemo(() => {
    const g = geometry(width);
    const x = scaleLinear([0, model.xMax], [g.left, g.right]);
    const yLoss = scaleLinear([0, lossMax], [g.lossBottom, g.lossTop]);
    const ySuccess = scaleLinear([0, 1], [g.axisY, g.successTop]);

    const lossPath = linePath(
      model.curve,
      (point) => x(point[0]),
      (point) => yLoss(point[1]),
    );

    // Where the curve comes into the panel: its first point, or the place it crosses the top of a magnified axis.
    const inside = model.curve.findIndex((point) => point[1] <= lossMax);
    let entry = { x: x(model.curve[0][0]), y: yLoss(model.curve[0][1]), clipped: false };
    if (inside > 0) {
      const [x0, loss0] = model.curve[inside - 1];
      const [x1, loss1] = model.curve[inside];
      entry = { x: x(x0 + ((loss0 - lossMax) / (loss0 - loss1)) * (x1 - x0)), y: g.lossTop, clipped: true };
    }

    const marks = model.rows.map((row, index) => {
      const cx = x(row.samples);
      const bead = yLoss(model.stops[model.checkpointStops[index]].loss);
      const points = model.weights.map((kind): Point | null => {
        const evaluation = evaluationAt(row, kind);
        if (!evaluation) return null;
        return {
          kind,
          index,
          x: cx + (model.weights.length > 1 ? model.styles[kind].side * SIDE : 0),
          y: ySuccess(evaluation.rate),
          low: ySuccess(evaluation.ci[0]),
          high: ySuccess(evaluation.ci[1]),
        };
      });
      return { cx, bead, beadShown: bead >= g.lossTop - 0.5, points };
    });

    const series = model.weights.map((kind, position) => ({
      kind,
      lines: segments(marks.map((mark) => mark.points[position])),
    }));

    // The ticks of the axis's destination, moved by the current scale: while the axis stretches they
    // slide with it, and those still above its top, or packed too close to read, are left out.
    const tickCount = g.narrow ? 3 : 4;
    const lossStep = tickStep(0, lossTarget, tickCount);
    const lossTicks =
      yLoss(0) - yLoss(lossStep) < MIN_TICK_GAP
        ? [0]
        : niceTicks(0, lossTarget, tickCount).filter((value) => value <= lossMax * (1 + 1e-9));
    return {
      g,
      x,
      yLoss,
      ySuccess,
      lossPath,
      entry,
      marks,
      series,
      lossTicks,
      lossFormat: lossTick(lossStep),
      xTicks: x.ticks(g.narrow ? 4 : 6),
    };
  }, [model, width, lossMax, lossTarget]);

  const { g, x, yLoss, marks } = plot;
  const stop = model.stops[at];
  const reached = stop.reached;
  const cursorX = x(stop.samples);
  const cursorLoss = yLoss(stop.loss);
  const lossOnAxis = cursorLoss >= g.lossTop - 0.5;
  const current = reached > 0 ? marks[reached - 1] : null;

  // The interval the readout compares, shaded in both panels.
  const span = interval(model, at);
  const bandFrom = x(span.from.samples);
  const bandTo = x(span.to.samples);
  const fromLoss = yLoss(span.from.loss);
  const toLoss = yLoss(span.to.loss);

  // The tag on the sample axis is written like the axis's ticks.
  const tagText = formatBudget(stop.samples);
  const tagWidth = Math.round(tagText.length * CHAR + 14);
  const tagX = Math.min(Math.max(cursorX, g.left - 12 + tagWidth / 2), width - 1 - tagWidth / 2);

  const scrub = (event: PointerEvent<SVGRectElement>) => {
    const box = svg.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    const position = ((event.clientX - box.left) / box.width) * width;
    let target = nearestStop(model.stops, x.invert(Math.min(Math.max(position, g.left), g.right)));
    let nearest = MAGNET;
    marks.forEach((mark, index) => {
      const distance = Math.abs(mark.cx - position);
      if (distance <= nearest) {
        nearest = distance;
        target = model.checkpointStops[index];
      }
    });
    onScrub(target);
  };

  // The count beside each marker of the checkpoint the readout is about (DESIGN.md, section 9): on the
  // marker's own side, flipped inward at the edges of the plot, and spread apart when both land on one side.
  const counts = (current?.points ?? []).flatMap((point) => {
    const evaluation = point ? evaluationAt(model.rows[point.index], point.kind) : null;
    if (!point || !evaluation) return [];
    const text = formatCount(evaluation.successes, evaluation.episodes);
    const textWidth = text.length * CHAR;
    const cx = current!.cx;
    let side: -1 | 1 = model.weights.length > 1 ? model.styles[point.kind].side : 1;
    if (side === 1 && cx + SIDE + 14 + textWidth > width - 2) side = -1;
    if (side === -1 && cx - SIDE - 14 - textWidth < 2) side = 1;
    return [{ kind: point.kind, text, side, x: cx + side * (SIDE + 14), y: point.y }];
  });
  if (counts.length === 2 && counts[0].side === counts[1].side && Math.abs(counts[0].y - counts[1].y) < 16) {
    const [upper, lower] = counts[0].y <= counts[1].y ? counts : [counts[1], counts[0]];
    const middle = (upper.y + lower.y) / 2;
    upper.y = middle - 8;
    lower.y = middle + 8;
  }
  for (const count of counts) count.y = Math.min(Math.max(count.y, g.successTop + 6), g.axisY - 6);

  const pathOf = (points: Point[]) =>
    linePath(
      points,
      (point) => point.x,
      (point) => point.y,
    );

  return (
    <svg
      ref={svg}
      viewBox={`0 0 ${width} ${g.height}`}
      role="img"
      aria-label={describe(model)}
      // Measured, the CSS heights are the geometry's heights (narrow and wide), so 13px text stays 13px.
      // Unmeasured, the drawing keeps the proportions of its guessed width rather than being letterboxed.
      className={`block w-full select-none ${measured ? "h-[378px] @[500px]:h-[464px]" : "h-auto"}`}
      style={{ touchAction: "pan-y pinch-zoom" }}
    >
      <defs>
        <clipPath id={`${id}-loss`}>
          <rect x={g.left - 2} y={g.lossTop - 1} width={width - g.left + 2} height={g.lossBottom - g.lossTop + 3} />
        </clipPath>
        <clipPath id={`${id}-past`}>
          <rect x={0} y={0} width={Math.max(0, cursorX + 0.5)} height={g.height} />
        </clipPath>
      </defs>

      {/* The interval at the scrubber, in both panels. */}
      <g fill="var(--surface-2)">
        <rect x={bandFrom} y={g.lossTop} width={Math.max(0, bandTo - bandFrom)} height={g.lossBottom - g.lossTop} />
        <rect x={bandFrom} y={g.successTop} width={Math.max(0, bandTo - bandFrom)} height={g.axisY - g.successTop} />
      </g>

      {/* Scales. Each panel has one y-axis; the two share the axis of training samples. */}
      <GridLines scale={yLoss} orientation="horizontal" extent={[g.left, g.right]} ticks={plot.lossTicks} />
      <GridLines scale={plot.ySuccess} orientation="horizontal" extent={[g.left, g.right]} ticks={[0.25, 0.5, 0.75, 1]} />
      <line x1={g.left} x2={g.right} y1={g.lossBottom} y2={g.lossBottom} stroke="var(--border-strong)" {...HAIRLINE} />

      {/* Projection lines: one checkpoint, seen in both panels. */}
      <g>
        {marks.map((mark, index) => (
          <line
            key={index}
            x1={mark.cx}
            x2={mark.cx}
            y1={mark.beadShown ? mark.bead : g.lossTop}
            y2={g.axisY}
            stroke={index === reached - 1 ? "var(--text-faint)" : "var(--border)"}
            opacity={index < reached ? 1 : 0.6}
            {...HAIRLINE}
          />
        ))}
      </g>

      <Axis
        scale={yLoss}
        orientation="left"
        offset={g.left}
        ticks={plot.lossTicks}
        format={plot.lossFormat}
        label="Training loss"
        tickSize={0}
        hideLine
      />
      <Axis
        scale={plot.ySuccess}
        orientation="left"
        offset={g.left}
        ticks={[0, 0.25, 0.5, 0.75, 1]}
        format={formatPercent}
        label="Closed-loop success"
        tickSize={0}
        hideLine
      />
      <Axis
        scale={x}
        orientation="bottom"
        offset={g.axisY}
        ticks={plot.xTicks.filter((value) => Math.abs(x(value) - tagX) > tagWidth / 2 + 10)}
        format={(value) => (value === 0 ? "0" : formatBudget(value))}
      />
      <text x={(g.left + g.right) / 2} y={g.axisY + 46} textAnchor="middle" className="fig-axis-text fig-axis-label">
        Training samples seen
      </text>

      {/* The loss: faint over the whole run, in full up to the scrubber. */}
      <g clipPath={`url(#${id}-loss)`}>
        <path d={plot.lossPath} fill="none" stroke={LOSS_COLOR} strokeWidth={2} strokeLinejoin="round" opacity={AHEAD} />
        <g clipPath={`url(#${id}-past)`}>
          <path d={plot.lossPath} fill="none" stroke={LOSS_COLOR} strokeWidth={2} strokeLinejoin="round" />
        </g>
      </g>

      {/* Where the curve starts: on the axis, or above a magnified one. */}
      {plot.entry.clipped ? (
        <g>
          <line
            x1={plot.entry.x}
            x2={plot.entry.x + 10}
            y1={plot.entry.y}
            y2={plot.entry.y}
            stroke="var(--text-faint)"
            strokeWidth={1}
          />
          <circle cx={plot.entry.x} cy={plot.entry.y} r={1.5} fill="var(--text-faint)" />
          <text x={plot.entry.x + 14} y={plot.entry.y} dy="0.32em" className="fig-axis-text" style={HALO}>
            starts at {formatLoss(model.lossStart)}, above the axis
          </text>
        </g>
      ) : null}

      {/* What the loss did over the shaded interval: a dimension line from its value at one end to the other. */}
      {bandTo - bandFrom > 1 ? (
        <g>
          <line
            x1={bandFrom}
            x2={bandTo}
            y1={Math.max(fromLoss, g.lossTop)}
            y2={Math.max(fromLoss, g.lossTop)}
            stroke="var(--text-faint)"
            strokeDasharray="2 2"
            strokeWidth={1}
          />
          <line x1={bandTo} x2={bandTo} y1={Math.max(fromLoss, g.lossTop)} y2={toLoss} stroke="var(--text-faint)" strokeWidth={1} />
        </g>
      ) : null}

      {/* A bead on the loss curve where each checkpoint was saved. */}
      <g>
        {marks.map((mark, index) =>
          mark.beadShown ? (
            <circle
              key={index}
              cx={mark.cx}
              cy={mark.bead}
              r={3.5}
              fill="var(--surface)"
              stroke={LOSS_COLOR}
              strokeWidth={1.5}
              opacity={index < reached ? 1 : AHEAD + 0.15}
              style={FADE}
            />
          ) : null,
        )}
      </g>

      {/* Success of the checkpoints. Success is known only where a checkpoint was evaluated, so the guides
          that join one set of weights are thin, dashed and muted: they say which dots belong together, not
          what happened in between. Then the whiskers, then the markers. */}
      <g>
        {plot.series.map(({ kind, lines }) => (
          <g key={kind} fill="none" stroke="var(--border-strong)" strokeWidth={1} strokeDasharray="3 3">
            {lines.map((points, index) => (
              <path key={index} d={pathOf(points)} />
            ))}
          </g>
        ))}

        {/* The highlighter under the checkpoint the readout is about. */}
        {current ? (
          <>
            {current.points.map((point) =>
              point ? <circle key={`ring-${point.kind}`} cx={point.x} cy={point.y} r={9} fill="var(--text)" /> : null,
            )}
            {current.points.map((point) =>
              point ? <circle key={`mark-${point.kind}`} cx={point.x} cy={point.y} r={8} fill="var(--mark)" /> : null,
            )}
          </>
        ) : null}

        {marks.map((mark, index) => (
          <g key={index} opacity={index < reached ? 1 : AHEAD} style={FADE}>
            {mark.points.map((point) =>
              point ? (
                <path
                  key={point.kind}
                  d={`M${point.x},${point.low}V${point.high}M${point.x - 3},${point.low}h6M${point.x - 3},${point.high}h6`}
                  fill="none"
                  stroke={model.styles[point.kind].color}
                  strokeWidth={1.5}
                />
              ) : null,
            )}
            {mark.points.map((point) =>
              point ? (
                <Marker
                  key={point.kind}
                  shape={model.styles[point.kind].shape}
                  x={point.x}
                  y={point.y}
                  color={model.styles[point.kind].color}
                  hollow={model.styles[point.kind].hollow}
                />
              ) : null,
            )}
          </g>
        ))}

        {counts.map((count) => (
          <text
            key={count.kind}
            x={count.x}
            y={count.y}
            dy="0.32em"
            textAnchor={count.side === 1 ? "start" : "end"}
            className="fig-axis-text"
            style={{ ...HALO, fill: "var(--text)", fontWeight: 600 }}
          >
            {count.text}
          </text>
        ))}
      </g>

      {/* The scrubber: a line through both panels, the loss it reads, and its place on the sample axis. */}
      <g>
        <line x1={cursorX} x2={cursorX} y1={g.lossTop - 6} y2={g.axisY + 8} stroke="var(--text)" {...HAIRLINE} />
        {lossOnAxis ? (
          <>
            <circle cx={cursorX} cy={cursorLoss} r={8} fill="var(--mark)" stroke="var(--text)" strokeWidth={1} />
            <circle cx={cursorX} cy={cursorLoss} r={3.5} fill="var(--on-mark)" />
          </>
        ) : (
          <path
            d={`M${cursorX - 5},${g.lossTop + 7}L${cursorX},${g.lossTop - 1}L${cursorX + 5},${g.lossTop + 7}z`}
            fill="var(--mark)"
            stroke="var(--text)"
            strokeWidth={1}
            strokeLinejoin="round"
          />
        )}
        <rect
          x={tagX - tagWidth / 2}
          y={g.axisY + 8}
          width={tagWidth}
          height={19}
          rx={2}
          fill="var(--mark)"
          stroke="var(--text)"
          strokeWidth={1}
        />
        <text
          x={tagX}
          y={g.axisY + 17.5}
          dy="0.34em"
          textAnchor="middle"
          className="fig-axis-text"
          style={{ fill: "var(--on-mark)", fontWeight: 600 }}
        >
          {tagText}
        </text>
      </g>

      {/* Press or drag anywhere in the plot to move the scrubber. Keyboard: the Samples slider and the checkpoint stepper. */}
      <rect
        x={g.left - 12}
        y={g.lossTop - 6}
        width={width - g.left + 12}
        height={g.axisY + 34 - g.lossTop}
        fill="transparent"
        style={{ cursor: "ew-resize", touchAction: "pan-y pinch-zoom" }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          if (event.pointerType === "touch") {
            // A touch may be the start of a page scroll: wait to see which way it goes.
            touch.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
            return;
          }
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          dragging.current = true;
          scrub(event);
        }}
        onPointerMove={(event) => {
          const start = touch.current;
          if (start && start.id === event.pointerId && !dragging.current) {
            const dx = Math.abs(event.clientX - start.x);
            const dy = Math.abs(event.clientY - start.y);
            if (dx < TOUCH_SLOP || dx <= dy) return;
            touch.current = null;
            event.currentTarget.setPointerCapture(event.pointerId);
            dragging.current = true;
          }
          if (dragging.current) scrub(event);
        }}
        onPointerUp={(event) => {
          // A tap that did not move moves the scrubber where it landed.
          const start = touch.current;
          if (start && start.id === event.pointerId) {
            const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y);
            if (moved < TOUCH_SLOP) scrub(event);
          }
          touch.current = null;
          dragging.current = false;
        }}
        onPointerCancel={() => {
          touch.current = null;
          dragging.current = false;
        }}
      />
    </svg>
  );
}
