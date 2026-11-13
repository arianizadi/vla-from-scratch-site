/**
 * The motion language of the explanation animations. One set of numbers for
 * every animation on the site, so they feel like one hand drew them.
 *
 * - A step is one idea. Things that change in a step move together, in the
 *   order the eye should follow them: STAGGER apart, never more than ~8 at once.
 * - A move takes MOVE ms with the standard ease (fast start, soft landing).
 * - Lines draw in DRAW ms with an ease-in-out.
 * - A step stays on screen HOLD ms (the last one LAST_HOLD) so it can be read.
 *
 * The CSS in animations.css uses the same values through custom properties.
 */

export const EASE = "cubic-bezier(0.2, 0, 0, 1)";
export const EASE_DRAW = "cubic-bezier(0.65, 0, 0.35, 1)";

/** Duration of one move (position, opacity, colour), ms. */
export const MOVE = 600;
/** Duration of a line drawing itself, ms. */
export const DRAW = 800;
/** Delay between items that move in the same step, ms. */
export const STAGGER = 50;
/** Default time a step is held before the next one, ms. */
export const HOLD = 2200;
/** Default time the last step is held before the loop restarts, ms. */
export const LAST_HOLD = 3200;
/** Fade out and back in when a loop restarts, ms. */
export const LOOP_FADE = 260;

/** Delay for the i-th item of a staggered group, ms. */
export function stagger(index: number, step = STAGGER): number {
  return Math.max(0, index) * step;
}

/** Linear interpolation, handy for positions between two states. */
export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

/** A linear map from a data range to a drawing range: scale([0, 1], [40, 440])(0.5) === 240. */
export function scale(domain: [number, number], range: [number, number]): (value: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  return (value: number) => r0 + ((value - d0) / span) * (r1 - r0);
}

/** Visible from step `from` on (and up to `to`, inclusive, when given). */
export function shown(step: number, from: number, to = Infinity): boolean {
  return step >= from && step <= to;
}
