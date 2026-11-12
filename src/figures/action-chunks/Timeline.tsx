"use client";

import { useRef, type CSSProperties, type PointerEvent } from "react";
import { MODALITY } from "@/figures/kit";
import { cutDash, layout, textWidth, type Layout } from "./geometry";
import { CHUNK, CONTROL_HZ, seconds } from "./model";

export interface TimelineProps {
  /** Width of the drawing in px: the width of its container. */
  width: number;
  /** Actions executed of each chunk before the cameras are read again. */
  executed: number;
  /** Control steps done so far; the window's length when the timeline is shown whole. */
  step: number;
  /** The playhead is travelling: it moves to the next step over `tickMs`. */
  gliding: boolean;
  tickMs: number;
  /** What the drawing shows, for readers who cannot see it. */
  description: string;
  /** Called with a control step when the reader points at a moment of the timeline. */
  onScrub: (step: number) => void;
  /**
   * The width is the container's, measured. Until it is (and in the static
   * HTML) the drawing keeps its own size, at most the container's width, so
   * its labels are never scaled down to an unreadable size.
   */
  fluid: boolean;
}

const HAIRLINE = { stroke: "var(--text-faint)", strokeWidth: 1 } as const;
/** Where a label that does not fit over its span starts, measured from the span's first dot. */
const START = 6;
/** Ink text that stays legible where a line of the drawing or of the graph paper runs behind it. */
const LABEL: CSSProperties = { fill: "var(--text)", stroke: "var(--surface)", strokeWidth: 4, paintOrder: "stroke" };

/** One dimension line: a hairline between two dots, as the drawings of this site mark a size. */
function Span({ from, to, y }: { from: number; to: number; y: number }) {
  return (
    <>
      <line x1={from} x2={to} y1={y} y2={y} {...HAIRLINE} />
      <circle cx={from} cy={y} r={2.5} fill="var(--text-faint)" />
      <circle cx={to} cy={y} r={2.5} fill="var(--text-faint)" />
    </>
  );
}

/** The sizes of the first chunk: all of it above, and below that the part that is executed and the part that is not. */
function Dimensions({ g, executed }: { g: Layout; executed: number }) {
  const x0 = g.x(0);
  const xk = g.x(executed);
  const xh = g.x(CHUNK);
  const discarded = CHUNK - executed;

  // A label sits over the middle of its span when there is room, and otherwise starts just right of the span's first dot.
  const overall = `${CHUNK} predicted, ${seconds(CHUNK)}`;
  const overallFits = textWidth(overall) <= xh - x0 - 10;

  const done = `${executed} executed, ${seconds(executed)}`;
  const doneWidth = textWidth(done);
  const doneFits = doneWidth <= xk - x0 - 10;
  const doneEnd = doneFits ? (x0 + xk) / 2 + doneWidth / 2 : x0 + START + doneWidth;

  // The label of the discarded part gives way to the one before it.
  const dropped = `${discarded} discarded`;
  const droppedWidth = textWidth(dropped);
  const droppedFits = droppedWidth <= xh - xk - 10 && (xk + xh) / 2 - droppedWidth / 2 >= doneEnd + 8;
  const droppedStart = Math.max(xk + START, doneEnd + 10);

  return (
    <g>
      <line x1={x0} x2={x0} y1={g.top - 3} y2={g.overallY - 4} {...HAIRLINE} />
      <line x1={xh} x2={xh} y1={g.top - 3} y2={g.overallY - 4} {...HAIRLINE} />
      {discarded > 0 ? <line x1={xk} x2={xk} y1={g.top - 3} y2={g.splitY - 4} {...HAIRLINE} /> : null}

      <Span from={x0} to={xh} y={g.overallY} />
      <text
        x={overallFits ? (x0 + xh) / 2 : x0 + START}
        y={g.overallY - 6}
        textAnchor={overallFits ? "middle" : "start"}
        className="fig-axis-text"
        style={LABEL}
      >
        {overall}
      </text>

      <Span from={x0} to={xk} y={g.splitY} />
      {discarded > 0 ? <Span from={xk} to={xh} y={g.splitY} /> : null}
      <text
        x={doneFits ? (x0 + xk) / 2 : x0 + START}
        y={g.splitY - 6}
        textAnchor={doneFits ? "middle" : "start"}
        className="fig-axis-text"
        style={LABEL}
      >
        {done}
      </text>
      {discarded > 0 ? (
        <text
          x={droppedFits ? (xk + xh) / 2 : droppedStart}
          y={g.splitY - 6}
          textAnchor={droppedFits ? "middle" : "start"}
          className="fig-axis-text"
          style={LABEL}
        >
          {dropped}
        </text>
      ) : null}
    </g>
  );
}

/** Half the width of the step chip on the rule. */
const CHIP_HALF = 13;

/**
 * The time axis as a rule: a tick for every control step, a longer one and a
 * number every five. A number the step chip at `chipX` would cover is left out.
 */
