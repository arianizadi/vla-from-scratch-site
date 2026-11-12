/**
 * Geometry shared by the drawings of the "rotary" figure. Angles are in
 * radians and grow counter-clockwise, as in the chapter; the y axis of an SVG
 * points down, so every point is flipped here and nowhere else.
 *
 * Coordinates are rounded to two decimals: the server and the browser then
 * print the same attribute even if their cosines differ in the last bit.
 */

export const TAU = Math.PI * 2;

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export type Point = readonly [number, number];

/** The point at distance `radius` from the centre, in the direction `angle`. */
export function polar(cx: number, cy: number, radius: number, angle: number): Point {
  return [round2(cx + radius * Math.cos(angle)), round2(cy - radius * Math.sin(angle))];
}

/** An angle brought into (-pi, pi]. */
export function wrapAngle(angle: number): number {
  const wrapped = angle - TAU * Math.floor((angle + Math.PI) / TAU);
  return wrapped === -Math.PI ? Math.PI : wrapped;
}

/**
 * The arc commands from angle `from` to angle `to` along a circle, without the
 * leading move. The arc follows the sign of `to - from` and may run past a
 * full turn; it is cut into quarter turns, which an SVG arc can always draw.
 */
function arcTo(cx: number, cy: number, radius: number, from: number, to: number): string {
  const span = to - from;
  const pieces = Math.max(1, Math.ceil(Math.abs(span) / (Math.PI / 2)));
  const sweep = span > 0 ? 0 : 1;
  let d = "";
  for (let piece = 1; piece <= pieces; piece += 1) {
    const [x, y] = polar(cx, cy, radius, from + (span * piece) / pieces);
    d += `A${radius},${radius} 0 0 ${sweep} ${x},${y}`;
  }
  return d;
}

/** An open arc from `from` to `to`. */
export function arcPath(cx: number, cy: number, radius: number, from: number, to: number): string {
  const [x, y] = polar(cx, cy, radius, from);
  return `M${x},${y}${arcTo(cx, cy, radius, from, to)}`;
}

/** A closed sector: centre, out along `from`, round to `to`, back to the centre. */
export function sectorPath(cx: number, cy: number, radius: number, from: number, to: number): string {
  const [x, y] = polar(cx, cy, radius, from);
  return `M${round2(cx)},${round2(cy)}L${x},${y}${arcTo(cx, cy, radius, from, to)}Z`;
}
