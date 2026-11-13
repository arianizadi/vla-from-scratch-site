/**
 * The chapter's learning-rate schedule, computed: linear warm-up over the
 * first 1000 optimiser steps, then a cosine decay from 5e-4 to 1e-5 at the
 * last step of the budget. Batch 64, so a budget of B samples has B // 64
 * optimiser steps. Same formula as the chapter's "Check yourself".
 */

const BASE = 5e-4;
const MIN = 1e-5;
const WARMUP = 1000;
const BATCH = 64;

export function rate(step: number, total: number): number {
  if (step < WARMUP) return (BASE * (step + 1)) / WARMUP;
  return MIN + 0.5 * (1 + Math.cos((Math.PI * (step - WARMUP)) / (total - WARMUP))) * (BASE - MIN);
}

/** The three budgets the chapter compares, in samples. */
export const BUDGETS = [5_000_000, 3_000_000, 1_000_000] as const;

/** Points (samples, rate) along a run with this budget, rounded so server and browser agree. */
export function curve(budget: number, points = 48): [number, number][] {
  const total = Math.floor(budget / BATCH);
  const out: [number, number][] = [[0, rate(0, total)]];
  const warmEnd = WARMUP * BATCH;
  out.push([warmEnd, rate(WARMUP - 1, total)]);
  for (let i = 1; i <= points; i += 1) {
    const samples = warmEnd + ((budget - warmEnd) * i) / points;
    const step = Math.min(total - 1, Math.floor(samples / BATCH));
    out.push([Math.round(samples), Math.round(rate(step, total) * 1e9) / 1e9]);
  }
  return out;
}

/** The rate after 1.0M samples (optimiser step 15,625) under each budget. */
export function rateAtOneMillion(budget: number): number {
  const total = Math.floor(budget / BATCH);
  const step = Math.min(total - 1, 15_625);
  return Math.round(rate(step, total) * 1e9) / 1e9;
}
