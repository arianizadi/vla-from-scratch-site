"use client";

import { useId } from "react";
import { Axis, linePath } from "@/figures/kit";
import { arrowHead, clipToPlot, equalAspectPlot, HALO, inside, svgId, type Plot } from "./geometry";
import { CHANGE_MARK, LEVELS, MINIMUM, MINIMUM_LOSS, change, contour, loss, lossDigits, num, pass, type Weights } from "./model";

/** The part of weight space that is drawn: w across, b up, the same scale on both. */
const W_DOMAIN: [number, number] = [-1.4, 2.6];
const B_DOMAIN: [number, number] = [-1.0, 2.0];
const TICKS = [-1, 0, 1, 2];

/** Rough width of 13 px label text per character, for keeping labels apart. */
const CHAR_PX = 6.8;

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** The box a 13 px label occupies, from its anchor point, anchor side and length. */
function labelBox(x: number, y: number, text: string, anchor: "start" | "middle" | "end", pad = 2): Box {
  const width = text.length * CHAR_PX;
  const x0 = anchor === "start" ? x : anchor === "end" ? x - width : x - width / 2;
  // From the top of a capital to just under the baseline, at 13 px.
  return { x0: x0 - pad, x1: x0 + width + pad, y0: y - 10 - pad, y1: y + 3 + pad };
}

function overlaps(a: Box, b: Box): boolean {
  return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
}

/** Below this plot width the contour values inside the 1.00 line are left out: there is no room for them. */
const NARROW_PLOT = 320;

interface LandscapeProps {
  width: number;
  /** Weights before step 1, after step 1, ... */
  path: readonly Weights[];
  /** The optimisation step being shown, 1-based. */
  step: number;
  /** 0 forward, 1 loss, 2 backward, 3 update. */
  stage: number;
  label: string;
}

/** Where to print a contour's value: the point of its line furthest towards the upper right that is on the plot. */
function levelLabelAt(plot: Plot, points: { x: number; y: number }[]): { x: number; y: number } | null {
  let best: { x: number; y: number } | null = null;
  let bestScore = -Infinity;
  for (const point of points) {
    if (!inside(plot, point.x, point.y, 14)) continue;
    const score = point.x * 0.35 - point.y;
    if (score > bestScore) {
      bestScore = score;
      best = point;
    }
  }
  return best;
}

/**
 * Weight space: every possible (w, b), the loss as contour lines around its
 * minimum, and the walk of the weights. Each stage adds one thing at the
 * current point: its loss (the contour it sits on), the gradient (uphill,
 * across that contour), the step (against the gradient, learning rate times
 * its length) and where the step lands.
 */
