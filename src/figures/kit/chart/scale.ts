/**
 * A linear scale: data value -> pixel position. No dependency on a charting
 * library; the figures draw their own SVG.
 *
 *   const x = scaleLinear([0, 30], [margin.left, width - margin.right]);
 *   x(15)          // pixel position of 15
 *   x.invert(240)  // data value under pixel 240 (for a crosshair)
 *   x.ticks(5)     // about five round values across the domain
 */

export interface LinearScale {
  (value: number): number;
  /** Pixel position -> data value. */
  invert(position: number): number;
  /** About `count` round values inside the domain (steps of 1, 2 or 5 times a power of ten). */
  ticks(count?: number): number[];
  domain: readonly [number, number];
  range: readonly [number, number];
}

export interface ScaleOptions {
  /** Keep outputs inside the range (and inverted values inside the domain). */
  clamp?: boolean;
  /** Widen the domain to round numbers, so the axis ends on a tick. */
  nice?: boolean;
}

/** The step between ticks: 1, 2 or 5 times a power of ten, giving about `count` ticks. */
export function tickStep(min: number, max: number, count = 5): number {
  const span = Math.abs(max - min);
  if (span === 0 || !Number.isFinite(span)) return 1;
  const raw = span / Math.max(1, count);
  const power = 10 ** Math.floor(Math.log10(raw));
  const ratio = raw / power;
  const factor = ratio >= 7.5 ? 10 : ratio >= 3.5 ? 5 : ratio >= 1.5 ? 2 : 1;
  return factor * power;
}

/** Round tick values between min and max, both included when they fall on a step. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  const step = tickStep(low, high, count);
  const first = Math.ceil(low / step - 1e-9);
  const last = Math.floor(high / step + 1e-9);
  const decimals = Math.max(0, -Math.floor(Math.log10(step)));
  const ticks: number[] = [];
  for (let index = first; index <= last; index += 1) {
    ticks.push(Number((index * step).toFixed(decimals)));
  }
  return ticks;
}

/** Smallest and largest value; [0, 1] for an empty list. */
export function extent(values: Iterable<number>): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return min <= max ? [min, max] : [0, 1];
}

export function scaleLinear(
  domain: readonly [number, number],
  range: readonly [number, number],
  options: ScaleOptions = {},
): LinearScale {
  let [d0, d1] = domain;
  if (options.nice) {
    const step = tickStep(d0, d1);
    d0 = Math.floor(Math.min(d0, d1) / step) * step;
    d1 = Math.ceil(Math.max(domain[0], domain[1]) / step) * step;
    if (domain[0] > domain[1]) [d0, d1] = [d1, d0];
  }
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  const clamp = (value: number, a: number, b: number) => Math.min(Math.max(value, Math.min(a, b)), Math.max(a, b));

  const scale = ((value: number) => {
    const position = r0 + ((value - d0) / span) * (r1 - r0);
    return options.clamp ? clamp(position, r0, r1) : position;
  }) as LinearScale;

  scale.invert = (position: number) => {
    const value = d0 + ((position - r0) / (r1 - r0 || 1)) * span;
    return options.clamp ? clamp(value, d0, d1) : value;
  };
  scale.ticks = (count = 5) => niceTicks(d0, d1, count);
  scale.domain = [d0, d1];
  scale.range = [r0, r1];
  return scale;
}
