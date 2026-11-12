/**
 * The toy model behind the training-step figure, and every number it shows.
 *
 * A straight line with two weights, prediction = w * x + b, fitted to a batch
 * of four (input, target) pairs with the mean squared error. One optimisation
 * step is plain gradient descent:
 *
 *   forward   prediction_i = w * x_i + b
 *   loss      L = mean over i of (prediction_i - y_i)^2
 *   backward  dL/dw = mean of 2 (prediction_i - y_i) x_i,  dL/db = mean of 2 (prediction_i - y_i)
 *   update    w <- w - lr * dL/dw,  b <- b - lr * dL/db
 *
 * Nothing here is measured: it is a worked example, computed in the browser.
 * The loss is a quadratic in (w, b), so its contour lines are exact ellipses
 * and the largest learning rate at which the steps still settle follows from
 * the curvature of the loss (2 / its largest eigenvalue).
 */

export interface Example {
  x: number;
  y: number;
}

export interface Weights {
  w: number;
  b: number;
}

/** The batch: four inputs and their targets, roughly on a line, not exactly. */
export const BATCH: readonly Example[] = [
  { x: -1, y: -0.7 },
  { x: 0, y: 0.5 },
  { x: 1, y: 1.1 },
  { x: 2, y: 2.0 },
];

/**
 * Where the weights start: a line that slopes the wrong way, about a unit from
 * the floor of the valley across its narrow width, so that an overshoot there
 * is large enough to see.
 */
export const START: Weights = { w: -0.7, b: 0.9 };

/** How many optimisation steps the reader can walk through. */
export const STEPS = 8;

export const STAGES = ["forward", "loss", "backward", "update"] as const;
export type Stage = (typeof STAGES)[number];
export const STAGE_NAME: Record<Stage, string> = {
  forward: "Forward",
  loss: "Loss",
  backward: "Backward",
  update: "Update",
};

/** The learning-rate slider: its range, step and starting value. */
export const RATE = { min: 0.02, max: 0.8, step: 0.02, initial: 0.1 } as const;

export interface Row extends Example {
  /** w * x + b */
  prediction: number;
  /** prediction - y */
  error: number;
  /** (prediction - y)^2 */
  squared: number;
  /** 2 (prediction - y) x: this example's share of dL/dw, before the mean. */
  gradW: number;
  /** 2 (prediction - y): this example's share of dL/db, before the mean. */
  gradB: number;
}

export interface Pass {
  weights: Weights;
  rows: Row[];
  loss: number;
  /** Whether the loss has at most LOSS_DIGITS decimals, so that the shown value is the value itself. */
  lossExact: boolean;
  gradient: Weights;
}

/*
 * Kept to the precision it is shown at. The weights are held to two decimals
 * (the update is rounded), the inputs are whole numbers and the targets have
 * one decimal, so every prediction and error has at most two decimals, every
 * squared error at most four, and each gradient at most three. The sums are
 * done in whole hundredths, so the arithmetic in the worked table is the
 * arithmetic of the model, digit for digit.
 */
export const WEIGHT_DIGITS = 2;
export const SQUARE_DIGITS = 4;
export const LOSS_DIGITS = 4;
export const GRADIENT_DIGITS = 3;

const hundredths = (value: number) => Math.round(value * 100);
/** Integer division rounded half away from zero, as a reader rounds by hand. */
const divideRounded = (numerator: number, denominator: number) =>
  Math.sign(numerator) * Math.floor((Math.abs(numerator) + denominator / 2) / denominator);

export function predict(weights: Weights, x: number): number {
  return weights.w * x + weights.b;
}

/** The loss anywhere in weight space (for the contour lines and the minimum). */
export function loss(weights: Weights): number {
  let sum = 0;
  for (const { x, y } of BATCH) sum += (predict(weights, x) - y) ** 2;
  return sum / BATCH.length;
}

