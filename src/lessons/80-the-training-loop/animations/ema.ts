/**
 * A toy for the averaged copy of the weights: one raw weight that drifts
 * toward a value and is pushed around by every batch (seeded noise), and its
 * exponential moving average, ema <- d * ema + (1 - d) * raw. The toy uses a
 * fixed decay of 0.85 so the effect shows in 48 steps; the real run raises
 * its decay toward 0.9999 and averages over thousands of optimiser steps.
 */

export const STEPS = 48;
export const DECAY = 0.85;

/** Deterministic noise in [-1, 1]: a small linear congruential generator. */
function noise(seed: number, count: number): number[] {
  let state = seed;
  return Array.from({ length: count }, () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return (state / 4_294_967_296) * 2 - 1;
  });
}

const round = (value: number) => Math.round(value * 1000) / 1000;

const JITTER = noise(7, STEPS);

/** The raw weight after each step: a trend toward 0.7 plus batch noise. */
export const RAW = JITTER.map((n, i) => round(0.7 - 0.55 * Math.exp(-i / 14) + 0.16 * n));

/** Its moving average; the first value copies the raw weight. */
export const EMA = RAW.reduce<number[]>((out, value, i) => {
  out.push(i === 0 ? value : round(DECAY * out[i - 1] + (1 - DECAY) * value));
  return out;
}, []);

/** About how many recent steps the average spans: 1 / (1 - d). */
export const WINDOW = Math.round(1 / (1 - DECAY));
