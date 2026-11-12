/**
 * Timing of the figure's two motions (DESIGN.md, section 6).
 *
 *   Replay     simulated time: the scrubber crosses the run at a constant
 *              number of samples per second, so a stretch in which nothing
 *              happens lasts as long as it did in training, to scale.
 *   Magnify    an explanatory beat: the loss axis stretches, so the reader
 *              sees that the magnified curve is the same curve.
 */

/** How long the replay of a whole run lasts. */
export const REPLAY_MS = 9000;

/** How long the loss axis takes to stretch or to shrink back. */
export const MAGNIFY_MS = 600;

/** A CSS cubic-bezier() timing function as a function of progress, both from 0 to 1. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (progress: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const xAt = (u: number) => ((ax * u + bx) * u + cx) * u;
  const yAt = (u: number) => ((ay * u + by) * u + cy) * u;

  return (progress) => {
    if (progress <= 0) return 0;
    if (progress >= 1) return 1;
    // x(u) rises with u, so the u that belongs to this progress is found by halving.
    let low = 0;
    let high = 1;
    let u = progress;
    for (let step = 0; step < 24; step += 1) {
      const x = xAt(u);
      if (Math.abs(x - progress) < 1e-5) break;
      if (x < progress) low = u;
      else high = u;
      u = (low + high) / 2;
    }
    return yAt(u);
  };
}

/** The site's standard easing, cubic-bezier(0.2, 0, 0, 1). */
export const easeStandard = cubicBezier(0.2, 0, 0, 1);

/**
 * The top of the loss axis part of the way through a change. The steps are
 * equal ratios, not equal differences: a zoom that covers a factor of ten
 * then moves at one speed, instead of rushing through the last tenth.
 */
export function axisBetween(from: number, to: number, progress: number): number {
  if (from <= 0 || to <= 0) return to;
  return from * (to / from) ** easeStandard(progress);
}
