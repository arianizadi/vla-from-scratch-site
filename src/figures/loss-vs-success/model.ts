/**
 * What the "loss-vs-success" figure draws, read from the data module: the
 * finished runs that have a loss curve and reported checkpoints, the runs
 * still in progress (listed, without a value), and, for one run, the
 * positions a reader can scrub through.
 *
 * Nothing here is measured or typed in: every number is a value of src/data
 * (runs, checkpoints, curves) or printed from one with format.ts. Which runs
 * are offered, in which group and order, and where the figure opens are all
 * decided from the data's own lists and statuses, so a run that finishes
 * later appears here without a change.
 */

import { checkpointRows, type CheckpointRow } from "@/data/checkpoints";
import { lossCurve, type LossPoint } from "@/data/curves";
import {
  MISSING,
  fixed,
  formatBudget,
  formatCount,
  formatInterval,
  formatPercent,
  formatSamples,
  parseSamples,
} from "@/data/format";
import {
  MACHINES,
  POSITION_FIX,
  RUN_FAMILIES,
  RUN_FAMILY_IDS,
  TASKS,
  WEIGHTS,
  WEIGHT_IDS,
  policySeries,
  runLabel,
} from "@/data/labels";
import { awaitedRuns, runsByGroup, unreported, type FinishedRun } from "@/data/runs";
import type { Evaluation, PositionFix, RunFamily, Weights } from "@/data/types";
import { POLICY_SERIES, SERIES, SERIES_SHAPES, tickStep, type MarkerShape } from "@/figures/kit";

// ---------------------------------------------------------------- series

/** How one set of weights is drawn. */
export interface WeightStyle {
  color: string;
  shape: MarkerShape;
  /** An outlined marker instead of a filled one. */
  hollow: boolean;
  /** The direction a marker is moved off the checkpoint's position, so the two stand next to each other. */
  side: -1 | 1;
}

/**
 * The two sets of weights of a checkpoint. Colour follows the policy across the
 * site (DESIGN.md, section 2), so the trained weights wear the run's policy
 * colour and marker, filled, and their running average the same marker,
 * outlined in muted ink: the two differ by fill and by value, and neither
 * borrows another policy's colour.
 */
function weightStyles(run: FinishedRun): Record<Weights, WeightStyle> {
  const key = policySeries(run.design);
  const policy = key ? POLICY_SERIES[key] : { color: SERIES[0], shape: SERIES_SHAPES[0] };
  return {
    raw: { color: policy.color, shape: policy.shape, hollow: false, side: -1 },
    ema: { color: "var(--text-muted)", shape: policy.shape, hollow: true, side: 1 },
  };
}

/** The notebook's own short names for the two sets of weights, shown beside the long ones in the legend. */
export const NOTEBOOK_WEIGHTS: Record<Weights, string> = { raw: "raw", ema: "EMA" };

/** A set of weights as the legend names it: "Trained weights (raw)", or with `short` "Trained (raw)". */
export function weightsLegend(kind: Weights, short = false): string {
  return `${capital(short ? WEIGHTS[kind].short : WEIGHTS[kind].label)} (${NOTEBOOK_WEIGHTS[kind]})`;
}

/** The loss is one line in a panel of its own: drawn in ink, like the outline of a drawing. */
export const LOSS_COLOR = "var(--text)";

export const capital = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

// ---------------------------------------------------------------- one run

/** A position of the scrubber: a point of the loss curve, or a reported checkpoint. */
export interface Stop {
  /** Training samples seen. */
  samples: number;
  /**
   * The logged loss here. At a point of the curve it is that point's value; at
   * a checkpoint it is the last point of the curve at or before it.
   */
  loss: number;
  /** Index of the checkpoint row this stop is, or null between checkpoints. */
  checkpoint: number | null;
  /** How many of the reported checkpoints had been saved by this point. */
  reached: number;
}

/** Where success rose the most: the checkpoint row after the rise, and the set of weights that rose. */
export interface Rise {
  index: number;
  kind: Weights;
}