export function Landscape({ width, path, step, stage, label }: LandscapeProps) {
  const clip = svgId(useId(), "landscape");
  const plot = equalAspectPlot(width, W_DOMAIN, B_DOMAIN);
  const px = (weights: Weights) => ({ x: plot.x(weights.w), y: plot.y(weights.b) });

  const before = path[step - 1];
  const after = path[step];
  const current = pass(before);
  const here = px(before);
  const there = px(after);
  const lossAfter = loss(after);
  const outcome = change(current.loss, lossAfter);
  const markOf = CHANGE_MARK[outcome];

  // The gradient, drawn to the same scale as the step (pixels per unit of weight), so that the step is
  // visibly the learning rate times it. b grows upwards, so its y flips. Cut at the edge of the plot.
  const gradientLength = Math.hypot(current.gradient.w, current.gradient.b);
  const gradEnd = { x: here.x + current.gradient.w * plot.unit, y: here.y - current.gradient.b * plot.unit };
  const gradEdge = clipToPlot(plot, here.x, here.y, gradEnd.x, gradEnd.y);
  const gradShown = Math.hypot(gradEdge.x - here.x, gradEdge.y - here.y);
  const ux = gradShown > 1e-9 ? (gradEdge.x - here.x) / gradShown : 0;
  const uy = gradShown > 1e-9 ? (gradEdge.y - here.y) / gradShown : 0;
  const trail = path.slice(0, step).map(px);
  const landing = clipToPlot(plot, here.x, here.y, there.x, there.y);
  const stepLength = Math.hypot(landing.x - here.x, landing.y - here.y);
  const minimum = px(MINIMUM);
  // Once the weights have left the drawn area (a rate that is too large) only the edge arrow is drawn.
  const visible = inside(plot, here.x, here.y);

  const contours = LEVELS.map((level) => {
    const points = contour(level).map(px);
    return { level, points, label: levelLabelAt(plot, points) };
  });

  // At the minimum itself the contour shrinks to a point and there is no line to draw.
  const ellipse = (level: number) => {
    const points = contour(level);
    return points.length === 0
      ? null
      : linePath(
          [...points, points[0]],
          (point) => plot.x(point.w),
          (point) => plot.y(point.b),
        );
  };
  const currentLine = stage >= 1 ? ellipse(current.loss) : null;
  const afterLine = stage >= 3 && Number.isFinite(lossAfter) ? ellipse(lossAfter) : null;

  // ---- Labels, placed in order of importance; each takes the first position that touches nothing
  // placed before it, and a label with no free position is left out (its number is in the table).
  const digits = lossDigits(current.loss, lossAfter);
  const taken: Box[] = [];
  const mark = (point: { x: number; y: number }, r = 6) => taken.push({ x0: point.x - r, x1: point.x + r, y0: point.y - r, y1: point.y + r });
  // Labels stay off the axes: inside the plot across, and above the tick labels.
  const free = (box: Box) =>
    box.x0 >= plot.left + 1 &&
    box.x1 <= width - 2 &&
    box.y0 >= 0 &&
    box.y1 <= plot.bottom &&
    !taken.some((other) => overlaps(box, other));
  type Anchor = "start" | "middle" | "end";
  interface Spot {
    x: number;
    y: number;
    anchor: Anchor;
  }
  const place = (spots: Spot[], box: (spot: Spot) => Box): Spot | null => {
    const spot = spots.find((candidate) => free(box(candidate)));
    if (spot) taken.push(box(spot));
    return spot ?? null;
  };
  /** Right above, right below, left above, left below a point. */
  const around = (point: { x: number; y: number }, gap = 10): Spot[] => [
    { x: point.x + gap, y: point.y - gap, anchor: "start" },
    { x: point.x + gap, y: point.y + gap + 10, anchor: "start" },
    { x: point.x - gap, y: point.y - gap, anchor: "end" },
    { x: point.x - gap, y: point.y + gap + 10, anchor: "end" },
  ];

  mark(minimum);
  if (visible) mark(here);
  const stepShown = stage >= 3 && visible;
  if (stepShown) {
    mark(landing);
    taken.push({
      x0: Math.min(here.x, landing.x) - 4,
      x1: Math.max(here.x, landing.x) + 4,
      y0: Math.min(here.y, landing.y) - 4,
      y1: Math.max(here.y, landing.y) + 4,
    });
  }

  const landingText = `✓ ${landing.clipped ? "off the chart, " : ""}L = ${num(lossAfter, digits)}, ${outcome}`;
  const landingLabel = stepShown
    ? place(
        [...around(landing).slice(1, 2), ...around(landing).slice(0, 1), ...around(landing).slice(2)],
        (spot) => labelBox(spot.x, spot.y, landingText, spot.anchor),
      )
    : null;

  const hereText = stage >= 1 ? `L = ${num(current.loss, digits)}` : `w ${num(before.w)}, b ${num(before.b)}`;
  const hereLabel = visible
    ? place(
        [
          ...around(here),
          { x: here.x, y: here.y - 14, anchor: "middle" },
          { x: here.x, y: here.y + 24, anchor: "middle" },
          { x: here.x + 4, y: here.y - 24, anchor: "start" },
          { x: here.x + 4, y: here.y + 34, anchor: "start" },
        ],
        (spot) => labelBox(spot.x, spot.y, hereText, spot.anchor),
      )
    : null;

  // The gradient's label: its length, and a note when the arrow is cut at the edge. Where the full
  // label finds no room (a narrow plot), shorter forms are tried: the length is also in the table.
  const gradForms: string[][] = [
    [`gradient, length ${num(gradientLength)}`, ...(gradEdge.clipped ? ["runs off the plot"] : [])],
    [`gradient, ${num(gradientLength)}`, ...(gradEdge.clipped ? ["cut at the edge"] : [])],
    ["gradient"],
  ];
  const gradLabel =
    stage >= 2 && visible && gradShown > 1
      ? (() => {
          for (const lines of gradForms) {
            const longest = lines.reduce((a, b) => (b.length > a.length ? b : a));
            const textWidth = longest.length * CHAR_PX;
            const box = (spot: Spot): Box => {
              const first = labelBox(spot.x, spot.y, longest, spot.anchor);
              return { ...first, y1: first.y1 + (lines.length - 1) * 15 };
            };
            const mid = { x: (here.x + gradEdge.x) / 2, y: (here.y + gradEdge.y) / 2 };
            const keepIn = (x: number) => Math.min(width - 2 - textWidth / 2, Math.max(plot.left + 2 + textWidth / 2, x));
            const edgeAnchor: Anchor = ux < 0 ? "start" : "end";
            const edgeX = gradEdge.x + (ux < 0 ? 4 : -4);
            const above = 16 + (lines.length - 1) * 15;
            const spot = place(
              [
                ...(gradEdge.clipped
                  ? []
                  : [{ x: gradEdge.x + ux * 8, y: gradEdge.y + uy * 8 + (uy > 0 ? 14 : -6), anchor: (ux >= 0 ? "start" : "end") as Anchor }]),
                { x: keepIn(mid.x), y: mid.y + 20, anchor: "middle" },
                { x: keepIn(mid.x), y: mid.y - above, anchor: "middle" },
                { x: edgeX, y: gradEdge.y + 20, anchor: edgeAnchor },
                { x: edgeX, y: gradEdge.y - above, anchor: edgeAnchor },
              ],
              box,
            );
            if (spot) return { ...spot, lines };
          }
          return null;
        })()
      : null;

  const minimumText = `lowest loss, ${num(MINIMUM_LOSS)}`;
  const minimumLabel = place(
    [
      { x: minimum.x + 9, y: minimum.y + 16, anchor: "start" },
      ...around(minimum, 9),
    ],
    (spot) => labelBox(spot.x, spot.y, minimumText, spot.anchor),
  );

  // Contour values last: left out where they would touch anything above, and inside the 1.00 line on a narrow plot.
  const narrow = plot.right - plot.left < NARROW_PLOT;
  const showValue = (level: number, at: { x: number; y: number }) => {
    if (narrow && level < 1) return false;
    return free(labelBox(at.x, at.y + 4, num(level, level < 1 ? 2 : 0), "middle", 2));
  };

  return (
    <svg viewBox={`0 0 ${width} ${plot.height}`} className="ts-svg" role="img" aria-label={label}>
      <defs>
        <clipPath id={clip}>
          <rect x={plot.left} y={plot.top} width={plot.right - plot.left} height={plot.bottom - plot.top} />
        </clipPath>
      </defs>

      <rect x={plot.left} y={plot.top} width={plot.right - plot.left} height={plot.bottom - plot.top} className="ts-plot-area" />
      <Axis scale={plot.x} orientation="bottom" offset={plot.bottom} ticks={TICKS} format={num0} label="Weight w" />
      <Axis scale={plot.y} orientation="left" offset={plot.left} ticks={TICKS} format={num0} label="Bias b" />

      <g clipPath={`url(#${clip})`}>
        {contours.map(({ level }) => (
          <path key={level} d={ellipse(level) ?? undefined} className="ts-contour" />
        ))}

        {/* The contour the current weights sit on: every (w, b) with the same loss. */}
        {currentLine ? <path d={currentLine} className="ts-contour-current" /> : null}
        {afterLine ? <path d={afterLine} className="ts-contour-after" /> : null}

        {/* Steps already taken. */}
        {trail.length > 1 ? (
          <path d={linePath(trail, (point) => point.x, (point) => point.y)} className="ts-trail" />
        ) : null}
        {trail.slice(0, -1).map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r={3.5} className="ts-trail-point" />
        ))}

        {/* The step: against the gradient, learning rate times its length. */}
        {stage >= 3 && visible ? (
          <g key={`step-${step}`} className="ts-enter">
            <line x1={here.x} y1={here.y} x2={landing.x} y2={landing.y} pathLength={1} className="ts-step ts-draw" />
            {stepLength > 12 ? <path d={arrowHead(here.x, here.y, landing.x, landing.y, 10)} className="ts-step-head ts-fade-late" /> : null}
            {!landing.clipped ? (
              <rect x={there.x - 4.5} y={there.y - 4.5} width={9} height={9} className="ts-landing ts-fade-late" />
            ) : null}
          </g>
        ) : null}
      </g>

      {/* Contour values, outside the clip so a label at the edge is not cut. */}
      {contours.map(({ level, label: at }) =>
        at && showValue(level, at) ? (
          <text key={level} x={at.x} y={at.y} dy="0.32em" textAnchor="middle" className="fig-axis-text" style={HALO}>
            {num(level, level < 1 ? 2 : 0)}
          </text>
        ) : null,
      )}

      {/* The minimum of the loss on this batch. */}
      <g aria-hidden="true">
        <path d={`M${minimum.x - 6},${minimum.y}h12M${minimum.x},${minimum.y - 6}v12`} className="ts-minimum" />
        {minimumLabel ? (
          <text
            x={minimumLabel.x}
            y={minimumLabel.y}
            textAnchor={minimumLabel.anchor}
            className="ts-label ts-label-muted"
            style={HALO}
          >
            {minimumText}
          </text>
        ) : null}
      </g>

      {/* The gradient: which way the loss rises fastest, to the same scale as the step. */}
      {stage >= 2 && visible && gradShown > 1 ? (
        <g key={`grad-${step}`} className="ts-enter" aria-hidden="true">
          <line
            x1={here.x}
            y1={here.y}
            x2={gradEdge.x}
            y2={gradEdge.y}
            pathLength={1}
            className={`ts-gradient ts-draw ${stage >= 3 ? "ts-gradient-past" : ""}`}
          />
          {!gradEdge.clipped && gradShown > 12 ? (
            <path
              d={arrowHead(here.x, here.y, gradEdge.x, gradEdge.y, 8)}
              className={`ts-gradient-head ts-fade-late ${stage >= 3 ? "ts-gradient-past" : ""}`}
            />
          ) : null}
          {gradLabel ? (
            <text
              x={gradLabel.x}
              y={gradLabel.y}
              textAnchor={gradLabel.anchor}
              className="ts-label ts-label-muted ts-fade-late"
              style={HALO}
            >
              {gradLabel.lines.map((line, index) => (
                <tspan key={index} x={gradLabel.x} dy={index === 0 ? 0 : 15}>
                  {line}
                </tspan>
              ))}
            </text>
          ) : null}
        </g>
      ) : null}

      {/* The current weights, or an arrow at the edge when they have left the drawn area. */}
      {!visible ? (
        <OffChart plot={plot} from={minimum} to={here} text={`weights off the chart, L = ${num(current.loss)}`} />
      ) : null}
      {visible ? (
        <>
          <circle cx={here.x} cy={here.y} r={5.5} className="ts-current" />
          {hereLabel ? (
            <text x={hereLabel.x} y={hereLabel.y} textAnchor={hereLabel.anchor} className="ts-label" style={HALO}>
              {hereText}
            </text>
          ) : null}
        </>
      ) : null}

      {/* Where the step lands, and whether the loss went down. */}
      {stepShown && landingLabel ? (
        <g key={`land-${step}`} className="ts-enter ts-fade-late">
          <text x={landingLabel.x} y={landingLabel.y} textAnchor={landingLabel.anchor} className="ts-label" style={HALO}>
            <tspan className={markOf.className} aria-hidden="true">
              {markOf.glyph}{" "}
            </tspan>
            {landing.clipped ? "off the chart, " : ""}L = {num(lossAfter, digits)}, {outcome}
          </text>
        </g>
      ) : null}
    </svg>
  );
}

