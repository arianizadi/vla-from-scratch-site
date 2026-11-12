"use client";

import { useRef } from "react";
import { Marker, useElementSize } from "@/figures/kit";
import { formatMm } from "@/data/format";
import { OBJECTS } from "@/data/labels";
import type { ObjectId } from "@/data/types";
import { EpisodeMark, seriesOf } from "./Map";
import { RINGS_MM, type Dot } from "./model";

/** Drawn this wide until measured, and in the static HTML. */
const DEFAULT_WIDTH = 288;
const MAX_WIDTH = 420;
/** Room around the layout for the labels, and below it for the scale bar. */
const PAD_X = 64;
const PAD_TOP = 48;
const PAD_BOTTOM = 52;
const OBJECT_SIZE = 14;
const GRIPPER_SIZE = 10;
const LINE_HEIGHT = 15;
/** Width of one character of 13 px axis text, generously. */
const CHAR_PX = 6.6;
const SCALE_BARS_MM = [10, 20, 50, 100, 200, 500];

const mm = (from: [number, number], to: [number, number]) => Math.hypot(to[0] - from[0], to[1] - from[1]) * 1000;

interface Place {
  key: string;
  id: ObjectId;
  position: [number, number];
  /** The object is there at the close (false for where a moved object stood). */
  present: boolean;
  name: string;
  /** Distance from where the gripper closed, mm. */
  distance: number;
}

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const overlap = (a: Box, b: Box) =>
  Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));

interface Label {
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
  lines: string[];
}

/**
 * Places each label on one of the four sides of its marker (or a corner): the first side
 * where it overlaps no marker, no label placed before it and stays inside the
 * drawing; failing that, the side where it overlaps least.
 */
function placeLabels(
  items: { x: number; y: number; r: number; lines: string[] }[],
  obstacles: Box[],
  bounds: Box,
): Label[] {
  const taken = [...obstacles];
  return items.map((item) => {
    const width = Math.max(...item.lines.map((line) => line.length)) * CHAR_PX + 4;
    const height = item.lines.length * LINE_HEIGHT;
    const gap = item.r + 5;
    const candidates: { box: Box; label: Label }[] = [
      { box: { x0: item.x + gap, y0: item.y - height / 2, x1: item.x + gap + width, y1: item.y + height / 2 }, anchor: "start" as const, tx: item.x + gap },
      { box: { x0: item.x - gap - width, y0: item.y - height / 2, x1: item.x - gap, y1: item.y + height / 2 }, anchor: "end" as const, tx: item.x - gap },
      { box: { x0: item.x - width / 2, y0: item.y - gap - height, x1: item.x + width / 2, y1: item.y - gap }, anchor: "middle" as const, tx: item.x },
      { box: { x0: item.x - width / 2, y0: item.y + gap, x1: item.x + width / 2, y1: item.y + gap + height }, anchor: "middle" as const, tx: item.x },
      // The corners, when every side is taken.
      { box: { x0: item.x + gap * 0.7, y0: item.y - gap * 0.7 - height, x1: item.x + gap * 0.7 + width, y1: item.y - gap * 0.7 }, anchor: "start" as const, tx: item.x + gap * 0.7 },
      { box: { x0: item.x - gap * 0.7 - width, y0: item.y - gap * 0.7 - height, x1: item.x - gap * 0.7, y1: item.y - gap * 0.7 }, anchor: "end" as const, tx: item.x - gap * 0.7 },
      { box: { x0: item.x + gap * 0.7, y0: item.y + gap * 0.7, x1: item.x + gap * 0.7 + width, y1: item.y + gap * 0.7 + height }, anchor: "start" as const, tx: item.x + gap * 0.7 },
      { box: { x0: item.x - gap * 0.7 - width, y0: item.y + gap * 0.7, x1: item.x - gap * 0.7, y1: item.y + gap * 0.7 + height }, anchor: "end" as const, tx: item.x - gap * 0.7 },
    ].map(({ box, anchor, tx }) => ({
      box,
      // The baseline of the first line: text of 13 px sits about 10 px above its baseline.
      label: { x: tx, y: box.y0 + 11, anchor, lines: item.lines },
    }));
    let best = candidates[0];
    let bestCost = Number.POSITIVE_INFINITY;
    for (const candidate of candidates) {
      const { box } = candidate;
      const outside =
        Math.max(0, bounds.x0 - box.x0) + Math.max(0, box.x1 - bounds.x1) + Math.max(0, bounds.y0 - box.y0) + Math.max(0, box.y1 - bounds.y1);
      const cost = taken.reduce((sum, other) => sum + overlap(box, other), 0) + outside * 40;
      if (cost < bestCost) {
        best = candidate;
        bestCost = cost;
      }
      if (cost === 0) break;
    }
    taken.push(best.box);
    return best.label;
  });
}

