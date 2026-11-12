/**
 * Training loss against training samples, for the finished runs.
 *
 *   lossCurve("dp_vit_lang_reactive_pt4k")   [[16704, 1.75731], [33344, 0.69792], ...]
 *
 * Each curve is the logged loss averaged into at most 300 buckets; a point is
 * the samples seen at the end of its bucket and the mean loss in it. A
 * stopped run's curve ends at its last checkpoint. This module holds every
 * curve (about 60 kB), so import it only where a curve is drawn.
 */

import data from "./generated/loss-curves.json";

/** Training samples seen, and the loss there. */
export type LossPoint = [samples: number, loss: number];

const curves = data as unknown as Record<string, LossPoint[]>;

/** The loss curve of a finished run; empty for a run in progress. */
export function lossCurve(run: string): LossPoint[] {
  return curves[run] ?? [];
}