export interface RunModel {
  run: FinishedRun;
  /**
   * The run in words, with its budget: "4000 demonstrations, no history, 5M
   * samples", or, for a run stopped early, where it stopped.
   */
  label: string;
  /** How each set of weights is drawn. */
  styles: Record<Weights, WeightStyle>;
  /** Before or after the fix, and the family, in words: "The reference recipe, before the position fix". */
  context: string;
  rows: CheckpointRow[];
  /** The weights the notebook reports for at least one checkpoint of the run, in the order trained, averaged. */
  weights: Weights[];
  curve: LossPoint[];
  /** Every position of the scrubber, in training order. */
  stops: Stop[];
  /** For each checkpoint row, the index of its stop. */
  checkpointStops: number[];
  /** Right end of the sample axis. */
  xMax: number;
  /** The first logged loss, and where it was logged. */
  lossStart: number;
  startSamples: number;
  /** Top of the loss axis when it shows the whole curve. */
  fullMax: number;
  /** Top of the loss axis when it is magnified: twice the loss after the first tenth of the run. */
  magnifiedMax: number;
  /** Layouts per evaluation, when every evaluation of the run used the same number. */
  episodes: number | null;
  /**
   * The checkpoint after the largest rise in success whose 95% interval does
   * not overlap the previous checkpoint's, with the set of weights that rose,
   * or null when success never rose that clearly between two reported
   * checkpoints.
   */
  largestRise: Rise | null;
  /** The stop the figure opens on: the largest rise, or the end of the run. */
  opening: number;
}

/** `value` rounded up to the next tick of an axis that starts at zero. */
function axisTop(value: number): number {
  const step = tickStep(0, value, 4);
  const decimals = Math.max(0, -Math.floor(Math.log10(step)));
  return Number((Math.ceil(value / step - 1e-9) * step).toFixed(decimals));
}

/**
 * The loss points and the checkpoints of a run merged into one sequence of
 * positions. A checkpoint is always a position of its own, so stepping
 * reaches every one of them, even two that were saved within one loss point.
 */
function buildStops(curve: LossPoint[], rows: CheckpointRow[]): Pick<RunModel, "stops" | "checkpointStops"> {
  const stops: Stop[] = [];
  const checkpointStops: number[] = [];
  let point = 0;
  let row = 0;
  let loss = curve[0][1];
  while (point < curve.length || row < rows.length) {
    const nextPoint = point < curve.length ? curve[point][0] : Infinity;
    const nextRow = row < rows.length ? rows[row].samples : Infinity;
    if (nextPoint <= nextRow) {
      loss = curve[point][1];
      const isCheckpoint = nextPoint === nextRow;
      if (isCheckpoint) checkpointStops.push(stops.length);
      stops.push({ samples: nextPoint, loss, checkpoint: isCheckpoint ? row : null, reached: isCheckpoint ? row + 1 : row });
      point += 1;
      if (isCheckpoint) row += 1;
    } else {
      checkpointStops.push(stops.length);
      stops.push({ samples: nextRow, loss, checkpoint: row, reached: row + 1 });
      row += 1;
    }
  }
  return { stops, checkpointStops };
}

/** The evaluation of one set of weights at a checkpoint, when the notebook reports it. */
export function evaluationAt(row: CheckpointRow | undefined, kind: Weights): Evaluation | null {
  return row ? (row[kind] ?? null) : null;
}

/**
 * Two checkpoints closer than this share of the run are not compared with
 * each other: the interval between them would be a sliver (the notebook has
 * a checkpoint at 4.99M and the final one at 5.0M). The one before is used.
 */
const MIN_GAP = 0.02;

/** The checkpoint row an interval ending at `index` starts from, or null for the start of training. */
function previousRow(rows: readonly CheckpointRow[], xMax: number, index: number): number | null {
  for (let before = index - 1; before >= 0; before -= 1) {
    if (rows[index].samples - rows[before].samples >= MIN_GAP * xMax) return before;
  }
  return null;
}

/**
 * Where success rose the most between two reported checkpoints, counting only
 * rises whose 95% intervals do not overlap: a jump the measurement can tell
 * from noise. Null when there is none.
 */
function findLargestRise(rows: CheckpointRow[], weights: Weights[], xMax: number): Rise | null {
  let best: Rise | null = null;
  let bestRise = 0;
  for (let index = 1; index < rows.length; index += 1) {
    const from = previousRow(rows, xMax, index);
    if (from === null) continue;
    for (const kind of weights) {
      const before = evaluationAt(rows[from], kind);
      const after = evaluationAt(rows[index], kind);
      if (!before || !after || after.ci[0] <= before.ci[1]) continue;
      const rise = after.rate - before.rate;
      if (rise > bestRise) {
        bestRise = rise;
        best = { index, kind };
      }
    }
  }
  return best;
}