/** Forward, loss and backward for weights held to two decimals, exactly. */
export function pass(weights: Weights): Pass {
  const w = hundredths(weights.w);
  const b = hundredths(weights.b);
  let squares = 0; // in ten-thousandths
  let sumErrorX = 0; // in hundredths
  let sumError = 0; // in hundredths
  const rows = BATCH.map(({ x, y }) => {
    const p = w * x + b;
    const e = p - hundredths(y);
    squares += e * e;
    sumErrorX += e * x;
    sumError += e;
    return { x, y, prediction: p / 100, error: e / 100, squared: (e * e) / 10000, gradW: (2 * e * x) / 100, gradB: (2 * e) / 100 };
  });
  const n = rows.length;
  // mean of 2 e x = sum(e x) * 2 / n; in thousandths that is sum(e x) * 20 / n (exact for n = 4).
  return {
    weights,
    rows,
    loss: squares / n / 10000,
    lossExact: squares % n === 0,
    gradient: { w: (sumErrorX * 20) / n / 1000, b: (sumError * 20) / n / 1000 },
  };
}

export interface Update {
  /** -rate * gradient, rounded to two decimals: what is added to each weight. */
  step: Weights;
  /** Whether each step needed rounding. */
  rounded: { w: boolean; b: boolean };
  after: Weights;
}

/** The update: each weight moves against its gradient by the learning rate times the gradient, rounded to two decimals. */
export function update(weights: Weights, gradient: Weights, rate: number): Update {
  const r = hundredths(rate);
  const move = (g: number) => {
    const product = -r * Math.round(g * 1000); // in hundred-thousandths
    return { value: divideRounded(product, 1000), rounded: product % 1000 !== 0 };
  };
  const dw = move(gradient.w);
  const db = move(gradient.b);
  return {
    step: { w: dw.value / 100, b: db.value / 100 },
    rounded: { w: dw.rounded, b: db.rounded },
    after: { w: (hundredths(weights.w) + dw.value) / 100, b: (hundredths(weights.b) + db.value) / 100 },
  };
}

/** The weights before step 1, after step 1, ..., after step `steps`, all with one learning rate. */
export function trajectory(rate: number, steps = STEPS): Weights[] {
  const points: Weights[] = [START];
  for (let index = 0; index < steps; index += 1) {
    const current = points[index];
    points.push(update(current, pass(current).gradient, rate).after);
  }
  return points;
}

// --------------------------------------------------------------------------
// The shape of the loss. L(w, b) = L* + (d)^T A (d) with d = (w, b) - minimum
// and A = mean over the batch of [[x^2, x], [x, 1]]. The curvature (Hessian)
// is 2A.
// --------------------------------------------------------------------------

const n = BATCH.length;
const meanXX = BATCH.reduce((sum, { x }) => sum + x * x, 0) / n;
const meanX = BATCH.reduce((sum, { x }) => sum + x, 0) / n;
const meanY = BATCH.reduce((sum, { y }) => sum + y, 0) / n;
const meanXY = BATCH.reduce((sum, { x, y }) => sum + x * y, 0) / n;

/** The weights with the lowest loss on this batch (least squares). */
export const MINIMUM: Weights = (() => {
  const w = (meanXY - meanX * meanY) / (meanXX - meanX * meanX);
  return { w, b: meanY - w * meanX };
})();
export const MINIMUM_LOSS = loss(MINIMUM);

interface Axis2 {
  /** Eigenvalue of A. */
  value: number;
  /** Unit eigenvector, in (w, b). */
  vector: Weights;
}

/** Eigenvalues and eigenvectors of A, largest first. */
const AXES: [Axis2, Axis2] = (() => {
  const a = meanXX;
  const c = meanX;
  const d = 1;
  const mean = (a + d) / 2;
  const spread = Math.sqrt(((a - d) / 2) ** 2 + c * c);
  const big = mean + spread;
  const small = mean - spread;
  const unit = (w: number, b: number): Weights => {
    const length = Math.hypot(w, b);
    return { w: w / length, b: b / length };
  };
  // (A - lambda I) v = 0  ->  v = (c, lambda - a) unless c is 0.
  const vectorFor = (value: number) => (Math.abs(c) > 1e-12 ? unit(c, value - a) : value === a ? unit(1, 0) : unit(0, 1));
  return [
    { value: big, vector: vectorFor(big) },
    { value: small, vector: vectorFor(small) },
  ];
})();

/** Largest eigenvalue of the curvature 2A: how sharply the loss bends in its steepest direction. */
export const SHARPEST = 2 * AXES[0].value;

