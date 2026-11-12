"use client";

import { useRef } from "react";
import type { Machine } from "@/data/types";
import { Marker, useElementSize } from "@/figures/kit";
import { formatCount } from "@/data/format";
import { CUBE_WIDTH_MM, FINGER_SPAN_MM, PLAN_SHAPES, type PlanKind } from "./geometry";
import { ALL_OFFSETS, countAt, machineName, percentAt, rowAt, wilson, type ObjectLine } from "./model";
import { useSettledWidth } from "./useSettledWidth";

/** The direction the drawing places the gripper in. The experiment draws a random one per episode. */
const DIRECTION = (-32 * Math.PI) / 180;
/** The finger depth: drawn only, no source gives it. */
const FINGER_MM = 4;

/** The object's outline in plan, centred on 0,0, `r` (half the cube's width) from the centre. */
function outline(kind: PlanKind, r: number): string {
  switch (kind) {
    case "box":
      return `M${-r},${-r}H${r}V${r}H${-r}z`;
    case "tee": {
      const w = r * 1.05;
      const t = r * 0.42;
      return `M${-w},${-r}H${w}V${-r + t * 1.4}H${t / 2 + 0.01}V${r}H${-t / 2}V${-r + t * 1.4}H${-w}z`;
    }
    case "cylinder":
    default:
      return `M${-r},0A${r},${r} 0 1,0 ${r},0A${r},${r} 0 1,0 ${-r},0z`;
  }
}

export interface PlanCellProps {
  object: ObjectLine;
  machine: Machine;
  compare: Machine[];
  offsetMm: number;
  animate: boolean;
}

/**
 * One object in plan with the gripper placed the offset away from the
 * expert's grasp point, and the measured success at that offset.
 */