/** The run in words for the heading and the selector: its budget, or where it was stopped. */
function runHeading(run: FinishedRun): string {
  return run.stopped
    ? `${runLabel(run)}, stopped at ${formatSamples(run.samples)} of ${formatBudget(run.samplesPlanned)}`
    : runLabel(run, { budget: true });
}

function buildModel(run: FinishedRun): RunModel {
  const rows = checkpointRows(run.name);
  const curve = lossCurve(run.name);
  const xMax = Math.max(run.samples, curve[curve.length - 1][0], rows[rows.length - 1].samples);
  const lossMax = Math.max(...curve.map(([, loss]) => loss));
  const afterTenth = curve.find(([samples]) => samples >= xMax / 10) ?? curve[curve.length - 1];
  const weights = WEIGHT_IDS.filter((kind) => rows.some((row) => row[kind] !== null));
  const counts = new Set(
    rows.flatMap((row) => weights.map((kind) => evaluationAt(row, kind)?.episodes).filter((value) => value !== undefined)),
  );
  const stops = buildStops(curve, rows);
  const largestRise = findLargestRise(rows, weights, xMax);
  const fix = POSITION_FIX[run.group.fix].label;
  return {
    run,
    label: runHeading(run),
    styles: weightStyles(run),
    context: run.group.family ? `${RUN_FAMILIES[run.group.family].label}, ${fix}` : capital(fix),
    rows,
    weights,
    curve,
    ...stops,
    xMax,
    lossStart: curve[0][1],
    startSamples: curve[0][0],
    fullMax: axisTop(lossMax),
    magnifiedMax: Math.min(axisTop(2 * afterTenth[1]), axisTop(lossMax)),
    episodes: counts.size === 1 ? [...counts][0]! : null,
    largestRise,
    opening: largestRise !== null ? stops.checkpointStops[largestRise.index] : stops.stops.length - 1,
  };
}

// ---------------------------------------------------------------- the runs on offer

const FIXES = Object.keys(POSITION_FIX) as PositionFix[];

/** The finished runs that have something for both panels, in the notebook's order. */
const models = new Map<string, RunModel>();
for (const fix of FIXES) {
  for (const entry of runsByGroup({ fix, status: "finished" })) {
    if (entry.status !== "finished") continue;
    if (checkpointRows(entry.name).length === 0 || lossCurve(entry.name).length === 0) continue;
    models.set(entry.name, buildModel(entry));
  }
}

export function runModel(name: string): RunModel | undefined {
  return models.get(name);
}

export interface RunOption {
  name: string;
  label: string;
  /** False for a run in progress: listed, not selectable, no value. */
  available: boolean;
}

export interface RunGroup {
  /** "The reference recipe, before the position fix". */
  label: string;
  options: RunOption[];
}

/** The families in the site's order, then the runs whose family the data could not read. */
const FAMILY_ORDER: (RunFamily | null)[] = [...RUN_FAMILY_IDS, null];

function groupLabel(family: RunFamily | null, fix: PositionFix): string {
  return `${family ? RUN_FAMILIES[family].label : "Other runs"}, ${POSITION_FIX[fix].label}`;
}

/**
 * The selector's entries, grouped as the data module groups runs: by family,
 * and within a family before the position fix, then after it, so the same
 * recipe before and after the fix sit next to each other. Within a group the
 * runs are in the notebook's order. A policy still in progress is listed,
 * marked so, and cannot be chosen: it has no loss curve and no checkpoint yet.
 */
export const RUN_GROUPS: RunGroup[] = FAMILY_ORDER.flatMap((family) =>
  FIXES.map((fix): RunGroup => {
    const options: RunOption[] = [];
    for (const entry of runsByGroup({ fix })) {
      if (entry.group.family !== family) continue;
      const model = models.get(entry.name);
      if (model) options.push({ name: entry.name, label: model.label, available: true });
      else if (entry.status === "in_progress" && entry.task !== null) {
        options.push({ name: entry.name, label: `${runLabel(entry, { budget: true })} (in progress)`, available: false });
      }
    }
    for (const entry of awaitedRuns()) {
      if (entry.group.fix !== fix || entry.group.family !== family) continue;
      if (entry.design.family !== "policy" && entry.design.family !== "vla") continue;
      // Its budget is known only when its name carries one.
      const planned = entry.design.budget ? parseSamples(entry.design.budget) : undefined;
      const label = planned ? runLabel({ ...entry, samplesPlanned: planned }, { budget: true }) : entry.label;
      options.push({ name: entry.name, label: `${label} (in progress)`, available: false });
    }
    return { label: groupLabel(family, fix), options };
  }),
).filter((group) => group.options.length > 0);

