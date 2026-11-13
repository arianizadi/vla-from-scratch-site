/**
 * The full chapter's toy, computed: two target actions at (-1, 0) and (+1, 0),
 * the ideal flow-matching direction for them, and the repository's Euler
 * sampler over 1000 noise levels. Same arithmetic as the Python in the
 * chapter's "Check yourself", on a few dozen seeded points instead of 10,000.
 */

export type Point = [number, number];

export const TARGETS: Point[] = [
  [-1, 0],
  [1, 0],
];
const T = 1000;

/** The direction the ideal network outputs at x and noise level t (0..999). */
function direction([x, y]: Point, t: number, blur = 1): Point {
  const s = t / T;
  const d2 = TARGETS.map(([tx, ty]) => (x - (1 - s) * tx) ** 2 + (y - (1 - s) * ty) ** 2);
  const least = Math.min(...d2);
  const weights = d2.map((d) => Math.exp(-(d - least) / (2 * s * s * blur)));
  const total = weights.reduce((sum, w) => sum + w, 0);
  const guess: Point = [0, 0];
  weights.forEach((w, i) => {
    guess[0] += (w / total) * TARGETS[i][0];
    guess[1] += (w / total) * TARGETS[i][1];
  });
  return [(x - guess[0]) / s, (y - guess[1]) / s];
}

/** Every position of one point through the sampler with `steps` flow steps, start included. */
export function trajectory(start: Point, steps: number): Point[] {
  const size = Math.max(1, Math.floor(T / steps));
  const path: Point[] = [start];
  let p: Point = start;
  for (let t = T - 1; t > 0; t -= size) {
    const [dx, dy] = direction(p, t);
    p = [p[0] - dx * (size / T), p[1] - dy * (size / T)];
    path.push(p);
  }
  return path;
}

/** A small seeded generator, so the server and the browser draw the same points. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `count` points from a standard normal (Box-Muller), clipped to ±limit so they stay in the drawing. */
export function noise(count: number, seed = 7, limit = 2.4): Point[] {
  const random = mulberry32(seed);
  const points: Point[] = [];
  while (points.length < count) {
    const u = Math.max(random(), 1e-9);
    const v = random();
    const r = Math.sqrt(-2 * Math.log(u));
    const p: Point = [r * Math.cos(2 * Math.PI * v), r * Math.sin(2 * Math.PI * v)];
    if (Math.abs(p[0]) < limit && Math.abs(p[1]) < limit) points.push(p);
  }
  return points;
}

/** Rounded to one decimal of a drawing unit, so the server and the browser print the same numbers. */
export function tidy(value: number): number {
  return Math.round(value * 10) / 10;
}
