"use client";

import { useId, useMemo } from "react";
import { fixed } from "@/data/format";
import { at, carry, field, MIDDLE, ON_TARGET, TARGETS, type Flow } from "./model";

/** The part of the action plane drawn: both coordinates, in the units of the targets. */
const X_RANGE: readonly [number, number] = [-3.2, 3.2];
const Y_RANGE: readonly [number, number] = [-2.1, 2.1];
/** Draws shown as dots and paths; the statistics use all of them. */
export const SHOWN = 400;
/** Spacing of the field arrows, in plane units. */
const ARROW_GRID = 0.5;
const BIN = 0.1;
const STRIP = 60;
const GAP = 10;
const TICKS = 22;

/**
 * The drawing's height for a given width, as CSS: the plane's fixed aspect ratio
 * plus the strip under it. Set on the <svg> so the space is reserved before the
 * stage has been measured (in the static HTML the viewBox is drawn at a fallback
 * width), and the page does not shift when the real width arrives. The parent
 * must be a size container (`@container`).
 */
export const PLANE_HEIGHT = `calc(${(100 * (Y_RANGE[1] - Y_RANGE[0])) / (X_RANGE[1] - X_RANGE[0])}cqw + ${GAP + STRIP + TICKS}px)`;

const halo = { stroke: "var(--surface)", strokeWidth: 3, paintOrder: "stroke" as const, strokeLinejoin: "round" as const };

export interface PlaneProps {
  flow: Flow;
  /** Flow steps done, fractional while a step is under way. */
  progress: number;
  /** The traced draw: its path and the guess each step aimed at. */
  traced: ReturnType<typeof carry>;
  /** Drawing width in px. */
  width: number;
  label: string;
}

const round = (value: number) => Math.round(value * 10) / 10;

/**
 * The action plane: the field as arrows, the draws as dots with the paths they
 * took, the two targets, the traced draw with the guess its current step aims
 * at, and underneath, where all the draws are along the first coordinate.
 */