/** How far success rose within a run, over every reported evaluation. */
function spread(model: RunModel): number {
  const rates = model.rows.flatMap((row) => model.weights.map((kind) => evaluationAt(row, kind)?.rate ?? 0));
  return Math.max(...rates) - Math.min(...rates);
}

/** The run was trained with another seed than the usual one. */
const seeded = (model: RunModel) => model.run.design.seed !== null && model.run.design.seed !== undefined;

/**
 * The run shown first: the reference recipe before the position fix, the run
 * the chapters follow. Among several such runs, one trained with the usual
 * seed (a second seed is a repeat of it), then the one with the most reported
 * checkpoints, then the notebook's order. Should the data no longer offer it,
 * the run whose success spread the most.
 */
export const DEFAULT_RUN: string | undefined =
  runsByGroup({ fix: "before", family: "reference", status: "finished" })
    .map((entry, order) => ({ model: models.get(entry.name), order }))
    .filter((candidate): candidate is { model: RunModel; order: number } => candidate.model !== undefined)
    .sort(
      (a, b) =>
        Number(seeded(a.model)) - Number(seeded(b.model)) ||
        b.model.rows.length - a.model.rows.length ||
        a.order - b.order,
    )[0]?.model.run.name ?? [...models.values()].sort((a, b) => spread(b) - spread(a))[0]?.run.name;

// ---------------------------------------------------------------- finding a position

/** The last stop at or before a number of training samples. */
export function stopAtOrBefore(stops: readonly Stop[], samples: number): number {
  let low = 0;
  let high = stops.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (stops[middle].samples <= samples) low = middle;
    else high = middle - 1;
  }
  return low;
}

/** The stop nearest to a number of training samples. */
export function nearestStop(stops: readonly Stop[], samples: number): number {
  const before = stopAtOrBefore(stops, samples);
  const after = Math.min(before + 1, stops.length - 1);
  return samples - stops[before].samples <= stops[after].samples - samples ? before : after;
}

/** The first checkpoint stop after a stop, or null at the last one. */
export function nextCheckpointStop(model: RunModel, at: number): number | null {
  return model.checkpointStops.find((stop) => stop > at) ?? null;
}

/** The last checkpoint stop before a stop, or null before the first one. */
export function previousCheckpointStop(model: RunModel, at: number): number | null {
  return model.checkpointStops.findLast((stop) => stop < at) ?? null;
}

// ---------------------------------------------------------------- the interval at the scrubber

/** One end of the interval the readout compares: a checkpoint, the start of the logged curve, or the scrubber. */
export interface End {
  /** "2.0M", or "Start" for the first logged loss. */
  heading: string;
  samples: number;
  loss: number;
  /** The checkpoint row, when this end is one. */
  row: CheckpointRow | null;
  /** Its index among the reported checkpoints, when this end is one. */
  index: number | null;
}

export interface Interval {
  from: End;
  to: End;
}

function startEnd(model: RunModel): End {
  return { heading: "Start", samples: model.startSamples, loss: model.lossStart, row: null, index: null };
}

function checkpointEnd(model: RunModel, index: number): End {
  const row = model.rows[index];
  return {
    heading: rowSamples(row),
    samples: row.samples,
    loss: model.stops[model.checkpointStops[index]].loss,
    row,
    index,
  };
}

/** The interval that ends at a checkpoint: from the reported checkpoint before it (not a sliver away), or the start. */
function intervalTo(model: RunModel, index: number): Interval {
  const from = previousRow(model.rows, model.xMax, index);
  return { from: from === null ? startEnd(model) : checkpointEnd(model, from), to: checkpointEnd(model, index) };
}

/**
 * The interval the figure marks at the scrubber: from the checkpoint before
 * the latest one reached (or the start of training) to the latest one
 * reached. Before the first checkpoint, from the start to the scrubber.
 */
export function interval(model: RunModel, at: number): Interval {
  const stop = model.stops[at];
  if (stop.reached === 0) {
    return {
      from: startEnd(model),
      to: { heading: formatPosition(stop.samples), samples: stop.samples, loss: stop.loss, row: null, index: null },
    };
  }
  return intervalTo(model, stop.reached - 1);
}

/**
 * The interval just before the one at the scrubber, ending where that one
 * starts: what the loss and success did one step earlier, to compare with.
 * Null when the interval at the scrubber starts at the start of training.
 */
