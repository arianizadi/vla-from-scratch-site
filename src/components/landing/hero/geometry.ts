/**
 * Geometry of the hero plate: a plan of the pick_target table, 720 x 540
 * drawing units, one unit to one millimetre on the table. The layout is
 * illustrative; the distances and counts come from src/data/lab.ts.
 *
 * Everything is rounded to a tenth of a unit so the server and the browser
 * print the same coordinates.
 */

import { camera, chunking } from "@/data/lab";

export interface Point {
  x: number;
  y: number;
}

export type ObjectId = "cube" | "can" | "nut";

export const VIEW = { width: 720, height: 540 } as const;
export const TABLE = { x: 24, y: 96, width: 456, height: 420 } as const;
export const BASE: Point = { x: 252, y: 486 };
/** Where the gripper starts each episode. */
export const START: Point = { x: 252, y: 452 };
export const INSET = { x: 504, y: 96, size: 192 } as const;
export const CELL = INSET.size / camera.grid;

interface TableObject {
  /** How the instruction names it. */
  label: string;
  words: string[];
  center: Point;
  /** Half the object's width in the plan. */
  radius: number;
  /** Direction, in degrees, in which a miss is drawn from the object. */
  missAngle: number;
}

export const OBJECTS: Record<ObjectId, TableObject> = {
  cube: { label: "red cube", words: ["red", "cube"], center: { x: 120, y: 300 }, radius: 15, missAngle: -10 },
  can: { label: "green can", words: ["green", "can"], center: { x: 296, y: 168 }, radius: 16, missAngle: 165 },
  nut: { label: "blue hex nut", words: ["blue", "hex", "nut"], center: { x: 372, y: 292 }, radius: 17, missAngle: 190 },
};

export const OBJECT_IDS = Object.keys(OBJECTS) as ObjectId[];

const round = (value: number) => Math.round(value * 10) / 10;
const point = (x: number, y: number): Point => ({ x: round(x), y: round(y) });

function quadratic(from: Point, control: Point, to: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * from.x + 2 * u * t * control.x + t * t * to.x,
    y: u * u * from.y + 2 * u * t * control.y + t * t * to.y,
  };
}

/** `count` points evenly spaced by distance along a quadratic curve, ending at `to`. */
function alongCurve(from: Point, control: Point, to: Point, count: number): Point[] {
  const samples = Array.from({ length: 201 }, (_, index) => quadratic(from, control, to, index / 200));
  const travelled = [0];
  for (let index = 1; index < samples.length; index += 1) {
    const step = Math.hypot(samples[index].x - samples[index - 1].x, samples[index].y - samples[index - 1].y);
    travelled.push(travelled[index - 1] + step);
  }
  const total = travelled[travelled.length - 1];
  return Array.from({ length: count }, (_, index) => {
    const wanted = (total * (index + 1)) / count;
    const at = travelled.findIndex((distance) => distance >= wanted - 1e-9);
    const sample = samples[at === -1 ? samples.length - 1 : at];
    return point(sample.x, sample.y);
  });
}

/** Where a label sits, and how its text is anchored there. */
export interface LabelSpot {
  at: Point;
  anchor: "start" | "middle" | "end";
}

/**
 * A spot beyond `center`, on the side away from the gripper's start. Paths
 * arrive from the start, so that side stays clear of them.
 */
function beyond(center: Point, distance: number): LabelSpot {
  const dx = center.x - START.x;
  const dy = center.y - START.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  return {
    at: point(center.x + ux * distance, center.y + (dy / length) * distance + 4),
    anchor: Math.abs(ux) < 0.35 ? "middle" : ux < 0 ? "end" : "start",
  };
}

/** Where an object's name is written. */
export function objectLabel(id: ObjectId): LabelSpot {
  return beyond(OBJECTS[id].center, OBJECTS[id].radius + 26);
}

