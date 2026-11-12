/**
 * How the lab notebook writes numbers. The notebook's tables were printed by
 * the tutorial repository's Python tools (sim/pickup/summarize.py): percent
 * and millimetres without decimals, slopes with two, training samples in
 * millions with one. These functions print a value the same way, so a number
 * on the site reads exactly as it does in the notebook.
 *
 * Plain JavaScript, because two programs use it: the site, through
 * src/data/format.ts, and scripts/sync-data.mjs, which prints every exported
 * row this way to find it in the notebook.
 */

/** What the notebook writes in a cell that has no value. */
export const MISSING = "-";

/**
 * `value` with `digits` decimals, rounded as Python's format(value, ".Nf")
 * rounds: to the nearest, and a value exactly halfway to the even digit
 * (3 of 24 episodes is 12.5%, written "12%"). Number.prototype.toFixed takes
 * the larger digit there, which is the one difference between the two.
 *
 * @param {number} value
 * @param {number} [digits]
 * @returns {string}
 */
export function fixed(value, digits = 0) {
  const sign = value < 0 || Object.is(value, -0) ? "-" : "";
  const size = Math.abs(value);
  // Halfway between two candidates means: an odd number of halves of the last digit.
  // Multiplying by a power of two is exact, so this test is too.
  const halves = size * 2 ** (digits + 1);
  if (Number.isInteger(halves) && halves % 2 === 1) {
    const scaled = size * 10 ** digits; // a whole number and a half, exactly
    const down = Math.floor(scaled);
    return sign + ((down % 2 === 0 ? down : down + 1) / 10 ** digits).toFixed(digits);
  }
  return sign + size.toFixed(digits);
}

/**
 * A share between 0 and 1 as a percentage: 0.85 gives "85%".
 *
 * @param {number | null | undefined} share
 * @returns {string}
 */
export function formatPercent(share) {
  return share === null || share === undefined ? MISSING : `${fixed(100 * share)}%`;
}

/**
 * A number without decimals: 7.36 gives "7". For the cells that hold two
 * values and one unit ("7 / 7 mm").
 *
 * @param {number | null | undefined} value
 * @returns {string}
 */
export function formatWhole(value) {
  return value === null || value === undefined ? MISSING : fixed(value);
}

/**
 * A distance in millimetres: 7.36 gives "7 mm".
 *
 * @param {number | null | undefined} millimetres
 * @returns {string}
 */
export function formatMm(millimetres) {
  return millimetres === null || millimetres === undefined ? MISSING : `${fixed(millimetres)} mm`;
}

/**
 * A duration in milliseconds: 24.9 gives "25 ms".
 *
 * @param {number | null | undefined} milliseconds
 * @returns {string}
 */
export function formatMs(milliseconds) {
  return milliseconds === null || milliseconds === undefined ? MISSING : `${fixed(milliseconds)} ms`;
}

/**
 * The slope of where the gripper closed against where the named object was: 0.9819 gives "0.98".
 *
 * @param {number | null | undefined} slope
 * @returns {string}
 */
export function formatSlope(slope) {
  return slope === null || slope === undefined ? MISSING : fixed(slope, 2);
}

/**
 * A number of training samples in millions: 4993664 gives "5.0M".
 *
 * @param {number | null | undefined} samples
 * @returns {string}
 */
export function formatSamples(samples) {
  return samples === null || samples === undefined ? MISSING : `${fixed(samples / 1e6, 1)}M`;
}

/**
 * Successes out of episodes: (83, 100) gives "83/100".
 *
 * @param {number} successes
 * @param {number} episodes
 * @returns {string}
 */
export function formatCount(successes, episodes) {
  return `${successes}/${episodes}`;
}