/** An arrowhead on the plot's edge, on the line from the minimum towards weights that are off the chart. */
function OffChart({ plot, from, to, text }: { plot: Plot; from: { x: number; y: number }; to: { x: number; y: number }; text: string }) {
  const edge = clipToPlot(plot, from.x, from.y, to.x, to.y);
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const back = { x: edge.x - Math.cos(angle) * 14, y: edge.y - Math.sin(angle) * 14 };
  const onRight = edge.x > (plot.left + plot.right) / 2;
  return (
    <g aria-hidden="true">
      <line x1={back.x} y1={back.y} x2={edge.x} y2={edge.y} className="ts-step" />
      <path d={arrowHead(back.x, back.y, edge.x, edge.y, 9)} className="ts-step-head" />
      <text
        x={back.x + (onRight ? -8 : 8)}
        y={back.y + (edge.y < plot.top + 20 ? 18 : -10)}
        textAnchor={onRight ? "end" : "start"}
        className="ts-label"
        style={HALO}
      >
        {text}
      </text>
    </g>
  );
}

function num0(value: number): string {
  return num(value, 0);
}

/**
 * The key to weight space, in HTML so it wraps. Every item is always laid out
 * (hidden until its stage), so the drawing below never moves.
 */
export function LandscapeKey({ stage }: { stage: number }) {
  const item = (from: number) => (stage >= from ? undefined : "ts-key-later");
  return (
    <ul className="fig-legend ts-legend" aria-label="Key to the weight-space drawing">
      <li>
        <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden="true">
          <circle cx={7} cy={7} r={4.5} className="ts-current" />
        </svg>
        weights now
      </li>
      <li className={item(1)} aria-hidden={stage >= 1 ? undefined : true}>
        <svg width={22} height={14} viewBox="0 0 22 14" aria-hidden="true">
          <line x1={1} x2={21} y1={7} y2={7} className="ts-contour-current" />
        </svg>
        loss now
      </li>
      <li className={item(3)} aria-hidden={stage >= 3 ? undefined : true}>
        <svg width={22} height={14} viewBox="0 0 22 14" aria-hidden="true">
          <line x1={1} x2={21} y1={7} y2={7} className="ts-contour-after" />
        </svg>
        loss after the step
      </li>
      <li className={item(2)} aria-hidden={stage >= 2 ? undefined : true}>
        <svg width={22} height={14} viewBox="0 0 22 14" aria-hidden="true">
          <line x1={1} x2={16} y1={7} y2={7} className="ts-step" />
          <path d={arrowHead(1, 7, 21, 7, 8)} className="ts-step-head" />
        </svg>
        gradient and step, drawn to one scale
      </li>
    </ul>
  );
}