export function Plane({ flow: result, progress, traced, width, label }: PlaneProps) {
  const clip = `fm-clip-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const unit = width / (X_RANGE[1] - X_RANGE[0]);
  const plane = (Y_RANGE[1] - Y_RANGE[0]) * unit;
  const height = plane + GAP + STRIP + TICKS;
  const px = (value: number) => (value - X_RANGE[0]) * unit;
  const py = (value: number) => (Y_RANGE[1] - value) * unit;

  const last = result.positions.length - 1;
  const done = Math.min(Math.floor(progress + 1e-9), last);
  const finished = progress >= last - 1e-9;
  // The step under way, or the last one when all are done: its noise level sets the arrows and the guess.
  const current = Math.min(done, last - 1);
  // When the flow is done the arrows stay as they were at the last step, and say so.
  const level = result.levels[current];

  // Paths of the shown draws over the completed flow steps: changes once per step.
  const trails = useMemo(() => {
    let d = "";
    for (let index = 0; index < SHOWN; index += 1) {
      for (let k = 0; k <= done; k += 1) {
        const p = result.positions[k];
        d += `${k === 0 ? "M" : "L"}${round(px(p[2 * index]))} ${round(py(p[2 * index + 1]))}`;
      }
    }
    return d;
    // px and py follow from width.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, done, width]);

  // The part of the step under way, and the dots where the draws are now.
  let partial = "";
  let dots = "";
  for (let index = 0; index < SHOWN; index += 1) {
    const [x, y] = at(result, index, progress);
    if (!finished && progress > done) {
      const p = result.positions[done];
      partial += `M${round(px(p[2 * index]))} ${round(py(p[2 * index + 1]))}L${round(px(x))} ${round(py(y))}`;
    }
    dots += `M${round(px(x))} ${round(py(y))}h0`;
  }

  // The field at the noise level of the current step: which way a draw at each point moves.
  const arrows = useMemo(() => {
    const length = 0.34 * ARROW_GRID * unit;
    const head = Math.min(4, length * 0.4);
    let d = "";
    for (let x1 = -3; x1 <= 3 + 1e-9; x1 += ARROW_GRID) {
      for (let x2 = -2; x2 <= 2 + 1e-9; x2 += ARROW_GRID) {
        const { v } = field(x1, x2, level, result.kind);
        const size = Math.hypot(v[0], v[1]);
        if (size < 1e-6) continue;
        // The sampler subtracts v: the motion is -v. In screen space y points down.
        const ux = -v[0] / size;
        const uy = v[1] / size;
        const cx = px(x1);
        const cy = py(x2);
        const tx = cx + (ux * length) / 2;
        const ty = cy + (uy * length) / 2;
        const sx = cx - (ux * length) / 2;
        const sy = cy - (uy * length) / 2;
        const hx = tx - ux * head;
        const hy = ty - uy * head;
        d += `M${round(sx)} ${round(sy)}L${round(tx)} ${round(ty)}`;
        d += `M${round(hx - uy * head * 0.6)} ${round(hy + ux * head * 0.6)}L${round(tx)} ${round(ty)}L${round(hx + uy * head * 0.6)} ${round(hy - ux * head * 0.6)}`;
      }
    }
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, result.kind, width]);

  // Where all the draws are along the first coordinate, now.
  const strip = useMemo(() => {
    const bins = Math.round((X_RANGE[1] - X_RANGE[0]) / BIN);
    const counts = new Array<number>(bins).fill(0);
    const count = result.positions[0].length / 2;
    let middle = 0;
    let onTarget = 0;
    for (let index = 0; index < count; index += 1) {
      const [x, y] = at(result, index, progress);
      const bin = Math.floor((x - X_RANGE[0]) / BIN);
      if (bin >= 0 && bin < bins) counts[bin] += 1;
      if (Math.abs(x) < MIDDLE) middle += 1;
      if (Math.min(...TARGETS.map(([m1, m2]) => Math.hypot(x - m1, y - m2))) < ON_TARGET) onTarget += 1;
    }
    const top = Math.max(1, ...counts);
    return { counts, top, middle: middle / count, onTarget: onTarget / count, count };
  }, [result, progress]);

  const tracedNow = (() => {
    const k = Math.min(done, traced.path.length - 1);
    const from = traced.path[k];
    const to = traced.path[Math.min(k + 1, traced.path.length - 1)];
    const f = finished ? 0 : progress - done;
    return [from[0] + f * (to[0] - from[0]), from[1] + f * (to[1] - from[1])] as const;
  })();
  const guess = finished ? null : traced.guesses[current];
  const stripTop = plane + GAP;
  const narrow = width < 440;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="block w-full select-none"
      style={{ height: PLANE_HEIGHT }}
      role="img"
      aria-label={label}
    >
      <defs>
        <clipPath id={clip}>
          <rect x={0} y={0} width={width} height={plane} />
        </clipPath>
      </defs>

      {/* The middle, where regression lands. */}
      <rect x={px(-MIDDLE)} y={0} width={px(MIDDLE) - px(-MIDDLE)} height={plane} fill="var(--surface-2)" />
      <rect x={px(-MIDDLE)} y={stripTop} width={px(MIDDLE) - px(-MIDDLE)} height={STRIP} fill="var(--surface-2)" />
      <line x1={0} x2={width} y1={py(0)} y2={py(0)} stroke="var(--grid)" strokeWidth={1} />
      <line x1={px(0)} x2={px(0)} y1={0} y2={plane} stroke="var(--grid)" strokeWidth={1} />

      <g clipPath={`url(#${clip})`}>
        <path d={arrows} fill="none" stroke="var(--text-faint)" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" opacity={finished ? 0.35 : 0.6} />
        <path d={trails} fill="none" stroke="var(--action)" strokeWidth={1} strokeLinejoin="round" opacity={0.26} />
        {partial ? <path d={partial} fill="none" stroke="var(--action)" strokeWidth={1} opacity={0.26} /> : null}
        <path d={dots} fill="none" stroke="var(--action)" strokeWidth={3.5} strokeLinecap="round" />

        {/* The targets: a cross on each centre, and the ring a draw must end inside to count as on it. */}
        {TARGETS.map(([m1, m2], k) => {
          const cx = px(m1);
          const cy = py(m2);
          const arm = Math.max(6, 0.16 * unit);
          return (
            <g key={k}>
              <circle cx={cx} cy={cy} r={ON_TARGET * unit} fill="none" stroke="var(--text)" strokeWidth={1} strokeDasharray="2 2" />
              <path d={`M${cx - arm} ${cy}H${cx + arm}M${cx} ${cy - arm}V${cy + arm}`} stroke="var(--text)" strokeWidth={1.5} />
              <text x={cx} y={cy + arm + 15} textAnchor="middle" className="fig-axis-text" style={{ fill: "var(--text)", ...halo }}>
                {`a${k === 0 ? "₁" : "₂"} (${m1 > 0 ? "+" : m1 < 0 ? "−" : ""}${Math.abs(m1)}, ${m2})`}
              </text>
            </g>
          );
        })}

        {/* The traced draw: the corners of its path are its flow steps. */}
        <path
          d={[...traced.path.slice(0, done + 1), tracedNow]
            .map(([x, y], k) => `${k === 0 ? "M" : "L"}${round(px(x))} ${round(py(y))}`)
            .join("")}
          fill="none"
          stroke="var(--text)"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        {traced.path.slice(0, done + 1).map(([x, y], k) => (
          <circle key={k} cx={px(x)} cy={py(y)} r={k === 0 ? 3.5 : 2.5} fill={k === 0 ? "var(--surface)" : "var(--text)"} stroke="var(--text)" strokeWidth={1.5} />
        ))}
        {guess ? (
          <g>
            <line
              x1={px(tracedNow[0])}
              y1={py(tracedNow[1])}
              x2={px(guess[0])}
              y2={py(guess[1])}
              stroke="var(--text-muted)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle cx={px(guess[0])} cy={py(guess[1])} r={7} fill="none" stroke="var(--text)" strokeWidth={1.5} />
            <circle cx={px(guess[0])} cy={py(guess[1])} r={1.5} fill="var(--text)" />
            <text
              x={px(guess[0])}
              y={py(guess[1]) - 12}
              textAnchor="middle"
              className="fig-axis-text"
              style={{ fill: "var(--text)", ...halo }}
            >
              guess
            </text>
          </g>
        ) : null}
        <circle cx={px(tracedNow[0])} cy={py(tracedNow[1])} r={6} fill="var(--mark)" stroke="var(--text)" strokeWidth={1} />
      </g>
      <rect x={0.5} y={0.5} width={width - 1} height={plane - 1} fill="none" stroke="var(--border)" />

      {/* Plane annotations. */}
      <text x={8} y={18} className="fig-axis-text" style={halo}>
        {finished ? `Arrows: field at the last step, s = ${fixed(level, 2)}` : `Field at noise level s = ${fixed(level, 2)}`}
      </text>
      <text x={px(0)} y={plane - 8} textAnchor="middle" className="fig-axis-text" style={halo}>
        middle
      </text>

      {/* Where all the draws are, along the first coordinate. */}
      {strip.counts.map((count, bin) =>
        count > 0 ? (
          <rect
            key={bin}
            x={px(X_RANGE[0] + bin * BIN) + 0.5}
            width={Math.max(1, BIN * unit - 1)}
            y={stripTop + STRIP - Math.max(1, (count / strip.top) * (STRIP - 20))}
            height={Math.max(1, (count / strip.top) * (STRIP - 20))}
            fill="var(--action)"
          />
        ) : null,
      )}
      <line x1={0} x2={width} y1={stripTop + STRIP} y2={stripTop + STRIP} stroke="var(--border-strong)" />
      {narrow ? null : (
        <text x={4} y={stripTop + 11} className="fig-axis-text" style={halo}>
          {`All ${strip.count.toLocaleString("en-US")} draws, by first coordinate`}
        </text>
      )}
      <text x={width - 4} y={stripTop + 11} textAnchor="end" className="fig-axis-text" style={{ fill: "var(--text)", ...halo }}>
        {`on a target ${fixed(100 * strip.onTarget, 1)}%, middle ${fixed(100 * strip.middle, 1)}%`}
      </text>
      {[-3, -2, -1, 0, 1, 2, 3].map((tick) => (
        <g key={tick}>
          <line x1={px(tick)} x2={px(tick)} y1={stripTop + STRIP} y2={stripTop + STRIP + 4} stroke="var(--border-strong)" />
          <text x={px(tick)} y={stripTop + STRIP + 17} textAnchor="middle" className="fig-axis-text">
            {tick < 0 ? `−${-tick}` : tick}
          </text>
        </g>
      ))}
    </svg>
  );
}
