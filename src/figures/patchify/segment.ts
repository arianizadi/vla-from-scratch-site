/**
 * Finds the objects in a camera frame by their colour, in the browser, from
 * the frame's own pixels: a pixel belongs to an object when its hue,
 * saturation and brightness match the object's paint, and the object is the
 * largest connected region of such pixels. The table is brown and the robot
 * white or grey, so the four painted objects separate cleanly; pixels at the
 * edge of an object that are blended with the table, and the white lid of the
 * can, are not counted.
 */

import { OBJECT_IDS } from "@/data/labels";
import type { ObjectId } from "@/data/types";

/** Which colours count as an object's paint: hue in degrees (a range may wrap past 360), saturation and value from 0 to 1. */
interface Paint {
  hue: [number, number];
  saturation: number;
  value: number;
}

const PAINT: Record<ObjectId, Paint> = {
  cube: { hue: [340, 10], saturation: 0.65, value: 0.2 },
  tblock: { hue: [38, 70], saturation: 0.5, value: 0.3 },
  hex: { hue: [200, 255], saturation: 0.45, value: 0.15 },
  can: { hue: [90, 170], saturation: 0.35, value: 0.12 },
};

/** A region smaller than this is a stray pixel or a sliver at the frame's edge, not an object in view. */
const MIN_PIXELS = 12;

export interface ObjectMask {
  id: ObjectId;
  /** Side of the frame the mask was found in. */
  frameSize: number;
  /** Indices (y * size + x) of the object's pixels, in reading order. */
  pixels: number[];
  /** Bounding box in pixels: first column and row, width and height. */
  box: { x: number; y: number; width: number; height: number };
  /** True when the box touches the frame's edge: only the part in view is counted, not the whole object. */
  cut: boolean;
  /** The outline: the edges between object pixels and the rest, as an SVG path in pixel units. */
  outline: string;
}

function hsv(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const value = max / 255;
  const saturation = max === 0 ? 0 : delta / max;
  if (delta === 0) return [0, saturation, value];
  let hue: number;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue *= 60;
  if (hue < 0) hue += 360;
  return [hue, saturation, value];
}

function matches(paint: Paint, hue: number, saturation: number, value: number): boolean {
  if (saturation <= paint.saturation || value <= paint.value) return false;
  const [from, to] = paint.hue;
  return from <= to ? hue >= from && hue <= to : hue >= from || hue <= to;
}

/** The largest 8-connected region of `inside`. */
function largestRegion(inside: Uint8Array, size: number): number[] {
  const seen = new Uint8Array(inside.length);
  let best: number[] = [];
  const queue = new Int32Array(inside.length);
  for (let start = 0; start < inside.length; start += 1) {
    if (!inside[start] || seen[start]) continue;
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    seen[start] = 1;
    const region: number[] = [];
    while (head < tail) {
      const index = queue[head++];
      region.push(index);
      const x = index % size;
      const y = (index - x) / size;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
          const next = ny * size + nx;
          if (inside[next] && !seen[next]) {
            seen[next] = 1;
            queue[tail++] = next;
          }
        }
      }
    }
    if (region.length > best.length) best = region;
  }
  return best.sort((a, b) => a - b);
}

/** One path segment per pixel edge that separates the object from the rest. */
function outlineOf(pixels: number[], size: number): string {
  const inside = new Set(pixels);
  const parts: string[] = [];
  for (const index of pixels) {
    const x = index % size;
    const y = (index - x) / size;
    if (y === 0 || !inside.has(index - size)) parts.push(`M${x} ${y}h1`);
    if (y === size - 1 || !inside.has(index + size)) parts.push(`M${x} ${y + 1}h1`);
    if (x === 0 || !inside.has(index - 1)) parts.push(`M${x} ${y}v1`);
    if (x === size - 1 || !inside.has(index + 1)) parts.push(`M${x + 1} ${y}v1`);
  }
  return parts.join("");
}

/** The objects found in a square RGBA frame, in the order every chart uses. */
export function findObjects(data: Uint8ClampedArray, size: number): ObjectMask[] {
  const found: ObjectMask[] = [];
  const pixelsInFrame = size * size;
  const hues = new Float32Array(pixelsInFrame);
  const saturations = new Float32Array(pixelsInFrame);
  const values = new Float32Array(pixelsInFrame);
  for (let index = 0; index < pixelsInFrame; index += 1) {
    const [h, s, v] = hsv(data[index * 4], data[index * 4 + 1], data[index * 4 + 2]);
    hues[index] = h;
    saturations[index] = s;
    values[index] = v;
  }

  for (const id of OBJECT_IDS) {
    const paint = PAINT[id];
    const inside = new Uint8Array(pixelsInFrame);
    for (let index = 0; index < pixelsInFrame; index += 1) {
      inside[index] = matches(paint, hues[index], saturations[index], values[index]) ? 1 : 0;
    }
    const pixels = largestRegion(inside, size);
    if (pixels.length < MIN_PIXELS) continue;

    let minX = size;
    let minY = size;
    let maxX = 0;
    let maxY = 0;
    for (const index of pixels) {
      const x = index % size;
      const y = (index - x) / size;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    found.push({
      id,
      frameSize: size,
      pixels,
      box: { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 },
      cut: minX === 0 || minY === 0 || maxX === size - 1 || maxY === size - 1,
      outline: outlineOf(pixels, size),
    });
  }
  return found;
}
