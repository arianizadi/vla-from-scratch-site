/**
 * The mathematics of the figure: flow matching in two dimensions, run exactly.
 *
 * The data distribution is the chapter's two targets a1 = (-1, 0) and
 * a2 = (+1, 0), of equal weight. The code allows each a Gaussian spread SPREAD
 * in both coordinates; it is 0, point targets, as in the chapter's script, so
 * the traced draw follows the chapter's trace exactly. A mixture is
 *
 *   x_s = (1 - s) a + s eps,   eps ~ N(0, I),   s from 1 (noise) to 0 (action),
 *
 * the path of the repository's FlowMatchingScheduler. Given x_s, the component
 * k it came from has posterior weight
 *
 *   w_k  proportional to  N(x; (1 - s) mu_k, tau^2 I),   tau^2 = (1 - s)^2 SPREAD^2 + s^2,
 *
 * and within component k the expected action is
 *
 *   E[a | x, k] = mu_k + (1 - s) SPREAD^2 / tau^2 (x - (1 - s) mu_k).
 *
 * The guess a_hat(x, s) = sum_k w_k E[a | x, k], and the field the network is
 * trained to output, the conditional expectation of the target eps - a, is
 *
 *   v*(x, s) = (x - a_hat(x, s)) / s.
 *
 * Nothing here is learned or fitted: this is the field a perfectly trained
 * network would output for this data. The sampler is the repository's
 * (DiffusionPolicy.generate_actions with FlowMatchingScheduler.step): 1000
 * noise levels, step_size = max(1, 1000 // steps), t from 999 down in
 * step_size, and x <- x - v * step_size / 1000 at each one.
 *
 * "Hedging" divides the exponent of the weights by HEDGE, as the chapter's
 * script does with blur = 16: a stand-in for a network that does not commit
 * to one target. The weights still sharpen as s goes to 0, so hedging delays
 * the choice of target rather than preventing it: with few flow steps the
 * draws stay between the targets, with enough of them they still reach one.
 */

/** The two targets, a1 and a2, and their weights in the data. */
export const TARGETS: readonly (readonly [number, number])[] = [
  [-1, 0],
  [1, 0],
];

/** Standard deviation of each target's Gaussian, in both coordinates: 0, point targets, as in the chapter's script. */
export const SPREAD = 0;

/** The number of noise levels of the repository's scheduler. */
export const LEVELS = 1000;

/** How much a hedging field flattens the weights (the chapter's blur). */
export const HEDGE = 16;

/** A draw counts as on a target within this distance of its centre (the chapter's table). */
export const ON_TARGET = 0.1;

/** A draw is in the middle when its first coordinate is within this of 0 (the chapter's table). */
export const MIDDLE = 0.5;

/** The flow-step counts a reader can choose, before the measured ones are added. */
export const TOY_STEPS = [1, 2, 4, 10, 20] as const;

/** How many draws the statistics are computed from (the chapter's script uses as many). */
export const DRAWS = 10000;

/** Where the traced draw starts: the chapter's worked trace. */
export const TRACED_START: readonly [number, number] = [0.5, 0.8];

export type Field = "exact" | "hedging";

export interface FieldValue {
  /** The velocity v*(x, s). */
  v: [number, number];
  /** The current guess a_hat(x, s): where a flow step from here is aimed. */
  guess: [number, number];
  /** Posterior weight of a2, the target on the right. */
  right: number;
}

/** The exact conditional-expectation field at x and noise level s (0 < s <= 1). */
export function field(x1: number, x2: number, s: number, kind: Field): FieldValue {
  const keep = 1 - s;
  const tau2 = keep * keep * SPREAD * SPREAD + s * s;
  const shrink = (keep * SPREAD * SPREAD) / tau2;
  const flatten = kind === "hedging" ? HEDGE : 1;

  const exponents = TARGETS.map(([m1, m2]) => {
    const d1 = x1 - keep * m1;
    const d2 = x2 - keep * m2;
    return -(d1 * d1 + d2 * d2) / (2 * tau2 * flatten);
  });
  const top = Math.max(...exponents);
  const raw = exponents.map((e) => Math.exp(e - top));
  const total = raw.reduce((sum, w) => sum + w, 0);

  let g1 = 0;
  let g2 = 0;
  TARGETS.forEach(([m1, m2], k) => {
    const w = raw[k] / total;
    g1 += w * (m1 + shrink * (x1 - keep * m1));
    g2 += w * (m2 + shrink * (x2 - keep * m2));
  });
  return { v: [(x1 - g1) / s, (x2 - g2) / s], guess: [g1, g2], right: raw[1] / total };
}

/** The noise levels t the sampler visits, as generate_actions loops over them. */
export function schedule(steps: number): { levels: number[]; stepSize: number } {
  const stepSize = Math.max(1, Math.floor(LEVELS / steps));
  const levels: number[] = [];
  for (let t = LEVELS - 1; t > 0; t -= stepSize) levels.push(t);
  return { levels, stepSize };
}

/**
 * Carries one start point through the sampler. Returns every position, the
 * start first, and the guess each flow step was aimed at.
 */
