/**
 * The measured half of the figure: closed-loop success of a real policy for
 * each number of flow steps, read from the data module. Nothing here is a
 * number of its own. Which runs have a sweep, how many rows each has and what
 * they read are all decided by the data, so a run that finishes later, or a
 * step count added to the sweep, shows up without a change here.
 */

import { formatSamples } from "@/data/format";
import { MACHINES, POSITION_FIX, runLabel, WEIGHTS } from "@/data/labels";
import { inferenceNotes } from "@/data/notebook";
import { baseline, batteryRuns, flowStepSweep, probedRuns, type FlowStepRow } from "@/data/probes";
import { evaluationDefaults, isFinished, run } from "@/data/runs";
import { TOY_STEPS } from "./model";

export interface Sweep {
  /** The run's name in the export. */
  name: string;
  /**
   * The run in words, always saying whether it was trained before or after the
   * position fix: "Before the fix, plain demonstrations", "After the fix, recoveries".
   */
  label: string;
  /** "5.0M samples, averaged weights", when the data names the probed checkpoint. */
  checkpoint: string | null;
  /** "machine B (L40S GPUs)", when the run is finished and its machine known. */
  machine: string | null;
  rows: FlowStepRow[];
}

const sentenceCase = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
const FIX_WORDS = Object.values(POSITION_FIX).map((fix) => fix.short.toLowerCase());

/**
 * One naming scheme for every sweep: the notebook's words for the run where its
 * tables after the fix name it (they say "before the fix, plain demonstrations"
 * and "one instruction per layout"), else its own words or its recipe, and
 * always before or after the position fix.
 */
function sweepLabel(name: string): string {
  const entry = run(name);
  if (!entry) return name;
  const words = batteryRuns().find((row) => row.run === name)?.words ?? entry.words ?? runLabel(entry, { recipe: true });
  const saysFix = FIX_WORDS.some((fix) => words.toLowerCase().startsWith(fix));
  return sentenceCase(saysFix ? words : `${POSITION_FIX[entry.group.fix].short}, ${words}`);
}

/** Every run whose flow steps were swept (at least two step counts with a result), in the notebook's order. */
export const SWEEPS: Sweep[] = probedRuns()
  .map((name): Sweep | null => {
    const rows = flowStepSweep(name);
    if (rows.length < 2) return null;
    const entry = run(name);
    const probed = baseline(name);
    return {
      name,
      label: sweepLabel(name),
      checkpoint: probed ? `${formatSamples(probed.samples)} samples, ${WEIGHTS[probed.weights].label}` : null,
      machine: isFinished(entry) && entry.machine ? MACHINES[entry.machine].label : null,
      rows,
    };
  })
  .filter((sweep): sweep is Sweep => sweep !== null)
  .sort(
    (a, b) =>
      (run(a.name)?.group.order ?? Number.POSITIVE_INFINITY) - (run(b.name)?.group.order ?? Number.POSITIVE_INFINITY) ||
      a.name.localeCompare(b.name),
  );

/**
 * The sweep shown first: the run of the notebook's "Inference settings" section,
 * whose sweep the chapter discusses, or else the sweep with the most rows.
 */
export const DEFAULT_SWEEP: string =
  SWEEPS.find((sweep) => sweep.name === inferenceNotes.run)?.name ??
  [...SWEEPS].sort((a, b) => b.rows.length - a.rows.length)[0]?.name ??
  "";

/** The flow-step count every other evaluation uses. */
export const DEFAULT_STEPS = evaluationDefaults.flowSteps;

/** Actions executed per chunk in the sweep (the evaluations' default). */
export const EXECUTED = evaluationDefaults.execHorizon;

/**
 * The step counts the reader can choose: the toy's, and every count any sweep
 * measured, in order.
 */
export const STEP_OPTIONS: number[] = [
  ...new Set<number>([...TOY_STEPS, ...SWEEPS.flatMap((sweep) => sweep.rows.map((row) => row.flowSteps))]),
].sort((a, b) => a - b);

/** The sweep's row for a step count, if it was measured. */
export function rowAt(sweep: Sweep | undefined, steps: number): FlowStepRow | undefined {
  return sweep?.rows.find((row) => row.flowSteps === steps);
}

/** Layouts per evaluation, when every count in the sweep has the same number; else null. */
export function layoutsPerCell(sweep: Sweep): number | null {
  const sizes = new Set(sweep.rows.flatMap((row) => [row.first.episodes, ...(row.second ? [row.second.episodes] : [])]));
  return sizes.size === 1 ? [...sizes][0] : null;
}

/**
 * How latencies were measured, where the notebook says so: only for the run of
 * its "Inference settings" section. Null for every other sweep.
 */
export function latencyNote(sweep: Sweep | undefined): string | null {
  return sweep && sweep.name === inferenceNotes.run ? inferenceNotes.latencyNote.text : null;
}
