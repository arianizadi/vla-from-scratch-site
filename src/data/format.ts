/**
 * Printing numbers the way the lab notebook prints them. Use these wherever
 * a measured number becomes text, so the site and the notebook read the same:
 *
 *   formatPercent(0.85)          "85%"        formatSuccess(row)         "37/50 = 74%"
 *   formatCount(83, 100)         "83/100"     formatInterval(row.ci)     "60-84%"
 *   formatSlope(0.9819)          "0.98"       formatSamples(4993664)     "5.0M"
 *   formatMm(7.36)               "7 mm"       formatMs(24.9)             "25 ms"
 *   formatBoth(a, b, formatMm)   "7 / 7 mm"   formatBudget(1500000)      "1.5M"
 *   parseSamples("300k")         300000
 *
 * The rounding is in notebook-format.mjs, shared with scripts/sync-data.mjs.
 * It is Python's: an exact tie goes to the even digit, so 3 of 24 is "12%"
 * where Number.prototype.toFixed and Math.round would say 13.
 */

import { fixed, formatCount, formatPercent } from "./notebook-format.mjs";
import type { Count } from "./types";

export {
  MISSING,
  fixed,
  formatCount,
  formatMm,
  formatMs,
  formatPercent,
  formatSamples,
  formatSlope,
  formatWhole,
} from "./notebook-format.mjs";

/** A success count with its percentage, as the notebook's first tables write it: "37/50 = 74%". */
export function formatSuccess({ successes, episodes }: Count): string {
  return `${formatCount(successes, episodes)} = ${formatPercent(successes / episodes)}`;
}

/** A 95% interval of a share, low and high between 0 and 1: "60-84%". */
export function formatInterval([low, high]: readonly [number, number]): string {
  return `${fixed(100 * low)}-${fixed(100 * high)}%`;
}

/**
 * Two values of one kind in one cell, trained weights first: "83% / 85%".
 * When both end in the same unit it is written once: "7 / 7 mm".
 */
export function formatBoth<Value>(trained: Value, averaged: Value, format: (value: Value) => string): string {
  const first = format(trained);
  const second = format(averaged);
  const unit = / [a-z]+$/.exec(second)?.[0];
  return unit && first.endsWith(unit) ? `${first.slice(0, -unit.length)} / ${second}` : `${first} / ${second}`;
}

/** A training budget as headings write it: 1500000 gives "1.5M", 5000000 gives "5M", 400000 gives "400k". */
export function formatBudget(samples: number): string {
  if (samples < 1e6) return `${fixed(samples / 1e3)}k`;
  return `${fixed(samples / 1e6, 1).replace(/\.0$/, "")}M`;
}

/**
 * A number of training samples the notebook writes in short ("300k", "1.5M"),
 * as a number, for an axis: 300000, 1500000. Undefined for any other text.
 */
export function parseSamples(written: string): number | undefined {
  const match = /^(\d+(?:\.\d+)?)\s*([kM])$/.exec(written.trim());
  return match ? Math.round(Number(match[1]) * (match[2] === "k" ? 1e3 : 1e6)) : undefined;
}
