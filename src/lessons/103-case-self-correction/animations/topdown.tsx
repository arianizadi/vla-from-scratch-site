"use client";

import { Move, type Tone } from "@/animations";

/* The table seen from above, for this lesson's drawings: objects as their
   outlines from above, the gripper as a ring with two fingers, and a cross
   where the gripper closed. */

export type TopKind = "can" | "cube" | "nut";

/** An object from above, centred on (x, y). */
export function TopObject({
  kind,
  x,
  y,
  tone = "muted",
  ghost = false,
  opacity,
  delay,
}: {
  kind: TopKind;
  x: number;
  y: number;
  tone?: Tone;
  /** Dashed outline only: where the object used to be. */
  ghost?: boolean;
  opacity?: number;
  delay?: number;
}) {
  const className = `t-${tone} ${ghost ? "a-stroke" : "a-fill-soft a-stroke"}`;
  const dash = ghost ? "4 4" : undefined;
  const fill = ghost ? "none" : undefined;
  return (
    <Move x={x} y={y} opacity={opacity} delay={delay}>
      {kind === "can" ? (
        <circle r={14} className={className} strokeWidth={2} strokeDasharray={dash} fill={fill} />
      ) : kind === "cube" ? (
        <rect x={-13} y={-13} width={26} height={26} rx={4} className={className} strokeWidth={2} strokeDasharray={dash} fill={fill} />
      ) : (
        <path d="M-15 0L-7.5 -13H7.5L15 0L7.5 13H-7.5Z" className={className} strokeWidth={2} strokeDasharray={dash} fill={fill} strokeLinejoin="round" />
      )}
    </Move>
  );
}

/** The gripper from above: a ring and two fingers. */
export function TopGripper({ x, y, closed = false, opacity, delay }: { x: number; y: number; closed?: boolean; opacity?: number; delay?: number }) {
  const spread = closed ? 4 : 10;
  return (
    <Move x={x} y={y} opacity={opacity} delay={delay}>
      <circle r={7} className="t-ink a-fill" />
      <g className="a-t" style={{ transform: `translate(${-spread}px, 0px)` }}>
        <rect x={-3} y={-12} width={4} height={24} rx={2} className="t-ink a-fill" />
      </g>
      <g className="a-t" style={{ transform: `translate(${spread}px, 0px)` }}>
        <rect x={-1} y={-12} width={4} height={24} rx={2} className="t-ink a-fill" />
      </g>
    </Move>
  );
}

/** A cross where the gripper closed. */
export function CloseMark({ x, y, tone = "failure", opacity, delay }: { x: number; y: number; tone?: Tone; opacity?: number; delay?: number }) {
  return (
    <Move x={x} y={y} opacity={opacity} delay={delay}>
      <path d="M-8 -8L8 8M8 -8L-8 8" className={`t-${tone} a-stroke`} strokeWidth={3} strokeLinecap="round" />
    </Move>
  );
}