export function PlanCell({ object, machine, compare, offsetMm, animate }: PlanCellProps) {
  const box = useRef<HTMLDivElement>(null);
  const { width: measured } = useElementSize(box);
  const width = measured || 200;
  const height = Math.round(Math.min(160, Math.max(116, width * 0.72)));

  // Everything is drawn in mm on one scale, chosen so that the hand fits at the largest offset in the
  // drawn direction and the dashed circle of every direction fits above and below.
  const maxOffset = ALL_OFFSETS[ALL_OFFSETS.length - 1] || 1;
  const jaw = FINGER_SPAN_MM / 2;
  const across = jaw + FINGER_MM + maxOffset * Math.cos(DIRECTION) + jaw + FINGER_MM;
  const tall = 2 * Math.max(maxOffset, CUBE_WIDTH_MM / 2);
  const perMm = Math.max(0, Math.min((width - 8) / across, (height - 8) / tall));
  const centre = { x: 4 + (jaw + FINGER_MM) * perMm, y: height / 2 };
  const radius = (CUBE_WIDTH_MM / 2) * perMm;
  const plan = PLAN_SHAPES[object.id];
  const distance = offsetMm * perMm;
  const gx = centre.x + distance * Math.cos(DIRECTION);
  const gy = centre.y + distance * Math.sin(DIRECTION);
  const half = jaw * perMm;
  const finger = FINGER_MM * perMm;
  const body = Math.max(5, radius * 0.32);
  // The dimension's value sits beside the middle of the line, on the side away from the gripper's hand.
  const labelX = centre.x + (distance / 2) * Math.cos(DIRECTION) - 13 * Math.sin(DIRECTION);
  const labelY = centre.y + (distance / 2) * Math.sin(DIRECTION) + 13 * Math.cos(DIRECTION) + 4;

  const row = rowAt(machine, offsetMm);
  const percent = percentAt(row, object.id);
  const count = countAt(row, object.id);
  const interval = count ? wilson(count) : undefined;
  // Only a change of the offset moves the gripper: not the first measurement, not a resize.
  const settled = useSettledWidth(measured);
  const transition = animate && settled ? "transform 500ms var(--ease-standard)" : "none";

  return (
    <li className="min-w-0 border-t border-line pt-2">
      <div className="flex items-center gap-1.5 text-13 font-medium text-ink-muted stretch-88">
        <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden="true" focusable="false">
          <Marker shape={object.style.shape} x={7} y={7} size={10} color={object.style.color} ring={false} />
        </svg>
        <span className="truncate">{object.short}</span>
      </div>

      <div ref={box}>
        <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full" aria-hidden="true" focusable="false">
          {/* Every place the gripper could be put at this offset: the direction is random. */}
          <circle
            r={1}
            fill="none"
            stroke="var(--text-faint)"
            strokeWidth={1}
            strokeDasharray="2 3"
            vectorEffect="non-scaling-stroke"
            style={{
              transform: `translate(${centre.x}px,${centre.y}px) scale(${Math.max(distance, 0.001)})`,
              transition,
              opacity: distance > 0 ? 1 : 0,
            }}
          />

          <path
            d={outline(plan.kind, radius)}
            transform={`translate(${centre.x},${centre.y})`}
            fill={object.style.color}
            fillOpacity={plan.toScale ? 0.16 : 0.08}
            stroke={object.style.color}
            strokeWidth={plan.toScale ? 2 : 1.5}
            strokeLinejoin="round"
          />
          {/* The expert's grasp point. */}
          <g stroke="var(--text)" strokeWidth={1}>
            <line x1={centre.x - 4} x2={centre.x + 4} y1={centre.y} y2={centre.y} />
            <line x1={centre.x} x2={centre.x} y1={centre.y - 4} y2={centre.y + 4} />
          </g>

          {/* The gripper from above: the hand, open, with a finger at each end of its closing axis. */}
          <g style={{ transform: `translate(${gx}px,${gy}px)`, transition }}>
            <rect
              x={-half - Math.max(3, finger)}
              y={-body / 2}
              width={2 * (half + Math.max(3, finger))}
              height={body}
              rx={2}
              fill="var(--text)"
              fillOpacity={0.07}
              stroke="var(--text)"
              strokeWidth={1.5}
            />
            <rect x={-half - Math.max(3, finger)} y={-body * 0.9} width={Math.max(3, finger)} height={body * 1.8} rx={1} fill="var(--text)" />
            <rect x={half} y={-body * 0.9} width={Math.max(3, finger)} height={body * 1.8} rx={1} fill="var(--text)" />
            <circle r={2} fill="var(--text)" />
          </g>

          {/* The offset as a dimension line, from the grasp point to the gripper's centre. */}
          <g style={{ transform: `translate(${centre.x}px,${centre.y}px) rotate(${DIRECTION}rad)` }}>
            <g
              stroke="var(--text-muted)"
              strokeWidth={1}
              style={{ transform: `scaleX(${Math.max(distance, 0.001)})`, transition, opacity: distance > 0 ? 1 : 0 }}
            >
              <line x1={0} x2={1} y1={0} y2={0} vectorEffect="non-scaling-stroke" />
              <line x1={1} x2={1} y1={-4} y2={4} vectorEffect="non-scaling-stroke" />
            </g>
          </g>
          <text
            textAnchor="start"
            className="fig-axis-text"
            style={{
              fill: "var(--text)",
              stroke: "var(--surface)",
              strokeWidth: 3,
              paintOrder: "stroke",
              transform: `translate(${labelX}px,${labelY}px)`,
              transition,
              opacity: distance > 0 ? 1 : 0,
            }}
          >
            {offsetMm} mm
          </text>
        </svg>
      </div>

      <p className="m-0 flex items-baseline gap-2">
        <span className="text-24 font-semibold text-ink stretch-90">{percent === undefined ? "–" : `${percent}%`}</span>
        {count ? (
          <span className="label text-ink-faint">{formatCount(count.successes, count.episodes)}</span>
        ) : null}
      </p>

      {/* The rate on a 0 to 100% track, with its 95% interval where there are counts. */}
      <div className="relative mt-1 h-3" aria-hidden="true">
        <span className="absolute inset-x-0 top-[5px] h-[2px] bg-line" />
        {interval ? (
          <span
            className="absolute top-[5px] h-[2px]"
            style={{
              left: `${100 * interval[0]}%`,
              width: `${100 * (interval[1] - interval[0])}%`,
              backgroundColor: object.style.color,
            }}
          />
        ) : null}
        {compare.map((other) => {
          const otherPercent = percentAt(rowAt(other, offsetMm), object.id);
          return otherPercent === undefined ? null : (
            <span
              key={other}
              className="absolute top-[1px] block size-[10px] -translate-x-1/2 rounded-full border-[1.5px] bg-surface"
              style={{ left: `${otherPercent}%`, borderColor: object.style.color }}
            />
          );
        })}
        {percent !== undefined ? (
          <span
            className="absolute top-[1px] block size-[10px] -translate-x-1/2 rounded-full border-2 border-surface"
            style={{ left: `${percent}%`, backgroundColor: object.style.color }}
          />
        ) : null}
      </div>

      {compare.map((other) => {
        const otherPercent = percentAt(rowAt(other, offsetMm), object.id);
        return (
          <p key={other} className="m-0 mt-1.5 label text-ink-muted">
            <span
              className="mr-1.5 inline-block size-[9px] rounded-full border-[1.5px] align-[-1px]"
              style={{ borderColor: object.style.color }}
              aria-hidden="true"
            />
            {machineName(other)}: {otherPercent === undefined ? "not measured" : `${otherPercent}%`}
          </p>
        );
      })}

      <p className="m-0 mt-1.5 label text-ink-muted">{plan.tag}</p>
    </li>
  );
}