function Rule({ g, chipX }: { g: Layout; chipX: number | null }) {
  const marks = Array.from({ length: g.steps + 1 }, (_, step) => step);
  return (
    <g>
      <g stroke="var(--border-strong)" strokeWidth={1} shapeRendering="crispEdges">
        <line x1={g.x(0)} x2={g.x(g.steps)} y1={g.axis} y2={g.axis} />
        {marks.map((step) => (
          <line key={step} x1={g.x(step)} x2={g.x(step)} y1={g.axis} y2={g.axis + (step % 5 === 0 ? 6 : 3)} />
        ))}
      </g>
      {marks
        .filter((step) => step % 5 === 0)
        .filter((step) => chipX === null || Math.abs(g.x(step) - chipX) >= CHIP_HALF + textWidth(String(step)) / 2 + 3)
        .map((step) => (
          <text key={step} x={g.x(step)} y={g.axis + 20} textAnchor="middle" className="fig-axis-text">
            {step}
          </text>
        ))}
      <text x={(g.x(0) + g.x(g.steps)) / 2} y={g.axis + 40} textAnchor="middle" className="fig-axis-text fig-axis-label">
        Control step ({CONTROL_HZ} per second)
      </text>
    </g>
  );
}

/**
 * The timeline: one row of cells per chunk, each standing on the moment the
 * cameras were read for it. Filled cells are actions that were executed,
 * dashed (or, in thin rows, lighter) ones were predicted and never run.
 */
export function Timeline({ width, executed, step, gliding, tickMs, description, onScrub, fluid }: TimelineProps) {
  const g = layout(width, executed, CHUNK);
  const dragging = useRef(false);

  const whole = step >= g.steps;
  const now = Math.min(step, g.steps);
  const inset = g.gap / 2;
  // Thin rows cannot carry a dash pattern; their discarded cells get a lighter outline instead.
  const dash = cutDash(g);
  const bead = Math.min(4, Math.max(2.5, (executed * g.cell) / 2 - 1));
  const chipX = Math.min(g.width - CHIP_HALF - 1, Math.max(CHIP_HALF + 1, g.x(now)));
  const chip = chipX - g.x(now);

  const stepAt = (event: PointerEvent<SVGRectElement>) => {
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return now;
    const box = svg.getBoundingClientRect();
    const at = ((event.clientX - box.left) / box.width) * g.width;
    return Math.max(0, Math.min(g.steps, Math.round((at - g.x(0)) / g.cell)));
  };

  return (
    <svg
      viewBox={`0 0 ${g.width} ${g.height}`}
      className={`block h-auto max-w-full select-none ${fluid ? "w-full" : ""}`}
      style={fluid ? undefined : { width: g.width }}
      role="img"
      aria-label={description}
    >
      <Rule g={g} chipX={whole ? null : chipX} />

      {/* A stem from each reading of the cameras up to the chunk planned from it. */}
      {g.rows.map((row) => (
        <g
          key={row.index}
          style={{ opacity: row.start <= now ? 1 : 0, transition: "opacity 120ms var(--ease-standard)" }}
        >
          <line
            x1={g.x(row.start)}
            x2={g.x(row.start)}
            y1={g.axis}
            y2={row.y}
            stroke={MODALITY.vision}
            strokeWidth={1}
            shapeRendering="crispEdges"
          />
          <circle
            cx={g.x(row.start)}
            cy={g.axis}
            r={bead}
            fill={MODALITY.vision}
            stroke="var(--surface)"
            strokeWidth={2}
            style={{ paintOrder: "stroke" }}
          />
          {Array.from({ length: row.cells }, (_, index) => {
            const at = row.start + index;
            const kept = index < executed;
            const done = kept && at < now;
            return done ? (
              <rect
                key={index}
                x={g.x(at) + inset}
                y={row.y}
                width={g.cell - g.gap}
                height={g.cellHeight}
                rx={1.5}
                fill={MODALITY.action}
              />
            ) : (
              <rect
                key={index}
                x={g.x(at) + inset + 0.5}
                y={row.y + 0.5}
                width={g.cell - g.gap - 1}
                height={g.cellHeight - 1}
                rx={1.5}
                fill="var(--surface)"
                stroke={MODALITY.action}
                strokeWidth={kept ? 1.5 : 1}
                // Rows too thin for a dash tell the cut cells apart by a lighter outline.
                strokeOpacity={kept || dash ? 1 : 0.55}
                // Kept but not yet run: waiting in the queue, a plain outline. Cut from the chunk: dashed.
                strokeDasharray={kept ? undefined : dash}
              />
            );
          })}
        </g>
      ))}

      <Dimensions g={g} executed={executed} />

      {/* The moment the timeline stands at: a line, and the step number set in the highlighter on the rule. */}
      <g
        style={{
          transform: `translateX(${g.x(now)}px)`,
          opacity: whole ? 0 : 1,
          transition: gliding
            ? `transform ${tickMs}ms linear, opacity 120ms linear ${whole ? tickMs : 0}ms`
            : "opacity 120ms linear",
        }}
      >
        <line y1={g.top - 6} y2={g.axis + 7} stroke="var(--text)" strokeWidth={1.5} />
        <rect x={chip - CHIP_HALF} y={g.axis + 7} width={2 * CHIP_HALF} height={18} rx={2} fill="var(--mark)" stroke="var(--text)" strokeWidth={1} />
        <text x={chip} y={g.axis + 20} textAnchor="middle" className="fig-axis-text" style={{ fill: "var(--on-mark)" }}>
          {now}
        </text>
      </g>

      {/* Pointing at the timeline moves it to that moment. The step buttons do the same from the keyboard. */}
      <rect
        x={0}
        y={g.top - 8}
        width={g.width}
        height={g.height - g.top + 8}
        fill="transparent"
        style={{ cursor: "ew-resize", touchAction: "pan-y" }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          dragging.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          onScrub(stepAt(event));
        }}
        onPointerMove={(event) => {
          if (dragging.current) onScrub(stepAt(event));
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
      />
    </svg>
  );
}
