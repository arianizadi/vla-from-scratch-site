/**
 * The training runs of the experiment export, and what is known about the
 * export itself.
 *
 *   runs()                               every run, finished or in progress
 *   run("dp_vit_lang_reactive_pt4k")     one run by name
 *   finishedRuns(), unfinishedRuns()     the two groups
 *   runsByGroup({ fix: "after", family: "demonstrations" })   runs for a selector, in the notebook's order
 *   awaitedRuns()                        runs the notebook lists as in progress that the export does not have yet
 *
 * A run in progress has a name, a label and its settings, and nothing that
 * was measured: the type has no field to read a value from. Which runs are in
 * progress is decided in scripts/sync-data.mjs (the IN_PROGRESS list, and the
 * tables the notebook marks "still training").
 *
 * The evaluations of a finished run are in checkpoints.ts and probes.ts, its
 * loss curve in curves.ts.
 */

import meta from "./generated/meta.json";
import records from "./generated/runs.json";
import { runLabel } from "./labels";
import type { Count, Machine, PositionFix, RunDesign, RunFamily, RunGroup, Task, Weights } from "./types";

interface RunBase {
  /** The run's name in the experiment export. */
  name: string;
  /** The run in words: "4000 demonstrations, no history". */
  label: string;
  /** What the name says: policy, inputs, dataset. */
  design: RunDesign;
  /** The task it is evaluated on; null for the language-model and VLM stages. */
  task: Task | null;
  /** The training budget in samples: a setting, not a measurement. */
  samplesPlanned: number;
  /**
   * The notebook's words for the run, for the runs it names in words rather
   * than by their recipe ("recoveries", "random starts"); null for the others.
   * `label` is these words when there are some.
   */
  words: string | null;
  /** Before or after the position fix, and the family: what selectors group by. */
  group: RunGroup;
}

/** The best evaluation of a run, when the notebook names it. */
export interface BestCheckpoint extends Count {
  checkpoint: number;
  weights: Weights;
  /** Training samples seen when that checkpoint was saved. */
  samples: number;
  rate: number;
}

export interface FinishedRun extends RunBase {
  status: "finished";
  /** Training samples behind its last checkpoint. */
  samples: number;
  /** The run was stopped before its budget and is reported as it stood. */
  stopped: boolean;
  /** The last training loss that was logged; null for a stopped run. */
  finalLoss: number | null;
  /** The machine it ran on, as the notebook's section says. */
  machine: Machine | null;
  /** The notebook sections that report it, in the notebook's order. */
  sections: string[];
  best: BestCheckpoint | null;
}

export interface RunInProgress extends RunBase {
  status: "in_progress";
  /**
   * Why it counts as in progress: the notebook lists it as in progress or marks
   * its table "still training" ("notebook"), or the export says it has not
   * finished. ("position_fix" is no longer given: a run trained after the fix
   * is finished when the notebook reports it.)
   */
  reason: "position_fix" | "notebook" | "not_finished";
}

export type Run = FinishedRun | RunInProgress;

/** A run as runs.json stores it: everything but the label, which is put into words here. */
type Stored = Omit<FinishedRun, "label"> | Omit<RunInProgress, "label">;

const all: Run[] = (records as unknown as Stored[]).map((stored) => ({ ...stored, label: runLabel(stored) }) as Run);
const awaitedData: AwaitedRun[] = (
  ((meta as { awaited?: unknown }).awaited ?? []) as { name: string; words: string | null; design: RunDesign; group: RunGroup }[]
).map((entry) => ({ ...entry, label: runLabel({ ...entry, samplesPlanned: 0 }) }));
const byName = new Map(all.map((entry) => [entry.name, entry]));

/** Every run of the export, by name. The runs the sync script leaves out (LEFT_OUT) are not in the data. */
export function runs(): Run[] {
  return all;
}

export function run(name: string): Run | undefined {
  return byName.get(name);
}

export function isFinished(entry: Run | undefined): entry is FinishedRun {
  return entry?.status === "finished";
}

export function finishedRuns(): FinishedRun[] {
  return all.filter(isFinished);
}

/** The runs that have no result yet. Show them as in progress, without a value. */
export function unfinishedRuns(): RunInProgress[] {
  return all.filter((entry): entry is RunInProgress => entry.status === "in_progress");
}

/** What `runsByGroup` selects by; every field is optional. */
export interface GroupQuery {
  fix?: PositionFix;
  family?: RunFamily;
  status?: Run["status"];
}

/**
 * The runs of a group, in the order the notebook first prints them (runs it
 * does not print yet come last, by name). Build a selector from this and from
 * each run's `status`: a run in progress is listed, without a value.
 */
export function runsByGroup(query: GroupQuery = {}): Run[] {
  return all
    .filter(
      (entry) =>
        (query.fix === undefined || entry.group.fix === query.fix) &&
        (query.family === undefined || entry.group.family === query.family) &&
        (query.status === undefined || entry.status === query.status),
    )
    .sort(
      (a, b) =>
        (a.group.order ?? Number.POSITIVE_INFINITY) - (b.group.order ?? Number.POSITIVE_INFINITY) ||
        a.name.localeCompare(b.name),
    );
}

/** A run the notebook lists as in progress and the export does not have yet: a name and a label, nothing else. */
export interface AwaitedRun {
  name: string;
  label: string;
  words: string | null;
  /** What its name says; its budget is not known until the export has it. */
  design: RunDesign;
  group: RunGroup;
}

/**
 * The runs the sync script lists as in progress that are not in the export
 * yet. They are not in `runs()`; a page that lists what is still running
 * shows them beside `unfinishedRuns()`. Empty once the export has them.
 */
export function awaitedRuns(): AwaitedRun[] {
  return awaitedData;
}

/** When the export was written, as an ISO date and time in UTC: the date of the data on the site. */
export const exportedAt: string = meta.exportedAt;

/** The machine the exported runs ran on, as the notebook names it. */
export const exportMachine = meta.machine as Machine | null;

/**
 * The conditions of an evaluation unless it says otherwise: actions executed
 * per chunk, flow steps, the seed of the first layout, the number of layouts,
 * and the control rate in Hz.
 */
export const evaluationDefaults: {
  execHorizon: number;
  flowSteps: number;
  seedStart: number;
  episodes: number;
  controlHz: number;
} = meta.defaults;

/**
 * What the export holds and the notebook does not report, by name only:
 * checkpoints by run, probes by run, and conditions of the expert. None of it
 * has a value on the site. See the README for how a row gets in.
 */
export const unreported: {
  checkpoints: Record<string, number[]>;
  probes: Record<string, string[]>;
  expert: string[];
} = meta.unreported;