export function previousInterval(model: RunModel, at: number): Interval | null {
  const { from } = interval(model, at);
  return from.index === null ? null : intervalTo(model, from.index);
}

// ---------------------------------------------------------------- words

/** A loss value as the notebook writes one: three decimals. */
export function formatLoss(loss: number): string {
  return fixed(loss, 3);
}

const MINUS = "−";

/**
 * A position of the scrubber on the sample axis, finer than the notebook's
 * 0.1M so that neighbouring positions read apart: "2.48M", "350k". A
 * position, not a measurement.
 */
export function formatPosition(samples: number): string {
  return samples < 1e6 ? `${fixed(samples / 1e3)}k` : `${fixed(samples / 1e6, 2)}M`;
}

/** The change between two printed values, signed: "−0.007". Computed from the printed values, so it adds up. */
export function lossChange(from: number, to: number): string {
  const change = Number(formatLoss(to)) - Number(formatLoss(from));
  const text = fixed(Math.abs(change), 3);
  return Number(text) === 0 ? text : `${change < 0 ? MINUS : "+"}${text}`;
}

/** The same change as a share of the value it started from: "−11%". Also from the printed values. */
export function lossRelative(from: number, to: number): string {
  const start = Number(formatLoss(from));
  if (start === 0) return MISSING;
  const change = (Number(formatLoss(to)) - start) / start;
  const text = fixed(Math.abs(100 * change));
  return Number(text) === 0 ? "0%" : `${change < 0 ? MINUS : "+"}${text}%`;
}

/** Percentage points between two printed percentages: "+52 points". */
export function rateChange(from: Evaluation | null, to: Evaluation | null): string {
  if (!from || !to) return MISSING;
  const change = Number(fixed(100 * to.rate)) - Number(fixed(100 * from.rate));
  if (change === 0) return "0 points";
  return `${change < 0 ? MINUS : "+"}${Math.abs(change)} ${Math.abs(change) === 1 ? "point" : "points"}`;
}

/** A checkpoint's place on the sample axis, as the notebook's first column has it: "5.0M (final)". */
export function rowSamples(row: CheckpointRow): string {
  return row.final ? `${formatSamples(row.samples)} (final)` : formatSamples(row.samples);
}

function evaluationText(evaluation: Evaluation | null): string {
  if (!evaluation) return "not reported";
  return `${formatCount(evaluation.successes, evaluation.episodes)} (95% interval ${formatInterval(evaluation.ci)})`;
}

function resultsText(model: RunModel, row: CheckpointRow): string {
  return model.weights.map((kind) => `${WEIGHTS[kind].label} ${evaluationText(row[kind])}`).join(", ");
}

const since = (end: End) => (end.row ? end.heading : "the start");

/** The current position in one sentence, for the frame's status line. */
export function statusText(model: RunModel, at: number): string {
  const stop = model.stops[at];
  const loss = `training loss ${formatLoss(stop.loss)}`;
  if (stop.reached === 0) {
    return `${formatPosition(stop.samples)} samples: ${loss}. No checkpoint is reported before ${rowSamples(model.rows[0])}.`;
  }
  const { from, to } = interval(model, at);
  const before = previousInterval(model, at);
  const row = to.row!;
  const which = `${stop.reached} of ${model.rows.length}`;
  const earlier = before
    ? `, after ${lossRelative(before.from.loss, before.to.loss)} from ${since(before.from)} to ${before.to.heading}`
    : "";
  const lossText = `Since ${since(from)}, the loss went from ${formatLoss(from.loss)} to ${formatLoss(to.loss)} (${lossRelative(from.loss, to.loss)}${earlier})`;
  const rise = from.row
    ? `, and success went from ${model.weights
        .map(
          (kind) =>
            `${formatPercent(evaluationAt(from.row!, kind)?.rate)} to ${formatPercent(evaluationAt(row, kind)?.rate)} with the ${WEIGHTS[kind].label}`,
        )
        .join(" and from ")}`
    : "";
  const head =
    stop.checkpoint === null
      ? `${formatPosition(stop.samples)} samples, ${loss}. Latest checkpoint, ${which}, at ${rowSamples(row)}`
      : `Checkpoint ${which}, at ${rowSamples(row)}`;
  return `${head}: ${resultsText(model, row)}. ${lossText}${rise}.`;
}

