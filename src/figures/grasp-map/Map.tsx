"use client";

import { useRef, useState, type PointerEvent } from "react";
import { Marker, OBJECT_SERIES, type MarkerShape } from "@/figures/kit";
import { OBJECTS } from "@/data/labels";
import type { ObjectId } from "@/data/types";
import { EDGE_MM, OUTER_RINGS_MM, RINGS_MM, project, radial, type Dot } from "./model";

export interface MapProps {
  /** Side of the square drawing, px. */
  size: number;
  dots: Dot[];
  /** The episode being inspected (its seed), or null. */
  inspected: number | null;
  onInspect: (seed: number | null) => void;
  /** The episodes are being replaced: draw the old ones faded. */
  stale: boolean;
  /** Text alternative of the drawing in its current state. */
  label: string;
}

const MARGIN = 30;
/** How close (px) the pointer must come to a dot to pick it. */
const PICK_PX = 18;

export const seriesOf = (object: ObjectId) => OBJECT_SERIES[OBJECTS[object].series];

/**
 * A failed episode: the named object's shape, hollow, with a slash through it.
 * The shape says which object was named and the slash says it was not lifted,
 * so neither depends on colour.
 */
export function FailMark({ size, color, shape }: { size: number; color: string; shape: MarkerShape }) {
  const r = (size / 2) * 1.25;
  const d = `M${-r},${r}L${r},${-r}`;
  return (
    <g>
      <Marker x={0} y={0} size={size} shape={shape} color={color} hollow />
      <path d={d} stroke="var(--surface)" strokeWidth={3.5} strokeLinecap="round" />
      <path d={d} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </g>
  );
}

/** One episode's mark: the named object's shape and colour, filled where it was lifted, hollow and slashed where it was not. */
export function EpisodeMark({ dot, size }: { dot: Pick<Dot, "target" | "success">; size: number }) {
  const series = seriesOf(dot.target);
  return dot.success ? (
    <Marker x={0} y={0} size={size} shape={series.shape} color={series.color} />
  ) : (
    <FailMark size={size} shape={series.shape} color={series.color} />
  );
}

/**
 * The map: rings around the reference object, to scale up to 30 mm and
 * compressed beyond, one mark per episode where the gripper first closed.
 * Marks are keyed by the layout's seed, so when the evaluation or the centre
 * changes, each layout's mark travels from its old place to its new one (a
 * CSS transition, which the global stylesheet cuts short under reduced
 * motion).
 *
 * The compression keeps each mark's distance from the centre and nothing
 * else, so the map draws only the cloud of marks; the layout of an inspected
 * episode is drawn to scale beside it (Plan.tsx). A click or a tap picks an
 * episode; hovering only highlights a mark, and announces nothing.
 */
export function GraspMap({ size, dots, inspected, onInspect, stale, label }: MapProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const centre = size / 2;
  const radius = centre - MARGIN;
  const markSize = size < 400 ? 9 : 10;
  const current = inspected === null ? undefined : dots.find((dot) => dot.seed === inspected);
  const hover = hovered === null || hovered === inspected ? undefined : dots.find((dot) => dot.seed === hovered);

  const pick = (event: PointerEvent<SVGSVGElement>): Dot | undefined => {
    const box = svg.current?.getBoundingClientRect();
    if (!box || box.width === 0) return undefined;
    const scale = size / box.width;
    const px = (event.clientX - box.left) * scale - centre;
    const py = (event.clientY - box.top) * scale - centre;
    let best: Dot | undefined;
    let bestDistance = PICK_PX * scale;
    for (const dot of dots) {
      const at = project(dot, radius);
      const distance = Math.hypot(at.x - px, at.y - py);
      if (distance < bestDistance) {
        best = dot;
        bestDistance = distance;
      }
    }
    return best;
  };

  const ringLabel = (mm: number, last: boolean) => (last ? `${mm} mm` : `${mm}`);
  const labelY = (mm: number) => centre - radial(mm) * radius;

  return (
    <svg
      ref={svg}
      viewBox={`0 0 ${size} ${size}`}
      className={hover ? "gm-svg gm-svg-pick" : "gm-svg"}
      role="img"
      aria-label={label}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse") return;
        setHovered(pick(event)?.seed ?? null);
      }}
      onPointerLeave={() => setHovered(null)}
      onPointerDown={(event) => {
        // A click or a tap picks the nearest mark; on empty ground it lets the episode go.
        if (event.pointerType === "mouse" && event.button !== 0) return;
        onInspect(pick(event)?.seed ?? null);
      }}
    >
      {/* The compressed part, then the part drawn to scale on top of it. */}
      <circle cx={centre} cy={centre} r={radius} className="gm-outer" />
      {OUTER_RINGS_MM.map((mm) => (
        <circle key={mm} cx={centre} cy={centre} r={radial(mm) * radius} className="gm-ring-outer" />
      ))}
      <circle cx={centre} cy={centre} r={radial(RINGS_MM[RINGS_MM.length - 1]) * radius} className="gm-inner" />
      {RINGS_MM.slice(0, -1).map((mm) => (
        <circle key={mm} cx={centre} cy={centre} r={radial(mm) * radius} className="gm-ring" />
      ))}
      <line x1={centre} x2={centre} y1={MARGIN} y2={size - MARGIN} className="gm-axis" />
      <line x1={MARGIN} x2={size - MARGIN} y1={centre} y2={centre} className="gm-axis" />

      {/* Which way is which: the robot stands below the map. */}
      <text x={centre} y={13} textAnchor="middle" className="fig-axis-text">
        away from the robot
      </text>
      <text x={centre} y={size - 6} textAnchor="middle" className="fig-axis-text">
        toward the robot
      </text>

      <g className={stale ? "gm-dots gm-stale" : "gm-dots"}>
        {dots.map((dot) => {
          const at = project(dot, radius);
          return (
            <g
              key={dot.seed}
              className="gm-dot"
              style={{ transform: `translate(${(centre + at.x).toFixed(1)}px, ${(centre + at.y).toFixed(1)}px)` }}
            >
              <EpisodeMark dot={dot} size={markSize} />
            </g>
          );
        })}
      </g>

      {/* Ring distances, over the marks, with a halo. */}
      {[...RINGS_MM, ...OUTER_RINGS_MM].map((mm, index) => (
        <text key={mm} x={centre + 5} y={labelY(mm) - 4} className="fig-axis-text gm-halo">
          {ringLabel(mm, index === RINGS_MM.length - 1 || index === RINGS_MM.length + OUTER_RINGS_MM.length - 1)}
        </text>
      ))}
      <text x={centre + 5} y={centre + radius - 6} className="fig-axis-text gm-halo">
        {`${EDGE_MM} mm`}
      </text>

      {hover ? <Highlight dot={hover} centre={centre} radius={radius} markSize={markSize} kind="hover" /> : null}
      {current ? <Highlight dot={current} centre={centre} radius={radius} markSize={markSize} kind="inspected" /> : null}
    </svg>
  );
}

/** A mark brought to the front with a ring: the inspected episode, or the one under the pointer. */
function Highlight({
  dot,
  centre,
  radius,
  markSize,
  kind,
}: {
  dot: Dot;
  centre: number;
  radius: number;
  markSize: number;
  kind: "hover" | "inspected";
}) {
  const at = project(dot, radius);
  return (
    <g pointerEvents="none" transform={`translate(${centre + at.x},${centre + at.y})`}>
      <circle r={markSize / 2 + 6} className={kind === "inspected" ? "gm-highlight" : "gm-hover"} />
      <EpisodeMark dot={dot} size={markSize} />
    </g>
  );
}
