"use client";

import { useId, type CSSProperties } from "react";
import type { Trace } from "@/data/files";
import { OBJECTS } from "@/data/labels";
import type { ObjectId } from "@/data/types";
import { Marker, OBJECT_SERIES } from "@/figures/kit";
import { closeSteps, decisiveClose, type Bounds } from "./model";

/** Robot frame (metres) to the drawing: x away from the base points up the page, y to the robot's left points left. */
export interface Projection {
  px: (y: number) => number;
  py: (x: number) => number;
  /** Pixels per metre. */
  scale: number;
}

export function project(bounds: Bounds, box: { left: number; top: number; width: number; height: number }): Projection {
  const spanY = bounds.yMax - bounds.yMin;
  const spanX = bounds.xMax - bounds.xMin;
  const scale = Math.min(box.width / spanY, box.height / spanX);
  const left = box.left + (box.width - spanY * scale) / 2;
  const top = box.top + (box.height - spanX * scale) / 2;
  return {
    px: (y) => left + (bounds.yMax - y) * scale,
    py: (x) => top + (bounds.xMax - x) * scale,
    scale,
  };
}

/** The height a plan of these bounds wants at a width, kept between a floor and a ceiling. */
export function planHeight(bounds: Bounds | null, width: number, min: number, max: number): number {
  const ratio = bounds ? (bounds.xMax - bounds.xMin) / (bounds.yMax - bounds.yMin) : 0.75;
  return Math.round(Math.min(max, Math.max(min, width * ratio)));
}

export const seriesOf = (object: ObjectId) => OBJECT_SERIES[OBJECTS[object].series];

const HALO: CSSProperties = {
  fill: "var(--text)",
  stroke: "var(--surface)",
  strokeWidth: 4,
  paintOrder: "stroke",
  strokeLinejoin: "round",
};
const FAINT_HALO: CSSProperties = { ...HALO, fill: "var(--text-muted)" };

const pathOf = (points: readonly (readonly number[])[], p: Projection) =>
  points.length === 0
    ? ""
    : `M${points.map((point) => `${p.px(point[1]).toFixed(1)},${p.py(point[0]).toFixed(1)}`).join("L")}`;

