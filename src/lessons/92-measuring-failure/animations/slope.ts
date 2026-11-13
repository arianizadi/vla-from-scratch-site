/**
 * The chapter's invented slope example on one table axis: the named object at
 * 0.40, 0.50 and 0.60 m in three episodes, and where two policies closed the
 * gripper. The slope is the least-squares slope of the gripper's coordinate
 * against the object's, as `close_slope` computes it per axis.
 */

export const OBJECT_M = [0.4, 0.5, 0.6];
export const FOLLOWS_M = [0.41, 0.49, 0.6];
export const IGNORES_M = [0.52, 0.47, 0.51];

export interface Fit {
  slope: number;
  intercept: number;
}

/** Least-squares line through (x, y): centre both, divide cross-products by squares. */
export function fit(x: number[], y: number[]): Fit {
  const mx = x.reduce((sum, v) => sum + v, 0) / x.length;
  const my = y.reduce((sum, v) => sum + v, 0) / y.length;
  let cross = 0;
  let squares = 0;
  x.forEach((v, i) => {
    cross += (v - mx) * (y[i] - my);
    squares += (v - mx) ** 2;
  });
  const slope = Math.round((cross / squares) * 1000) / 1000;
  return { slope, intercept: Math.round((my - slope * mx) * 10000) / 10000 };
}

export const FOLLOWS = fit(OBJECT_M, FOLLOWS_M);
export const IGNORES = fit(OBJECT_M, IGNORES_M);
