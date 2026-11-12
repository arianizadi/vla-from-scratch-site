/**
 * The notebook's tables after the position fix that compare runs:
 *
 *   beforeAfterPairs()                                   every recipe trained before and after the fix
 *   beforeAfter("dp_vit_lang_reactive_pt4k_posfix")      the pair a run belongs to, checkpoint by checkpoint
 *   pooledPerObject("dp_vit_lang_reactive_pt4k_rs_posfix")   success by object over the last checkpoints
 *   comparisonRows("demonstrations")                     the runs of a table, in its row order, with its words
 *
 * The values are the evaluations of checkpoints.ts: these tables say which
 * checkpoints the notebook sets side by side. The battery of conditions is in
 * probes.ts (battery, expertBattery).
 */

import { checkpointRows } from "./checkpoints";
import data from "./generated/comparisons.json";
import type { Count, Evaluation, ObjectId, Weights } from "./types";

interface PairData {
  section: string;
  before: string;
  after: string;
  weights: Weights[];
  rows: { samples: string; before: number | null; after: number | null }[];
  perObject: {
    weights: Weights;
    before: { checkpoint: number; counts: Partial<Record<ObjectId, Count>> };
    after: { checkpoint: number; counts: Partial<Record<ObjectId, Count>> };
  } | null;
}

interface PooledData {
  section: string;
  checkpoints: number[];
  weights: Weights[];
  perObject: Partial<Record<ObjectId, Count>>;
}

interface TableData {
  section: string;
  columns: string[];
  rows: { run: string; words: string }[];
}

const comparisons = data as unknown as {
  beforeAfter: PairData[];
  pooled: Record<string, PooledData>;
  tables: Record<string, TableData>;
};

/** One side of a row: a checkpoint of one run, with the weights the table compares. */
export interface PairSide {
  checkpoint: number;
  raw: Evaluation | null;
  ema: Evaluation | null;
}

/** One row of a before/after table: the same number of samples in both runs. */
export interface BeforeAfterRow {
  /** As the notebook prints it: "0.5M". */
  samples: string;
  /** Null where the notebook leaves that run's cells empty, or the run is still in progress. */
  before: PairSide | null;
  after: PairSide | null;
}

/** The same recipe trained before and after the position fix, as one notebook table compares them. */
export interface BeforeAfterPair {
  /** The notebook heading of the table. */
  section: string;
  /** The run with the old position table, and the one with the fixed table. */
  before: string;
  after: string;
  /** The weights the table compares: the trained ones, or both. */
  weights: Weights[];
  rows: BeforeAfterRow[];
  /** Successes by object at the final checkpoint of each, with `weights`, when the notebook gives them. */
  perObject: PairData["perObject"];
}

function sideOf(run: string, checkpoint: number | null, weights: Weights[]): PairSide | null {
  if (checkpoint === null) return null;
  const row = checkpointRows(run).find((candidate) => candidate.checkpoint === checkpoint);
  if (!row) return null;
  return {
    checkpoint,
    raw: weights.includes("raw") ? row.raw : null,
    ema: weights.includes("ema") ? row.ema : null,
  };
}

const pairs: BeforeAfterPair[] = comparisons.beforeAfter.map((pair) => ({
  ...pair,
  rows: pair.rows.map((row) => ({
    samples: row.samples,
    before: sideOf(pair.before, row.before, pair.weights),
    after: sideOf(pair.after, row.after, pair.weights),
  })),
}));

/**
 * Every before/after pair the notebook reports and the data has: the reference
 * recipe today; the second seed (old table against fixed table) once its runs
 * are reported. A pair is here when at least one of its runs is finished; the
 * side of a run in progress is null.
 */
export function beforeAfterPairs(): BeforeAfterPair[] {
  return pairs;
}

/** The pair a run belongs to, before or after; the first one when no run is given. */
export function beforeAfter(run?: string): BeforeAfterPair | undefined {
  return run === undefined ? pairs[0] : pairs.find((pair) => pair.before === run || pair.after === run);
}

/** Success by object, pooled over a run's last checkpoints with every weights saved, as the notebook pools them. */
export interface PooledPerObject {
  section: string;
  /** The checkpoints pooled, and the weights. */
  checkpoints: number[];
  weights: Weights[];
  perObject: Partial<Record<ObjectId, Count>>;
}

/** The pooled counts of a run, when the notebook reports them. */
export function pooledPerObject(run: string): PooledPerObject | undefined {
  return comparisons.pooled[run];
}

/**
 * The ids of the comparison tables whose rows are runs:
 *
 *   demonstrations         success at fixed points of training, and the best checkpoint
 *   demonstrationsNamed    closed at the named object and slope at the same points
 *   demonstrationsObjects  success by object (see pooledPerObject)
 */
export type ComparisonTable = "demonstrations" | "demonstrationsNamed" | "demonstrationsObjects";

/**
 * The finished runs of a comparison table, in its row order, with the words
 * of its first column, and the table's section and column headings. A run in
 * progress is not among them: list it from runs.ts, without a value.
 */
export function comparisonRows(table: ComparisonTable): TableData | undefined {
  return comparisons.tables[table];
}