/**
 * The layout of one episode, top down and to scale: where the gripper first
 * closed, the objects of the layout around it (a moved object where it stood
 * and where it was put), each labelled with its distance from the gripper,
 * and rings at 10, 20 and 30 mm around the named object. Unlike the map, which
 * compresses everything beyond 30 mm, distances between any two points here
 * compare truly, so the object drawn nearest the gripper is the nearest one.
 */
export function LayoutPlan({ dot, title }: { dot: Dot; title: string }) {
  const box = useRef<HTMLDivElement>(null);
  const { width: measured } = useElementSize(box);
  const width = Math.min(MAX_WIDTH, measured || DEFAULT_WIDTH);

  // ------------------------------------------------------------ what is drawn
  const named = dot.moved ? dot.moved.from : dot.objects[dot.target];
  const places: Place[] = [];
  for (const [id, position] of Object.entries(dot.objects) as [ObjectId, [number, number]][]) {
    if (id === dot.target && dot.moved) continue;
    places.push({
      key: id,
      id,
      position,
      present: true,
      name: id === dot.target ? `${OBJECTS[id].short}, named` : OBJECTS[id].short,
      distance: mm(position, dot.tcp),
    });
  }
  if (dot.moved) {
    places.push({
      key: "from",
      id: dot.target,
      position: dot.moved.from,
      present: false,
      name: `${OBJECTS[dot.target].short}, named: stood`,
      distance: mm(dot.moved.from, dot.tcp),
    });
    places.push({
      key: "to",
      id: dot.target,
      position: dot.moved.to,
      present: true,
      name: `${OBJECTS[dot.target].short}, moved here`,
      distance: mm(dot.moved.to, dot.tcp),
    });
  }
  // The nearest object as the per-episode file names it, at the place the file gives for it, so the
  // plan and the status line agree (2D distances between the same points agree with it).
  const nearestAt = dot.nearest ? dot.objects[dot.nearest] : undefined;
  const nearest = nearestAt
    ? places
        .filter((place) => place.id === dot.nearest)
        .reduce<Place | undefined>(
          (best, place) => (best === undefined || mm(place.position, nearestAt) < mm(best.position, nearestAt) ? place : best),
          undefined,
        )
    : undefined;

  // ------------------------------------------------------------ the scale: one for both axes
  // Seen from above with the robot at the bottom: away from the robot (+x) is up, its left (+y) is left.
  const toPlane = (point: [number, number]) => ({ u: -point[1] * 1000, v: -point[0] * 1000 });
  const outer = RINGS_MM[RINGS_MM.length - 1];
  const extents = [
    toPlane(dot.tcp),
    ...places.map((place) => toPlane(place.position)),
    ...(named ? [toPlane(named)].flatMap(({ u, v }) => [{ u: u - outer, v: v - outer }, { u: u + outer, v: v + outer }]) : []),
  ];
  const u0 = Math.min(...extents.map((point) => point.u));
  const u1 = Math.max(...extents.map((point) => point.u));
  const v0 = Math.min(...extents.map((point) => point.v));
  const v1 = Math.max(...extents.map((point) => point.v));
  const spanU = Math.max(u1 - u0, 1);
  const spanV = Math.max(v1 - v0, 1);
  const innerWidth = width - 2 * PAD_X;
  const scale = Math.min(innerWidth / spanU, (width * 1.1) / spanV);
  const height = Math.round(spanV * scale + PAD_TOP + PAD_BOTTOM);
  const offsetX = PAD_X + (innerWidth - spanU * scale) / 2;
  const screen = (point: [number, number]) => {
    const { u, v } = toPlane(point);
    return { x: offsetX + (u - u0) * scale, y: PAD_TOP + (v - v0) * scale };
  };

  const gripper = screen(dot.tcp);
  const drawn = places.map((place) => ({ ...place, at: screen(place.position) }));
  const centre = named ? screen(named) : undefined;
  const bar = [...SCALE_BARS_MM].reverse().find((length) => length * scale <= width * 0.34) ?? SCALE_BARS_MM[0];

  const objectR = OBJECT_SIZE / 2;
  const obstacles: Box[] = [
    ...drawn.map(({ at }) => ({ x0: at.x - objectR - 1, y0: at.y - objectR - 1, x1: at.x + objectR + 1, y1: at.y + objectR + 1 })),
    { x0: gripper.x - 11, y0: gripper.y - 11, x1: gripper.x + 11, y1: gripper.y + 11 },
    // The words at the top and the bottom.
    { x0: width / 2 - 70, y0: 0, x1: width / 2 + 70, y1: 20 },
    { x0: 0, y0: height - 30, x1: width, y1: height },
  ];
  const labels = placeLabels(
    [
      ...drawn.map((place) => ({
        x: place.at.x,
        y: place.at.y,
        r: objectR,
        lines: [place.name, `${formatMm(place.distance)}${place.key === nearest?.key ? ", nearest" : ""}`],
      })),
      { x: gripper.x, y: gripper.y, r: 11, lines: ["gripper closed"] },
    ],
    obstacles,
    { x0: 2, y0: 2, x1: width - 2, y1: height - 30 },
  );

  return (
    <div ref={box} className="gm-plan-box">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="gm-plan-svg"
        aria-hidden="true"
        focusable="false"
      >
        <rect x={0.5} y={0.5} width={width - 1} height={height - 1} rx={2} className="gm-plan-ground" />
        <text x={width / 2} y={14} textAnchor="middle" className="fig-axis-text">
          away from the robot
        </text>

        {centre
          ? RINGS_MM.map((ring) => (
              <circle key={ring} cx={centre.x} cy={centre.y} r={ring * scale} className="gm-plan-ring" />
            ))
          : null}

        {/* Leaders from the gripper to each object, ending in a dot at the object's edge. */}
        {drawn.map(({ key, at }) => {
          const dx = at.x - gripper.x;
          const dy = at.y - gripper.y;
          const length = Math.hypot(dx, dy);
          const stop = objectR + 3;
          if (length < stop + 8) return null;
          const ex = at.x - (dx / length) * stop;
          const ey = at.y - (dy / length) * stop;
          const sx = gripper.x + (dx / length) * 9;
          const sy = gripper.y + (dy / length) * 9;
          return (
            <g key={key}>
              <line x1={sx} y1={sy} x2={ex} y2={ey} className="gm-leader" />
              <circle cx={ex} cy={ey} r={1.5} className="gm-leader-dot" />
            </g>
          );
        })}

        {drawn.map(({ key, id, at, present }) => {
          const series = seriesOf(id);
          return (
            <g key={key} opacity={present ? 1 : 0.6}>
              <Marker x={at.x} y={at.y} size={OBJECT_SIZE} shape={series.shape} color={series.color} hollow />
            </g>
          );
        })}

        <g transform={`translate(${gripper.x},${gripper.y})`}>
          <circle r={GRIPPER_SIZE / 2 + 6} className="gm-highlight" />
          <EpisodeMark dot={dot} size={GRIPPER_SIZE} />
        </g>

        {labels.map((label, index) => (
          <text key={index} x={label.x} y={label.y} textAnchor={label.anchor} className="fig-axis-text gm-halo gm-object-label">
            {label.lines.map((line, lineIndex) => (
              <tspan key={lineIndex} x={label.x} dy={lineIndex === 0 ? 0 : LINE_HEIGHT} className={lineIndex === 0 ? undefined : "gm-plan-distance"}>
                {line}
              </tspan>
            ))}
          </text>
        ))}

        {/* Scale bar. */}
        <g transform={`translate(12,${height - 18})`}>
          <path d={`M0,-4V0H${bar * scale}V-4`} className="gm-plan-bar" />
          <text x={bar * scale + 6} y={4} className="fig-axis-text">
            {`${bar} mm`}
          </text>
        </g>
        <text x={width - 10} y={height - 14} textAnchor="end" className="fig-axis-text">
          toward the robot
        </text>
      </svg>
      <p className="gm-plan-caption">
        {title} Drawn to scale; each object is labelled with its distance from where the gripper closed. Rings at{" "}
        {RINGS_MM.join(", ")} mm around {dot.moved ? "where the named object stood" : "the named object"}.
      </p>
    </div>
  );
}
