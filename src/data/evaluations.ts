/**
 * From a published per-episode file to the evaluation it belongs to, so a
 * figure that draws the episodes can print the evaluation's numbers beside
 * them:
 *
 *   const file = graspFiles({ run: "dp_vit_lang_reactive_pt4k", variant: "plain", weights: "ema" })[0];
 *   evaluationOfGraspFile(file)?.missMm;      // the median miss of the episodes in that file
 *
 * It reads the checkpoints and the probes, so it is a module of its own:
 * importing files.ts alone does not pull them in.
 */

import { evaluationOf } from "./checkpoints";
import type { GraspFileInfo } from "./files";
import { expert, probe } from "./probes";
import type { Evaluation } from "./types";

/** The evaluation whose episodes a per-episode file holds: a checkpoint, a probe, or the expert. */
export function evaluationOfGraspFile(file: GraspFileInfo): Evaluation | undefined {
  if (file.run === "expert") return expert(file.variant);
  if (file.variant !== "plain") return probe(file.run, file.variant);
  if (file.checkpoint === undefined || file.weights === undefined) return undefined;
  return evaluationOf(file.run, file.checkpoint, file.weights);
}
