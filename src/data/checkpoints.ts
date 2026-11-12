/**
 * Closed-loop evaluations by checkpoint: one row per saved checkpoint of a
 * finished run, with the trained weights (`raw`) and their running average
 * (`ema`) evaluated on the same 100 unseen layouts.
 *
 *   checkpoints("dp_vit_lang_reactive_pt4k")         every reported row with both weights, in training order
 *   checkpointAt("dp_vit_lang_reactive_pt4k", 2e6)   the row nearest to 2.0M samples
 *   finalCheckpoint("dp_vit_lang_reactive_pt4k")     the last row
 *
 *   checkpointRows("dp_vit_lang_reactive_pt4k_posfix")      every reported row, `ema` null where the notebook
 *                                                            reports the trained weights alone
 *   finalCheckpointRow("dp_vit_lang_reactive_pt4k_posfix")  its last row: 93/100 with the trained weights
 *
 * Only the rows the lab notebook prints are here. For some runs the notebook
 * prints every second checkpoint, or the final one alone; `unreported` in
 * runs.ts names the rest. A run in progress has no rows.
 *
 * Several runs after the position fix saved no averaged weights, and the
 * notebook's comparison tables print some checkpoints of a run and not
 * others. `checkpoints(run)` returns the rows that have both weights, so a
 * figure that draws both never meets a missing one; `checkpointRows(run)`
 * returns every reported row.
 */

import data from "./generated/checkpoints.json";
import type { Evaluation, Weights } from "./types";

/** A reported checkpoint whose averaged weights may be missing: not saved, or not printed by the notebook. */
export interface CheckpointRow {
  /** Number of the checkpoint within its run, from 1. */
  checkpoint: number;
  /** Training samples seen when it was saved. */
  samples: number;
  /** The checkpoint written at the end of a run that used its whole budget; the notebook marks it "(final)". */
  final: boolean;
  /** The trained weights. */
  raw: Evaluation;
  /** Their running average; null when the run did not save it or the notebook does not report it here. */
  ema: Evaluation | null;
}

/** A reported checkpoint with both weights. */
export interface Checkpoint extends CheckpointRow {
  /** Their running average. */
  ema: Evaluation;
}

const rows = data as unknown as Record<string, CheckpointRow[]>;
const hasBoth = (row: CheckpointRow): row is Checkpoint => row.ema !== null;

/**
 * The reported checkpoints of a run that have both weights, in training order.
 * Empty for a run in progress, a run without evaluations, and a run the
 * notebook reports with its trained weights alone (use `checkpointRows`).
 */
export function checkpoints(run: string): Checkpoint[] {
  return (rows[run] ?? []).filter(hasBoth);
}

/** Every reported checkpoint of a run, in training order; `ema` is null where only the trained weights are reported. */
export function checkpointRows(run: string): CheckpointRow[] {
  return rows[run] ?? [];
}

/** The names of the runs that have reported checkpoints with both weights. */
export function runsWithCheckpoints(): string[] {
  return Object.keys(rows).filter((run) => checkpoints(run).length > 0);
}

/** The names of the runs that have any reported checkpoint. */
export function runsWithCheckpointRows(): string[] {
  return Object.keys(rows);
}

function nearest<Row extends CheckpointRow>(list: Row[], samples: number): Row | undefined {
  let found: Row | undefined;
  for (const row of list) {
    if (!found || Math.abs(row.samples - samples) <= Math.abs(found.samples - samples)) found = row;
  }
  return found;
}

/** The reported checkpoint with both weights nearest to a number of training samples; of two equally near, the later one. */
export function checkpointAt(run: string, samples: number): Checkpoint | undefined {
  return nearest(checkpoints(run), samples);
}

/** The same among every reported row. */
export function checkpointRowAt(run: string, samples: number): CheckpointRow | undefined {
  return nearest(checkpointRows(run), samples);
}

/** The last reported checkpoint of a run with both weights: its final one, or where a stopped run stood. */
export function finalCheckpoint(run: string): Checkpoint | undefined {
  return checkpoints(run).at(-1);
}

/** The last reported row of a run, whatever weights it has. */
export function finalCheckpointRow(run: string): CheckpointRow | undefined {
  return checkpointRows(run).at(-1);
}

/** One evaluation: the given weights of the given checkpoint number, when the notebook reports them. */
export function evaluationOf(run: string, checkpoint: number, weights: Weights): Evaluation | undefined {
  return checkpointRows(run).find((row) => row.checkpoint === checkpoint)?.[weights] ?? undefined;
}