/** A small repeatable random source, so the noise is the same on every render. */
function random(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/** Offsets that scatter `count` points around `centre`, relative to their final positions. */
function noiseOffsets(points: Point[], centre: Point, spread: number, seed: number): Point[] {
  const next = random(seed);
  return points.map((target) => {
    const angle = next() * Math.PI * 2;
    const radius = spread * (0.35 + 0.65 * next());
    return point(centre.x + radius * Math.cos(angle) - target.x, centre.y + radius * Math.sin(angle) - target.y);
  });
}

export interface Scene {
  target: ObjectId;
  words: string[];
  /** Where the gripper closes. */
  close: Point;
  /** First chunk: 15 predicted actions; the first 8 are executed. */
  firstChunk: Point[];
  /** Second chunk, after planning again: the 8 executed actions that reach `close`. */
  secondChunk: Point[];
  /** Start offsets of the two chunks' points (the noise they are drawn out of). */
  firstNoise: Point[];
  secondNoise: Point[];
  /** Camera patches that cover the named object, as [column, row]. */
  marked: [number, number][];
  /** True when the miss is long enough to draw as a dimension line. */
  showsMissLine: boolean;
  /** Where the miss is written: on the dimension line, or beside the object's name for a short miss. */
  missLabel: LabelSpot;
}

/** The object's position in the camera inset. */
export function insetPosition(center: Point): Point {
  return point(
    INSET.x + ((center.x - TABLE.x) / TABLE.width) * INSET.size,
    INSET.y + ((center.y - TABLE.y) / TABLE.height) * INSET.size,
  );
}

function markedPatches(center: Point, radius: number): [number, number][] {
  const at = insetPosition(center);
  const half = radius * (INSET.size / TABLE.width) + 1;
  const first = (value: number, origin: number) => Math.max(0, Math.floor((value - half - origin) / CELL));
  const last = (value: number, origin: number) =>
    Math.min(camera.grid - 1, Math.floor((value + half - origin) / CELL));
  const cells: [number, number][] = [];
  for (let row = first(at.y, INSET.y); row <= last(at.y, INSET.y); row += 1) {
    for (let column = first(at.x, INSET.x); column <= last(at.x, INSET.x); column += 1) {
      cells.push([column, row]);
    }
  }
  return cells;
}

export function buildScene(target: ObjectId, missMm: number): Scene {
  const object = OBJECTS[target];
  const angle = (object.missAngle * Math.PI) / 180;
  const close = point(object.center.x + missMm * Math.cos(angle), object.center.y + missMm * Math.sin(angle));

  // The first plan ends a little to one side of where the gripper finally
  // closes: the side nearer the robot, which keeps it clear of the labels.
  const dx = close.x - START.x;
  const dy = close.y - START.y;
  const length = Math.hypot(dx, dy) || 1;
  const side = dx >= 0 ? 1 : -1;
  const firstEnd = point(close.x - side * (dy / length) * 30, close.y + side * (dx / length) * 30);
  const firstControl = point(START.x, firstEnd.y + (START.y - firstEnd.y) * 0.35);
  const firstChunk = alongCurve(START, firstControl, firstEnd, chunking.predicted);

  // Planning again from the last executed action bends the path back to the closing point.
  const replanFrom = firstChunk[chunking.executed - 1];
  const before = firstChunk[chunking.executed - 2];
  const reach = Math.hypot(close.x - replanFrom.x, close.y - replanFrom.y) * 0.4;
  const heading = Math.hypot(replanFrom.x - before.x, replanFrom.y - before.y) || 1;
  const secondControl = point(
    replanFrom.x + ((replanFrom.x - before.x) / heading) * reach,
    replanFrom.y + ((replanFrom.y - before.y) / heading) * reach,
  );
  const secondChunk = alongCurve(replanFrom, secondControl, close, chunking.executed);

  const showsMissLine = missMm >= 30;
  let missLabel: LabelSpot;
  if (showsMissLine) {
    // Above the middle of the dimension line.
    const lx = close.x - object.center.x;
    const ly = close.y - object.center.y;
    const span = Math.hypot(lx, ly) || 1;
    const up = lx >= 0 ? { x: ly / span, y: -lx / span } : { x: -ly / span, y: lx / span };
    missLabel = {
      at: point((object.center.x + close.x) / 2 + up.x * 12, (object.center.y + close.y) / 2 + up.y * 12),
      anchor: "middle",
    };
  } else {
    // Too short to draw to scale: written on the line above the object's name.
    const name = objectLabel(target);
    missLabel = { at: point(name.at.x, name.at.y - 17), anchor: name.anchor };
  }

  return {
    target,
    words: ["pick", "up", "the", ...object.words],
    close,
    firstChunk,
    secondChunk,
    firstNoise: noiseOffsets(firstChunk, START, 64, 7),
    secondNoise: noiseOffsets(secondChunk, replanFrom, 40, 11),
    marked: markedPatches(object.center, object.radius),
    showsMissLine,
    missLabel,
  };
}

export const toPath = (points: Point[]) => points.map((p) => `${p.x},${p.y}`).join(" ");