/** An x drawn in ink with a ring of the surface, so it reads on top of the path. */
export function CloseMark({ x, y, size = 10 }: { x: number; y: number; size?: number }) {
  const r = size / 2;
  const d = `M${x - r},${y - r}L${x + r},${y + r}M${x - r},${y + r}L${x + r},${y - r}`;
  return (
    <g>
      <path d={d} stroke="var(--surface)" strokeWidth={size > 8 ? 5 : 4} strokeLinecap="round" />
      <path d={d} stroke="var(--text)" strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

/** Closes that fall on top of each other share one label: "1", "2, 3", "2-6". */
function clusterCloses(points: { n: number; x: number; y: number }[], radius: number) {
  const groups: { x: number; y: number; ns: number[] }[] = [];
  for (const point of points) {
    const near = groups.find((group) => Math.hypot(group.x - point.x, group.y - point.y) < radius);
    if (near) near.ns.push(point.n);
    else groups.push({ x: point.x, y: point.y, ns: [point.n] });
  }
  return groups.map((group) => {
    const ns = group.ns;
    const run = ns.every((n, index) => index === 0 || n === ns[index - 1] + 1);
    const label = ns.length >= 3 && run ? `${ns[0]}–${ns[ns.length - 1]}` : ns.join(", ");
    return { x: group.x, y: group.y, label };
  });
}

function Grid({ bounds, p }: { bounds: Bounds; p: Projection }) {
  const step = 0.05;
  const lines: { key: string; d: string }[] = [];
  const left = p.px(bounds.yMax);
  const right = p.px(bounds.yMin);
  const top = p.py(bounds.xMax);
  const bottom = p.py(bounds.xMin);
  for (let x = Math.ceil(bounds.xMin / step) * step; x <= bounds.xMax; x += step) {
    lines.push({ key: `x${x.toFixed(2)}`, d: `M${left},${p.py(x)}H${right}` });
  }
  for (let y = Math.ceil(bounds.yMin / step) * step; y <= bounds.yMax; y += step) {
    lines.push({ key: `y${y.toFixed(2)}`, d: `M${p.px(y)},${top}V${bottom}` });
  }
  return (
    <g aria-hidden="true">
      <rect x={left} y={top} width={right - left} height={bottom - top} fill="none" stroke="var(--border)" />
      {lines.map((line) => (
        <path key={line.key} d={line.d} stroke="var(--grid)" strokeWidth={1} />
      ))}
    </g>
  );
}

/** A dimension line for the drawing's scale: 100 mm, or 50 mm when that would be too wide. */
function ScaleBar({ bounds, p }: { bounds: Bounds; p: Projection }) {
  const width = p.px(bounds.yMin) - p.px(bounds.yMax);
  const metres = 0.1 * p.scale > width * 0.35 ? 0.05 : 0.1;
  const length = metres * p.scale;
  const x0 = p.px(bounds.yMax) + 10;
  const y0 = p.py(bounds.xMin) - 10;
  return (
    <g aria-hidden="true">
      <path
        d={`M${x0},${y0 - 4}V${y0 + 4}M${x0},${y0}H${x0 + length}M${x0 + length},${y0 - 4}V${y0 + 4}`}
        stroke="var(--text-faint)"
        strokeWidth={1}
        fill="none"
      />
      <text x={x0 + length / 2} y={y0 - 7} textAnchor="middle" className="fig-axis-text">
        {Math.round(metres * 1000)} mm
      </text>
    </g>
  );
}

/**
 * The gripper seen from above: its jaws close as the opening goes from 1 to 0.
 * Wears the highlighter, as the current element does; what is drawn on the
 * highlighter is in --on-mark, so the jaws read in both themes. `behind`: the
 * gripper is over an object or a close mark, and is drawn under them, larger,
 * as a highlight behind what it covers, with the jaws reaching past it.
 */
export function Gripper({ x, y, opening, behind = false }: { x: number; y: number; opening: number; behind?: boolean }) {
  const open = Math.max(0, Math.min(1, opening));
  const r = behind ? 13 : 9;
  const gap = behind ? 10 + 8 * open : 2 + 8 * open;
  const jaw = behind ? 10 : 12;
  return (
    <g transform={`translate(${x},${y})`} aria-hidden="true">
      <circle r={r} fill="var(--mark)" stroke="var(--on-mark)" strokeWidth={1} />
      <rect x={-gap / 2 - 3} y={-jaw / 2} width={3} height={jaw} rx={0.5} fill="var(--on-mark)" />
      <rect x={gap / 2} y={-jaw / 2} width={3} height={jaw} rx={0.5} fill="var(--on-mark)" />
    </g>
  );
}

export interface PlanProps {
  trace: Trace;
  bounds: Bounds;
  /** The control step drawn. */
  step: number;
  width: number;
  height: number;
  /** The distance the object is moved, from the evaluation's settings, for the label of the jump. */
  movedMm: number | null;
  label: string;
}

/**
 * The table from above at one control step: the objects where they are, the
 * named object's old place once it has been moved, the jump, the gripper's
 * path so far (and faintly the rest), and an x wherever the gripper was told
 * to close, numbered in order.
 */
export function Plan({ trace, bounds, step, width, height, movedMm, label }: PlanProps) {
  const arrowId = useId();
  const pad = 8;
  const p = project(bounds, {
    left: pad,
    top: pad,
    width: width - 2 * pad,
    height: height - 2 * pad,
  });
  const last = trace.steps - 1;
  const at = Math.max(0, Math.min(step, last));
  const moved = trace.moved;
  // The move is applied after its step: the poses show the object at the new place from the next step on.
  const hasMoved = moved !== null && at > moved.step;

  // The path up to the close that decides the episode is drawn in full; what follows it, lightly.
  const decisive = decisiveClose(trace);
  const split = decisive !== null && at > decisive ? decisive : at;
  const past = trace.tcp.slice(0, split + 1);
  const after = split < at ? trace.tcp.slice(split, at + 1) : [];
  const future = trace.tcp.slice(at);
  const closes = closeSteps(trace).filter((close) => close <= at);
  const closeGroups = clusterCloses(
    closes.map((close, index) => ({
      n: index + 1,
      x: p.px(trace.tcp[close][1]),
      y: p.py(trace.tcp[close][0]),
    })),
    14,
  );

  const target = trace.target;
  const style = seriesOf(target);
  const objects = trace.objects.filter((object) => trace.poses[object]?.length);
  const poseAt = (object: ObjectId) => {
    const poses = trace.poses[object]!;
    return poses[Math.min(at, poses.length - 1)];
  };

  // The jump: from the old place to the new one, shortened at both ends so the arrow does not cover the shapes.
  let jump: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    ux: number;
    uy: number;
  } | null = null;
  if (moved) {
    const x1 = p.px(moved.from[1]);
    const y1 = p.py(moved.from[0]);
    const x2 = p.px(moved.to[1]);
    const y2 = p.py(moved.to[0]);
    const length = Math.hypot(x2 - x1, y2 - y1) || 1;
    const ux = (x2 - x1) / length;
    const uy = (y2 - y1) / length;
    jump = {
      x1: x1 + ux * 14,
      y1: y1 + uy * 14,
      x2: x2 - ux * 14,
      y2: y2 - uy * 14,
      ux,
      uy,
    };
  }

  const targetPose = poseAt(target);
  const targetX = p.px(targetPose[1]);
  const targetY = p.py(targetPose[0]);
  const start = trace.tcp[0];
  const current = trace.tcp[at];
  const currentX = p.px(current[1]);
  const currentY = p.py(current[0]);
  // Over the named object or a close mark, the gripper goes behind them, so it never hides them.
  const covers = (x: number, y: number) => Math.hypot(x - currentX, y - currentY) < 14;
  const behind =
    covers(targetX, targetY) ||
    closeGroups.some((group) => covers(group.x, group.y)) ||
    (moved !== null && at > moved.step && covers(p.px(moved.from[1]), p.py(moved.from[0])));
  const gripper = <Gripper x={currentX} y={currentY} opening={trace.grip[at] ?? 1} behind={behind} />;

  // Labels sit on the far side of each place from the other one, so the two never meet.
  const placeLabel = (x: number, y: number, ux: number, uy: number, text: string, muted = false) => {
    // Placed as a box of the text's estimated width (13px condensed: about 6.5px a character), kept inside the drawing.
    const textWidth = text.length * 6.5;
    const cx = x + ux * 22;
    const along = Math.abs(ux) < 0.35 ? 0 : ux > 0 ? textWidth / 2 : -textWidth / 2;
    const centre = Math.max(textWidth / 2 + 4, Math.min(width - textWidth / 2 - 4, cx + along));
    const ly = Math.max(14, Math.min(height - 6, y + uy * 22 + 4));
    return (
      <text x={centre} y={ly} textAnchor="middle" className="fig-axis-text" style={muted ? FAINT_HALO : HALO}>
        {text}
      </text>
    );
  };

  const basePx = p.px(0);
  const showBase = basePx > pad + 40 && basePx < width - pad - 40;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full" role="img" aria-label={label}>
      <defs>
        <marker
          id={arrowId}
          viewBox="0 0 10 10"
          refX={8}
          refY={5}
          markerWidth={7}
          markerHeight={7}
          orient="auto-start-reverse"
        >
          <path d="M0,0L10,5L0,10z" fill="var(--text-muted)" />
        </marker>
      </defs>
      <Grid bounds={bounds} p={p} />
      <ScaleBar bounds={bounds} p={p} />
      {showBase ? (
        <g aria-hidden="true">
          <path
            d={`M${basePx - 5},${p.py(bounds.xMin) - 12}L${basePx},${p.py(bounds.xMin) - 5}L${basePx + 5},${p.py(bounds.xMin) - 12}`}
            fill="none"
            stroke="var(--text-faint)"
            strokeWidth={1.5}
          />
          <text x={basePx + 9} y={p.py(bounds.xMin) - 7} className="fig-axis-text">
            robot base
          </text>
        </g>
      ) : null}

      {/* The path still to come, faint, so scrubbing shows where it goes. */}
      <path
        d={pathOf(future, p)}
        fill="none"
        stroke="var(--border-strong)"
        strokeWidth={1}
        strokeDasharray="2 3"
        aria-hidden="true"
      />

      {/* The jump, from the old place to the new one. */}
      {hasMoved && jump ? (
        <line
          x1={jump.x1}
          y1={jump.y1}
          x2={jump.x2}
          y2={jump.y2}
          stroke="var(--text-muted)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          markerEnd={`url(#${arrowId})`}
          aria-hidden="true"
        />
      ) : null}

      {behind ? gripper : null}

      {/* The objects where they are at this step; the named one larger. */}
      {objects.map((object) => {
        const pose = poseAt(object);
        const series = seriesOf(object);
        const named = object === target;
        return (
          <Marker
            key={object}
            shape={series.shape}
            x={p.px(pose[1])}
            y={p.py(pose[0])}
            size={named ? 16 : 12}
            color={series.color}
            aria-hidden="true"
          />
        );
      })}

      {/* Where it started. */}
      <g aria-hidden="true">
        <rect
          x={p.px(start[1]) - 4}
          y={p.py(start[0]) - 4}
          width={8}
          height={8}
          fill="var(--surface)"
          stroke="var(--text)"
          strokeWidth={1.5}
        />
      </g>

      {/* The path after the deciding close: thin and faint, so it does not scribble over the places. */}
      {after.length > 1 ? (
        <path
          d={pathOf(after, p)}
          fill="none"
          stroke="var(--text-faint)"
          strokeWidth={1}
          strokeLinejoin="round"
          strokeLinecap="round"
          aria-hidden="true"
        />
      ) : null}

      {/* The path so far, up to the deciding close. */}
      <path
        d={pathOf(past, p)}
        fill="none"
        stroke="var(--text)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        aria-hidden="true"
      />

      {/* The old place, once the object has left it: above the path, so the path cannot hide it. */}
      {hasMoved && moved ? (
        <Marker
          shape={style.shape}
          x={p.px(moved.from[1])}
          y={p.py(moved.from[0])}
          size={20}
          color={style.color}
          hollow
          strokeDasharray="3 2"
          aria-hidden="true"
        />
      ) : null}

      {/* Every close so far, numbered. */}
      <g aria-hidden="true">
        {closeGroups.map((group) => (
          <g key={`${group.label}-${group.x}`}>
            <CloseMark x={group.x} y={group.y} />
            <text x={group.x + 9} y={group.y - 8} className="fig-axis-text" style={HALO}>
              {group.label}
            </text>
          </g>
        ))}
      </g>

      {/* Labels: the named object, its old and new places, the jump. */}
      <g aria-hidden="true">
        {hasMoved && moved && jump ? (
          <>
            {placeLabel(p.px(moved.from[1]), p.py(moved.from[0]), -jump.ux, -jump.uy, "old place", true)}
            {placeLabel(p.px(moved.to[1]), p.py(moved.to[0]), jump.ux, jump.uy, "new place")}
            {movedMm !== null ? (
              <text
                x={(jump.x1 + jump.x2) / 2 - jump.uy * 12}
                y={(jump.y1 + jump.y2) / 2 + jump.ux * 12 + 4}
                textAnchor="middle"
                className="fig-axis-text"
                style={FAINT_HALO}
              >
                {movedMm} mm
              </text>
            ) : null}
          </>
        ) : (
          <text x={targetX} y={targetY - 14} textAnchor="middle" className="fig-axis-text" style={HALO}>
            named
          </text>
        )}
        <text x={p.px(start[1]) + 14} y={p.py(start[0]) + 4} className="fig-axis-text" style={FAINT_HALO}>
          start
        </text>
      </g>

      {behind ? null : gripper}
    </svg>
  );
}