/**
 * A short status for a scrubber that is being dragged or stepped through the
 * loss points: it names the latest checkpoint reached, so it changes (and is
 * announced) only when a checkpoint is passed. The slider itself reads out
 * the position and the loss.
 */
export function briefStatus(model: RunModel, at: number): string {
  const { reached } = model.stops[at];
  if (reached === 0) return `No checkpoint reached yet; the first is at ${rowSamples(model.rows[0])}.`;
  return `Latest checkpoint reached: ${reached} of ${model.rows.length}, at ${rowSamples(model.rows[reached - 1])}.`;
}

/** The whole figure in words, with its numbers: the text alternative of the drawing. */
export function describe(model: RunModel): string {
  const { rows } = model;
  const lossAt = (row: number) => formatLoss(model.stops[model.checkpointStops[row]].loss);
  const first = rows[0];
  const last = rows[rows.length - 1];
  const loss =
    rows.length > 1
      ? `The logged loss starts at ${formatLoss(model.lossStart)}; it is ${lossAt(0)} at the first reported checkpoint (${formatSamples(first.samples)} samples) and ${lossAt(rows.length - 1)} at the last (${formatSamples(last.samples)} samples).`
      : `The logged loss starts at ${formatLoss(model.lossStart)} and is ${lossAt(0)} at the one reported checkpoint (${formatSamples(first.samples)} samples).`;
  const names = model.weights.map((kind) => WEIGHTS[kind].label).join(" and ");
  const success = rows
    .map((row) => `${rowSamples(row)}: ${model.weights.map((kind) => formatPercent(evaluationAt(row, kind)?.rate)).join(" and ")}`)
    .join("; ");
  const parts = [
    `Training loss and closed-loop success of one run (${model.label}) against training samples seen.`,
    loss,
    `Success by checkpoint, ${names}: ${success}.`,
  ];
  if (model.largestRise !== null) {
    const { index, kind } = model.largestRise;
    const { from, to } = intervalTo(model, index);
    const rate = (row: CheckpointRow | null, which: Weights) => formatPercent(evaluationAt(row ?? undefined, which)?.rate);
    const others = model.weights
      .filter((other) => other !== kind)
      .map((other) => ` (the ${WEIGHTS[other].label} went from ${rate(from.row, other)} to ${rate(to.row, other)})`)
      .join("");
    parts.push(
      `The largest clear rise in success: the ${WEIGHTS[kind].label} went from ${rate(from.row, kind)} to ${rate(to.row, kind)} between ${since(from)} and ${to.heading}${others}. Over the same interval the loss went from ${formatLoss(from.loss)} to ${formatLoss(to.loss)} (${lossRelative(from.loss, to.loss)}).`,
    );
  }
  return parts.join(" ");
}

/** The small print under the caption: what was measured, on what. */
export function noteText(model: RunModel): string {
  const { run, rows, curve } = model;
  const parts: string[] = [];
  const where = run.machine ? ` on ${MACHINES[run.machine].label}` : "";
  parts.push(`${run.task ? `${TASKS[run.task].label} task. ` : ""}One run${where}, one training seed.`);
  parts.push(`Loss: the logged training loss, averaged into ${curve.length} points.`);
  const both = model.weights.length > 1;
  parts.push(
    `Success: each checkpoint run closed-loop${model.episodes ? ` on ${model.episodes} unseen layouts` : " on unseen layouts"}${
      both ? `, once with its ${WEIGHTS.raw.label} and once with its ${WEIGHTS.ema.label}` : `, with its ${WEIGHTS[model.weights[0]].label}`
    }; the whiskers are Wilson 95% intervals.`,
  );
  if (!both) {
    const missing = WEIGHT_IDS.find((kind) => !model.weights.includes(kind));
    if (missing) parts.push(`The lab notebook reports no ${WEIGHTS[missing].label} for this run.`);
  } else if (rows.some((row) => model.weights.some((kind) => row[kind] === null))) {
    parts.push(`Where a checkpoint has one marker, the lab notebook reports only that set of weights.`);
  }
  const left = unreported.checkpoints[run.name]?.length ?? 0;
  if (left > 0) {
    parts.push(
      `The lab notebook reports ${rows.length} of the run's ${rows.length + left} checkpoints; the others are not drawn.`,
    );
  }
  if (run.stopped) {
    parts.push(`The run was stopped at ${formatSamples(run.samples)} of ${formatBudget(run.samplesPlanned)} planned samples.`);
  }
  return parts.join(" ");
}
