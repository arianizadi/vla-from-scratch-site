/**
 * The Wilson 95% interval that eval.py computes, from the chapter's formula:
 * centre = (p + z²/2n) / (1 + z²/n),
 * half   = z / (1 + z²/n) * sqrt(p(1 - p)/n + z²/4n²), with z = 1.96.
 * Returned in percent, rounded to one decimal.
 */

const Z = 1.96;

export interface Reading {
  successes: number;
  episodes: number;
  /** Rate, low and high bound, in percent. */
  rate: number;
  low: number;
  high: number;
}

const tenth = (value: number) => Math.round(value * 1000) / 10;

export function wilson(successes: number, episodes: number): Reading {
  const p = successes / episodes;
  const n = episodes;
  const denominator = 1 + (Z * Z) / n;
  const centre = (p + (Z * Z) / (2 * n)) / denominator;
  const half = (Z / denominator) * Math.sqrt((p * (1 - p)) / n + (Z * Z) / (4 * n * n));
  return { successes, episodes, rate: tenth(p), low: tenth(centre - half), high: tenth(centre + half) };
}