/** A small plan of a whole rollout for the list of actors: path, old place, where it closed. No text. */
export function Thumbnail({ trace, bounds, size }: { trace: Trace; bounds: Bounds; size: number }) {
  const p = project(bounds, {
    left: 3,
    top: 3,
    width: size - 6,
    height: size - 6,
  });
  const style = seriesOf(trace.target);
  const end = trace.steps - 1;
  const targetPoses = trace.poses[trace.target];
  const final = targetPoses?.[Math.min(end, targetPoses.length - 1)];
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      focusable="false"
      className="block flex-none"
    >
      <rect x={0.5} y={0.5} width={size - 1} height={size - 1} fill="var(--surface)" stroke="var(--border)" />
      {trace.moved ? (
        <Marker
          shape={style.shape}
          x={p.px(trace.moved.from[1])}
          y={p.py(trace.moved.from[0])}
          size={9}
          color={style.color}
          hollow
          strokeDasharray="2 1.5"
          ring={false}
        />
      ) : null}
      {final ? (
        <Marker shape={style.shape} x={p.px(final[1])} y={p.py(final[0])} size={9} color={style.color} ring={false} />
      ) : null}
      <path d={pathOf(trace.tcp, p)} fill="none" stroke="var(--text)" strokeWidth={1.25} strokeLinejoin="round" />
      {closeSteps(trace).map((close) => (
        <CloseMark key={close} x={p.px(trace.tcp[close][1])} y={p.py(trace.tcp[close][0])} size={6} />
      ))}
    </svg>
  );
}
