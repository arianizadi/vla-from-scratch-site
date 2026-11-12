/**
 * The toy input of the attention figure and the computation the figure runs
 * on it: scores from queries and keys, the causal mask, a softmax per row.
 *
 * Nothing here is measured and nothing is learned. The sentence is the one
 * chapter 11 works through, one token per word, and every token has a query
 * and a key of four numbers. Two sets of vectors are offered:
 *
 * The chapter's example, picked by hand:
 *   - The keys of pick, the, red and cube are the four axes, so a query's
 *     entries are twice its scores against those tokens. The key of up is a
 *     combination of two axes, which is what lets five keys fit in four
 *     dimensions.
 *   - The query of cube gives the scores of the chapter's worked example
 *     (0.5, 0.1, 0.2, 2.0, 1.0), so the last row of the figure is the table
 *     the reader has just read: weights 0.117, 0.078, 0.087, 0.525, 0.193.
 *   - The other queries are chosen so that the mask matters: without it,
 *     every earlier token puts more than half of its weight on tokens after
 *     it, and the most on cube.
 *
 * A seeded draw: every entry from a standard normal distribution, rounded to
 * one decimal (so the vectors printed are exactly the ones used), from a
 * small deterministic generator. The same seed always gives the same vectors,
 * on the server and in every browser.
 */

export const TOKENS = ["pick", "up", "the", "red", "cube"] as const;

/** Number of tokens in the whole sentence. */
export const LENGTH = TOKENS.length;

/** How many numbers a query or a key has: the head width of this toy (64 in the model of chapter 11). */
export const HEAD_WIDTH = 4;

/** What the scores are divided by: the square root of the head width. */
export const SCALE = Math.sqrt(HEAD_WIDTH);

export type Vector = readonly number[];

export interface VectorSet {
  /** One query per token, in sentence order. */
  queries: readonly Vector[];
  /** One key per token, in sentence order. */
  keys: readonly Vector[];
  /** The seed of a drawn set; undefined for the chapter's example. */
  seed?: number;
}

/** The chapter's example (see the comment at the top of the file). */
export const CHAPTER_VECTORS: VectorSet = {
  keys: [
    [1, 0, 0, 0], // pick
    [1, -2, 0, 0], // up
    [0, 1, 0, 0], // the
    [0, 0, 1, 0], // red
    [0, 0, 0, 1], // cube
  ],
  queries: [
    [0.8, -0.8, 0.4, 3.6], // pick
    [1.2, -0.4, 0.8, 3.6], // up
    [0.4, 1.2, 2.8, 4.4], // the
    [-0.8, 1.8, 1.6, 4.8], // red
    [1.0, 0.4, 4.0, 2.0], // cube
  ],
};

/** mulberry32: a 32-bit generator, small and deterministic, uniform in [0, 1). */
function generator(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A query and a key per token, every entry from N(0, 1) rounded to one decimal. */
export function drawVectors(seed: number): VectorSet {
  const uniform = generator(seed * 2654435761);
  const normal = () => {
    // Box-Muller; 1 - u keeps the logarithm finite.
    const radius = Math.sqrt(-2 * Math.log(1 - uniform()));
    return radius * Math.cos(2 * Math.PI * uniform());
  };
  const vector = () => Array.from({ length: HEAD_WIDTH }, () => Math.round(normal() * 10) / 10 + 0);
  return {
    seed,
    queries: TOKENS.map(() => vector()),
    keys: TOKENS.map(() => vector()),
  };
}

function dot(a: Vector, b: Vector): number {
  return a.reduce((sum, value, index) => sum + value * b[index], 0);
}

/** Scaled dot product: the reader's query with the key of the token it reads, over the root of the head width. */
export function score(vectors: VectorSet, reader: number, read: number): number {
  return dot(vectors.queries[reader], vectors.keys[read]) / SCALE;
}

/** What one token reads: a row of the attention matrix, with every step of its computation. */
export interface Reading {
  /** Query times key over the root of the head width, one per token of the sequence. */
  scores: number[];
  /** What the causal mask adds to each score: 0, or minus infinity for a later token. */
  mask: number[];
  /** e raised to score + mask. */
  exps: number[];
  /** The sum of `exps`. */
  total: number;
  /** `exps` over `total`: the weights, which add up to 1. */
  weights: number[];
  /** How many tokens the row may read. */
  readable: number;
}

/** The row of token `reader` in a sequence of the first `length` tokens. */
export function readRow(vectors: VectorSet, reader: number, length: number, causal: boolean): Reading {
  const scores = Array.from({ length }, (_, read) => score(vectors, reader, read));
  const mask = scores.map((_, read) => (causal && read > reader ? -Infinity : 0));
  // Subtracting the largest readable score first, as every real implementation does, changes no weight.
  const largest = Math.max(...scores.filter((_, read) => mask[read] === 0));
  const exps = scores.map((value, read) => Math.exp(value + mask[read]));
  const shifted = scores.map((value, read) => Math.exp(value - largest + mask[read]));
  const shiftedTotal = shifted.reduce((sum, value) => sum + value, 0);
  return {
    scores,
    mask,
    exps,
    total: exps.reduce((sum, value) => sum + value, 0),
    weights: shifted.map((value) => value / shiftedTotal),
    readable: mask.filter((value) => value === 0).length,
  };
}

/** The whole matrix: one row per token of the sequence. */
export function attention(vectors: VectorSet, length: number, causal: boolean): Reading[] {
  return Array.from({ length }, (_, reader) => readRow(vectors, reader, length, causal));
}

/** Whether two rows hold the same weights. A token one of them does not have counts as weight 0. */
export function sameWeights(a: Reading, b: Reading): boolean {
  const length = Math.max(a.weights.length, b.weights.length);
  for (let read = 0; read < length; read += 1) {
    if (Math.abs((a.weights[read] ?? 0) - (b.weights[read] ?? 0)) > 1e-9) return false;
  }
  return true;
}

const MINUS = "−";

/** A number with a fixed count of decimals, a real minus sign, and no "-0.0". */
export function formatNumber(value: number, digits: number): string {
  if (value === -Infinity) return `${MINUS}∞`;
  const text = value.toFixed(digits);
  if (Number(text) === 0) return (0).toFixed(digits);
  return text.replace("-", MINUS);
}

/** A vector as the figure prints it: one decimal per entry, in brackets. */
export function formatVector(vector: Vector): string {
  return `[${vector.map((value) => formatNumber(value, 1)).join(", ")}]`;
}
