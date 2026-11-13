/**
 * The chapter's two-dimensional rotary example, computed: one pair of numbers,
 * 1 radian per position, query and key both (1, 0) before rotation. The score
 * of a query at m and a key at n is cos(m - n).
 */

export interface DialState {
  /** Positions of the query and the key; undefined before any rotation. */
  query?: number;
  key?: number;
  /** Angles drawn, in radians. Equal to the positions up to whole turns, chosen so both arrows turn the short way. */
  queryAngle: number;
  keyAngle: number;
}

const TURN = 2 * Math.PI;

export const DIAL: DialState[] = [
  { queryAngle: 0, keyAngle: 0 },
  { query: 3, key: 5, queryAngle: 3, keyAngle: 5 },
  // 13 and 15 radians, two whole turns less: the same arrows, reached by turning both by the same amount.
  { query: 13, key: 15, queryAngle: 13 - 2 * TURN, keyAngle: 15 - 2 * TURN },
  { query: 3, key: 4, queryAngle: 3, keyAngle: 4 },
];

/** Dot product of the rotated query and key, rounded to two decimals. */
export function score(query: number, key: number): string {
  const value = Math.cos(query - key);
  return (Math.round(value * 100) / 100).toFixed(2).replace("-", "−");
}

/** SVG rotation (degrees, clockwise on screen) for a mathematical angle (radians, counter-clockwise). */
export function screenDegrees(angle: number): number {
  return Math.round((-angle * 180) / Math.PI * 100) / 100;
}