/**
 * Above this rate a step overshoots the floor of the valley in its steepest
 * direction; above twice it, every overshoot is larger than the last and the
 * steps never settle.
 */
export const OVERSHOOT_RATE = 1 / SHARPEST;
export const DIVERGE_RATE = 2 / SHARPEST;

/**
 * In the steepest direction each step multiplies the distance to the valley
 * floor by 1 - rate * SHARPEST. Its size is how far the weights land on the
 * far side, as a fraction of how far they started on the near one; negative
 * when they stop short.
 */
export function overshootFactor(rate: number): number {
  return rate * SHARPEST - 1;
}

/**
 * The overshoot that shows as a zigzag in the drawing. From START the weights
 * are about one unit from the floor across the valley, and they move along it
 * at the same time, so an overshoot of less than about four tenths of that
 * leaves a bend in the trail rather than a visible back and forth.
 */
export const VISIBLE_OVERSHOOT = 0.4;
export const ZIGZAG_RATE = (1 + VISIBLE_OVERSHOOT) / SHARPEST;

export type Regime = "creeps" | "overshoots" | "diverges";

export function regime(rate: number): Regime {
  if (rate >= DIVERGE_RATE) return "diverges";
  if (rate > OVERSHOOT_RATE) return "overshoots";
  return "creeps";
}

/** Points on the contour line where the loss equals `level`: an ellipse around the minimum. */
export function contour(level: number, samples = 96): Weights[] {
  const excess = level - MINIMUM_LOSS;
  if (excess <= 0) return [];
  const [major, minor] = [AXES[1], AXES[0]]; // the long axis lies along the shallow direction
  const ra = Math.sqrt(excess / major.value);
  const rb = Math.sqrt(excess / minor.value);
  return Array.from({ length: samples }, (_, index) => {
    const angle = (2 * Math.PI * index) / samples;
    const u = ra * Math.cos(angle);
    const v = rb * Math.sin(angle);
    return {
      w: MINIMUM.w + u * major.vector.w + v * minor.vector.w,
      b: MINIMUM.b + u * major.vector.b + v * minor.vector.b,
    };
  });
}

/** The loss levels drawn as contour lines. */
export const LEVELS = [0.1, 0.25, 0.5, 1, 2, 4, 8, 16] as const;

// --------------------------------------------------------------------------
// Numbers as text. One function everywhere, so the table, the drawing and the
// status line agree to the last digit. A true minus sign; no "-0.00".
// --------------------------------------------------------------------------

export function num(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "too large to show";
  const rounded = Number(value.toFixed(digits));
  const magnitude = Math.abs(rounded);
  const text =
    magnitude >= 1000
      ? magnitude.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })
      : magnitude.toFixed(digits);
  return rounded < 0 ? `−${text}` : text;
}

/** A value that was rounded to be shown carries "≈"; an exact one does not. */
export function approx(value: number, digits: number, exact: boolean): string {
  return exact ? num(value, digits) : `≈ ${num(value, digits)}`;
}

/** A factor in a product, bracketed when negative: 2 -> "2", -1 -> "(−1)". */
export function factor(value: number, digits = 2): string {
  const text = num(value, digits);
  return value < 0 && text.startsWith("−") ? `(${text})` : text;
}

export type Change = "lower" | "unchanged" | "higher";

/** What a step did to the loss. Once a step rounds to zero the weights, and the loss, stay put. */
export function change(before: number, after: number): Change {
  if (Math.abs(after - before) <= 1e-12 * Math.max(1, Math.abs(before))) return "unchanged";
  return after < before ? "lower" : "higher";
}

/** The glyph, its class and the word for a change of the loss. */
export const CHANGE_MARK: Record<Change, { glyph: string; className: string }> = {
  lower: { glyph: "✓", className: "ts-better" },
  unchanged: { glyph: "=", className: "ts-same" },
  higher: { glyph: "✗", className: "ts-worse" },
};

/** Decimals that tell two losses apart: two, or four when two would print them the same. */
export function lossDigits(a: number, b: number): number {
  return num(a) === num(b) ? 4 : 2;
}

/** A learning rate as text: 0.1 -> "0.10". */
export function rateText(rate: number): string {
  return rate.toFixed(2);
}
