"use client";

import { useRef, type CSSProperties, type PointerEvent } from "react";
import type { Trace } from "@/data/files";
import { Axis, niceTicks, scaleLinear, tickStep } from "@/figures/kit";
import { CloseMark } from "./Plan";
import { closeSteps, closedSpans } from "./model";

const HALO: CSSProperties = {
  fill: "var(--text)",
  stroke: "var(--surface)",
  strokeWidth: 4,
  paintOrder: "stroke",
  strokeLinejoin: "round",
};

export interface TimelineProps {
  trace: Trace;
  step: number;
  /** The longest rollout of the actors on this layout: every actor is drawn on the same time axis. */
  span: number;
  /** The highest the gripper goes in any of them, metres. */
  top: number;
  width: number;
  /** True when the rollout ran out of time without a lift. */
  timedOut: boolean;
  onScrub: (step: number) => void;
}

/**
 * The same rollout against time: the gripper's height above the table, the
 * stretches in which it was told to close (shaded, with an x at each start),
 * the moment the object was moved, how the episode ended, and the current
 * step. Pressing or dragging on it moves the replay; the keyboard does that
 * with the step slider under the figure, so the strip itself is hidden from
 * assistive technology.
 */
/** The strip's height at a width: the figure reserves it while the rollouts load. */
export const timelineHeight = (width: number) => (width < 480 ? 150 : 160);

export function Timeline({ trace, step, span, top, width, timedOut, onScrub }: TimelineProps) {
  const svg = useRef<SVGSVGElement>(null);
  const narrow = width < 480;
  const height = timelineHeight(width);
  const margin = { top: 34, right: 14, bottom: 52, left: 44 };
  const last = trace.steps - 1;
  const at = Math.max(0, Math.min(step, last));
  const x = scaleLinear([0, Math.max(1, span - 1)], [margin.left, width - margin.right]);
  // The axis ends on the first round value at or above the highest point, so the line never leaves the plot.
  const highest = Math.max(0.05, top) * 1000;
  const yStep = tickStep(0, highest, 3);
  const yMax = Math.ceil(highest / yStep) * yStep;
  const yTicks = niceTicks(0, yMax, 3);
  const y = scaleLinear([0, yMax], [height - margin.bottom, margin.top]);

  const points = trace.tcp.map((point, index) => `${x(index).toFixed(1)},${y(point[2] * 1000).toFixed(1)}`);
  const past = points.slice(0, at + 1);
  const future = points.slice(at);
  const closes = closeSteps(trace);
  const spans = closedSpans(trace);
  const moved = trace.moved;
  const xTicks = niceTicks(0, span - 1, narrow ? 4 : 8).filter((tick) => tick <= span - 1);

  const scrubTo = (event: PointerEvent<SVGSVGElement>) => {
    const box = svg.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    const local = ((event.clientX - box.left) / box.width) * width;
    onScrub(Math.max(0, Math.min(last, Math.round(x.invert(local)))));
  };

  const endX = x(last);
  const endWords = trace.success ? "lifted" : timedOut ? "time limit" : "ends";

  return (
    <svg
      ref={svg}
      viewBox={`0 0 ${width} ${height}`}
      className="block h-auto w-full cursor-ew-resize touch-none select-none"
      aria-hidden="true"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        scrubTo(event);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) scrubTo(event);
      }}
    >
      {/* Stretches with the gripper commanded closed. */}
      {spans.map(([from, to]) => (
        <rect
          key={from}
          x={x(from)}
          y={margin.top}
          width={Math.max(1.5, x(to) - x(from))}
          height={height - margin.bottom - margin.top}
          fill="var(--surface-2)"
        />
      ))}
      {spans.length > 0 ? (
        <text x={x(spans[0][0]) + 4} y={margin.top + 12} className="fig-axis-text">
          closed
        </text>
      ) : null}

      <Axis scale={x} orientation="bottom" offset={height - margin.bottom} ticks={xTicks} label="Control step" />
      <Axis scale={y} orientation="left" offset={margin.left} ticks={yTicks} tickSize={0} hideLine />
      <text x={margin.left - 36} y={12} className="fig-axis-text fig-axis-label">
        Gripper height (mm)
      </text>

      {/* The move. */}
      {moved ? (
        <g>
          <line
            x1={x(moved.step)}
            x2={x(moved.step)}
            y1={margin.top - 4}
            y2={height - margin.bottom}
            stroke="var(--text-muted)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
          <text
            x={x(moved.step) + (x(moved.step) > width - 90 ? -4 : 4)}
            y={margin.top - 8}
            textAnchor={x(moved.step) > width - 90 ? "end" : "start"}
            className="fig-axis-text"
            style={HALO}
          >
            object moved
          </text>
        </g>
      ) : null}

      <polyline
        points={future.join(" ")}
        fill="none"
        stroke="var(--border-strong)"
        strokeWidth={1}
        strokeDasharray="2 3"
      />
      <polyline points={past.join(" ")} fill="none" stroke="var(--text)" strokeWidth={2} strokeLinejoin="round" />

      {closes
        .filter((close) => close <= at)
        .map((close) => (
          <CloseMark key={close} x={x(close)} y={y(trace.tcp[close][2] * 1000)} size={8} />
        ))}

      {/* How the episode ended. */}
      {at >= last ? (
        <text
          x={endX + (endX > width - 70 ? -6 : 6)}
          y={height - margin.bottom - 6}
          textAnchor={endX > width - 70 ? "end" : "start"}
          className="fig-axis-text"
          style={HALO}
        >
          {endWords}
        </text>
      ) : null}

      {/* The current step. */}
      <line
        x1={x(at)}
        x2={x(at)}
        y1={margin.top - 4}
        y2={height - margin.bottom}
        stroke="var(--text)"
        strokeWidth={1}
      />
      <rect
        x={x(at) - 4}
        y={height - margin.bottom - 4}
        width={8}
        height={8}
        fill="var(--mark)"
        stroke="var(--on-mark)"
        strokeWidth={1}
      />
    </svg>
  );
}