export function carry(start: readonly [number, number], steps: number, kind: Field) {
  const { levels, stepSize } = schedule(steps);
  const path: [number, number][] = [[start[0], start[1]]];
  const guesses: [number, number][] = [];
  let [x1, x2] = start;
  for (const t of levels) {
    const { v, guess } = field(x1, x2, t / LEVELS, kind);
    guesses.push(guess);
    x1 -= (v[0] * stepSize) / LEVELS;
    x2 -= (v[1] * stepSize) / LEVELS;
    path.push([x1, x2]);
  }
  return { path, guesses, levels };
}

/** A small seeded generator (mulberry32), so the server and the browser draw the same noise. */
function generator(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** count points of standard normal noise in two dimensions, the same every time. */
export function noise(count: number, seed = 7): Float64Array {
  const random = generator(seed);
  const out = new Float64Array(count * 2);
  for (let index = 0; index < count * 2; index += 2) {
    // Box-Muller: two uniforms give two independent normals.
    const u = Math.max(random(), 1e-12);
    const r = Math.sqrt(-2 * Math.log(u));
    const angle = 2 * Math.PI * random();
    out[index] = r * Math.cos(angle);
    out[index + 1] = r * Math.sin(angle);
  }
  return out;
}

export interface Flow {
  steps: number;
  kind: Field;
  /** Noise levels of the flow steps, as fractions of the path: s = t / 1000. */
  levels: number[];
  /** positions[k] holds every draw after k flow steps, x and y interleaved. positions[0] is the noise. */
  positions: Float64Array[];
  /** Share of the draws within ON_TARGET of a target, and with |first coordinate| < MIDDLE, after the last step. */
  onTarget: number;
  middle: number;
  /** Share of the draws that ended on the right of the middle line. */
  right: number;
}

/** Runs every draw of the noise through the sampler and scores where they end. */
export function flow(start: Float64Array, steps: number, kind: Field): Flow {
  const { levels, stepSize } = schedule(steps);
  const count = start.length / 2;
  const positions: Float64Array[] = [start];
  let current = start;
  for (const t of levels) {
    const s = t / LEVELS;
    const next = new Float64Array(current.length);
    for (let index = 0; index < current.length; index += 2) {
      const { v } = field(current[index], current[index + 1], s, kind);
      next[index] = current[index] - (v[0] * stepSize) / LEVELS;
      next[index + 1] = current[index + 1] - (v[1] * stepSize) / LEVELS;
    }
    positions.push(next);
    current = next;
  }

  const { onTarget, middle } = score(current);
  let right = 0;
  for (let index = 0; index < current.length; index += 2) if (current[index] > 0) right += 1;
  return {
    steps,
    kind,
    levels: levels.map((t) => t / LEVELS),
    positions,
    onTarget,
    middle,
    right: right / count,
  };
}

/** Share of the draws within ON_TARGET of a target, and with |first coordinate| < MIDDLE. */
export function score(points: Float64Array): { onTarget: number; middle: number } {
  const count = points.length / 2;
  let onTarget = 0;
  let middle = 0;
  for (let index = 0; index < points.length; index += 2) {
    const x1 = points[index];
    const x2 = points[index + 1];
    const miss = Math.min(...TARGETS.map(([m1, m2]) => Math.hypot(x1 - m1, x2 - m2)));
    if (miss < ON_TARGET) onTarget += 1;
    if (Math.abs(x1) < MIDDLE) middle += 1;
  }
  return { onTarget: onTarget / count, middle: middle / count };
}

/** The noise level the draws are at after `done` of the flow's steps: the next step's level, 0 after the last. */
export function levelAfter(flowResult: Flow, done: number): number {
  return done < flowResult.levels.length ? flowResult.levels[done] : 0;
}

/** Position of draw `index` at a fractional progress through the flow steps (0 is noise). */
export function at(flowResult: Flow, index: number, progress: number): [number, number] {
  const last = flowResult.positions.length - 1;
  const clamped = Math.min(Math.max(progress, 0), last);
  const k = Math.min(Math.floor(clamped), last - 1);
  const f = last === 0 ? 0 : clamped - k;
  const a = flowResult.positions[k];
  const b = flowResult.positions[Math.min(k + 1, last)];
  // An Euler step is a straight segment at constant speed, so moving linearly along it is the sampler itself.
  return [a[2 * index] + f * (b[2 * index] - a[2 * index]), a[2 * index + 1] + f * (b[2 * index + 1] - a[2 * index + 1])];
}

/**
 * The Wilson 95% interval of a share, the interval the lab notebook and the
 * rest of the site use for success rates.
 */
export function wilson(successes: number, episodes: number): [number, number] {
  if (episodes <= 0) return [0, 1];
  const z = 1.959963984540054;
  const p = successes / episodes;
  const z2 = z * z;
  const denominator = 1 + z2 / episodes;
  const centre = (p + z2 / (2 * episodes)) / denominator;
  const half = (z * Math.sqrt((p * (1 - p)) / episodes + z2 / (4 * episodes * episodes))) / denominator;
  return [Math.max(0, centre - half), Math.min(1, centre + half)];
}
