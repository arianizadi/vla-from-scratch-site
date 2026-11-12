/**
 * Probes: evaluations of one checkpoint under other conditions than a plain
 * run on unseen layouts, to find out what the policy's choices depend on.
 * And the scripted expert through the same evaluation loop.
 *
 *   probes("dp_vit_lang_pt4k")                               every reported probe of a run
 *   probes("dp_vit_lang_reactive_pt4k", "intervention")      one kind of them
 *   probe("dp_vit_lang_reactive_pt4k", "disturb_reach20")    one by the export's name
 *   baseline("dp_vit_lang_reactive_pt4k")                    the checkpoint itself, under the default conditions
 *   disturbances("dp_vit_lang_reactive_pt4k")                the rows of the notebook's "Disturbances" table
 *   flowStepSweep(run), execHorizonSweep(run)                the two "Inference settings" tables
 *   expert()                                                 the scripted expert, 100 layouts
 *   battery("dp_vit_lang_reactive_pt4k_recover_posfix")      the final checkpoint under every condition of the
 *                                                            notebook's tables after the fix, in their column order
 *   batteryRuns(), batteryConditions()                       the rows and the columns of those tables
 *   expertBattery()                                          the scripted expert under the same conditions
 *
 * Only the probes the lab notebook reports are here; `unreported` in runs.ts
 * names the others. Each row's `settings` say what was changed, and
 * `conditionLabel(row.settings)` in labels.ts puts it into words.
 */

import comparisons from "./generated/comparisons.json";
import expertData from "./generated/expert.json";
import data from "./generated/probes.json";
import meta from "./generated/meta.json";
import { disturbanceNotes, inferenceNotes, setup } from "./notebook";
import type { ConditionKind, Count, Evaluation, Machine, Moved, Settings, Task, Weights } from "./types";

export interface Probe extends Evaluation {
  /**
   * The export's name for the conditions ("disturb_reach20"). "plain" is the
   * probed checkpoint under the default conditions: the row the others are
   * compared with.
   */
  variant: string;
  kind: ConditionKind;
  /** The checkpoint that was probed: its number, weights, and the training samples behind it. */
  checkpoint: number;
  weights: Weights;
  samples: number;
  task: Task;
  settings: Settings;
  /** Median time the policy took to produce one chunk, in ms; null where the export has none. */
  latencyMs: number | null;
  /** Episodes with a second grasp attempt, of all `episodes`; null in evaluations made before it was recorded. */
  secondAttempts?: number | null;
  /**
   * For a disturbance: how the episodes went in which the object was moved.
   * The notebook reports these counts, not the row's own `successes` and
   * `episodes`, which include the episodes in which no free place was found.
   */
  moved: Moved | null;
  /** After an expert prefix: in how many episodes the gripper closed at the object the expert was heading for. */
  prefixGoal: { count: number; episodes: number } | null;
  /** The notebook sections that report this row. */
  sections: string[];
  /** Ids of the rollouts recorded under the same conditions (see files.ts). */
  traces: string[];
}

export interface ExpertRow extends Evaluation {
  /** "plain": through the evaluation loop, as a policy is. */
  variant: string;
  kind: ConditionKind;
  task: Task;
  /** Whether the expert plans again when the object has moved or the fingers met on nothing. */
  plansAgain: boolean;
  settings: Settings;
  moved: Moved | null;
  /** Episodes with a second grasp attempt, of all `episodes`. */
  secondAttempts?: number | null;
  machine: Machine | null;
  sections: string[];
  traces: string[];
}

const rows = data as unknown as Record<string, Probe[]>;
const expertRowsData = expertData as unknown as ExpertRow[];

/** The reported probes of a run, the plain row first; optionally one kind of them. Empty when the run has none. */
export function probes(run: string, kind?: ConditionKind): Probe[] {
  const all = rows[run] ?? [];
  return kind ? all.filter((row) => row.kind === kind) : all;
}

/** One probe by the export's name for its conditions. */
export function probe(run: string, variant: string): Probe | undefined {
  return (rows[run] ?? []).find((row) => row.variant === variant);
}

/** The names of the runs that have reported probes. */
export function probedRuns(): string[] {
  return Object.keys(rows);
}

/** The probed checkpoint under the default conditions: what every probe of the run is compared with. */
export function baseline(run: string): Probe | undefined {
  return probe(run, "plain");
}

// ---------------------------------------------------------------- disturbances

/** One row of the notebook's "Disturbances" table. */
export interface Disturbance extends Moved {
  variant: string;
  /** Moved while the gripper is on its way, or at the moment it first closes. */
  when: "reach" | "grasp";
  /** The control step of the move during the reach; null at the grasp. */
  step: number | null;
  /** How far the object is moved, in mm. */
  distanceMm: number;
  /** True when the distance is the one the notebook uses unless it says otherwise. */
  usualDistance: boolean;
  settings: Settings;
  /** Id of the public file with the episodes of this probe, when it is published. */
  graspFile?: string;
  /** Ids of the rollouts recorded under the same disturbance. */
  traces: string[];
}

/**
 * The disturbance probes of a run, in the notebook's order: during the reach
 * by step, then the other distances, then at the grasp. The counts are over
 * the episodes in which the object was moved. Episodes that start from the
 * usual pose only: a move combined with a random start is in `battery(run)`.
 */
export function disturbances(run: string): Disturbance[] {
  const usual = disturbanceNotes.move.distanceMm;
  const group = (row: Disturbance) => (row.when === "grasp" ? 2 : row.usualDistance ? 0 : 1);
  return probes(run, "disturbance")
    .filter((row) => !row.settings.randomStart)
    .flatMap((row): Disturbance[] => {
      const { disturb, disturbStep, disturbMm } = row.settings;
      if (!row.moved || disturb === "none" || disturbMm === null) return [];
      return [
        {
          ...row.moved,
          variant: row.variant,
          when: disturb,
          step: disturbStep,
          distanceMm: disturbMm,
          usualDistance: disturbMm === usual,
          settings: row.settings,
          graspFile: row.graspFile,
          traces: row.traces,
        },
      ];
    })
    .sort((a, b) => group(a) - group(b) || (a.step ?? 0) - (b.step ?? 0) || a.distanceMm - b.distanceMm);
}

// ---------------------------------------------------------------- sampler settings

/** Probes that change nothing but the sampler and the set of layouts. */
function samplerRows(run: string): Probe[] {
  return probes(run).filter((row) => row.kind === "baseline" || row.kind === "sampler" || row.kind === "layouts");
}

/** One row of "Flow steps (8 actions executed per chunk)". */
export interface FlowStepRow {
  flowSteps: number;
  /** On the usual 100 layouts. */
  first: Count;
  /** On the second set of 100 layouts, where it was run. */
  second?: Count;
  /** Median time per chunk, in ms. */
  latencyMs: number | null;
}

/** Success against the number of flow steps, the other settings at their defaults. */
export function flowStepSweep(run: string): FlowStepRow[] {
  const byStep = new Map<number, FlowStepRow>();
  for (const row of samplerRows(run)) {
    const { flowSteps, execHorizon, noise, seedStart } = row.settings;
    if (flowSteps === null || execHorizon !== meta.defaults.execHorizon || noise !== "fresh") continue;
    const entry = byStep.get(flowSteps) ?? { flowSteps, first: { successes: 0, episodes: 0 }, latencyMs: null };
    const count = { successes: row.successes, episodes: row.episodes };
    if (seedStart === meta.defaults.seedStart) {
      entry.first = count;
      // The export has no latency for a plain checkpoint evaluation; the notebook has the one of the default setting.
      const noted = inferenceNotes.run === run && flowSteps === inferenceNotes.defaultLatency.flowSteps;
      entry.latencyMs = row.latencyMs ?? (noted ? inferenceNotes.defaultLatency.ms : null);
    } else {
      entry.second = count;
    }
    byStep.set(flowSteps, entry);
  }
  return [...byStep.values()].filter((row) => row.first.episodes > 0).sort((a, b) => a.flowSteps - b.flowSteps);
}

/** One row of "Actions executed per chunk (10 flow steps)". */
export interface ExecHorizonRow {
  /** Actions executed of each chunk before planning again; a chunk has 15. */
  executed: number;
  /** True when the whole chunk is executed. */
  wholeChunk: boolean;
  /** With fresh starting noise for every chunk, as usual. */
  fresh: Count;
  /** The T block's share of `fresh`, the object this setting matters for. */
  tblock?: Count;
  /** With the same starting noise for every chunk of an episode, where it was run. */
  sameNoise?: Count;
}

/** Success against the number of actions executed per chunk, the other settings at their defaults. */
export function execHorizonSweep(run: string): ExecHorizonRow[] {
  const chunk = setup.chunk.actions;
  const byHorizon = new Map<number, ExecHorizonRow>();
  for (const row of samplerRows(run)) {
    const { flowSteps, execHorizon, noise, seedStart } = row.settings;
    if (execHorizon === null || flowSteps !== meta.defaults.flowSteps || seedStart !== meta.defaults.seedStart) continue;
    const executed = Math.min(execHorizon, chunk);
    const entry = byHorizon.get(executed) ?? {
      executed,
      wholeChunk: executed === chunk,
      fresh: { successes: 0, episodes: 0 },
    };
    const count = { successes: row.successes, episodes: row.episodes };
    if (noise === "fresh") {
      entry.fresh = count;
      entry.tblock = row.perObject.tblock;
    } else {
      entry.sameNoise = count;
    }
    byHorizon.set(executed, entry);
  }
  return [...byHorizon.values()].filter((row) => row.fresh.episodes > 0).sort((a, b) => a.executed - b.executed);
}

// ---------------------------------------------------------------- the scripted expert

/** The reported evaluations of the scripted expert. */
export function expertRows(): ExpertRow[] {
  return expertRowsData;
}

/**
 * The scripted expert through the evaluation loop on machine B: the yardstick
 * for every policy. Its results on machine A and on the single cube, and how
 * it copes with a moved object, are only in the notebook: see notebook.ts.
 */
export function expert(variant = "plain"): ExpertRow | undefined {
  return expertRowsData.find((row) => row.variant === variant);
}

// ---------------------------------------------------------------- outside the conditions it was trained in

/** Which of the notebook's two tables a condition is a column of. */
export type BatteryTable = "outside" | "dependsOn";

/** A column of the notebook's tables "How each policy copes outside the conditions it was trained in". */
export interface BatteryCondition {
  /** The export's name for the conditions: a probe's `variant`, "plain" for the standard ones. */
  variant: string;
  /** The column's heading, in the notebook's words: "Moved at step 20", "Cameras frozen on the first frame". */
  words: string;
  /** "outside": success under other conditions; "dependsOn": what the same policies depend on. */
  table: BatteryTable;
}

/** A row of those tables: a run, in the notebook's words, and the checkpoint the row is of. */
export interface BatteryRun {
  run: string;
  /** The row's first cell: "recoveries", "before the fix, plain demonstrations". */
  words: string;
  /** The final checkpoint, with the averaged weights where the run saved them. */
  checkpoint: number | null;
  weights: Weights | null;
}

/**
 * One cell: the run's final checkpoint under one set of conditions. For a
 * moved object the counts are over the episodes in which it could be moved,
 * as the notebook counts them; the probe's own counts are in `probe`.
 */
export interface BatteryCell extends Count {
  variant: string;
  words: string;
  table: BatteryTable;
  kind: ConditionKind;
  settings: Settings;
  /** Episodes with a second grasp attempt, among those counted; null where the export has none. */
  retried: number | null;
  /** Share of all episodes in which the gripper first closed nearest the named object. */
  named: number | null;
  /** Median distance at closing to the named object, in mm. */
  missMm: number | null;
  /** For a move during the reach: median distance at closing from the old and from the new place, in mm. */
  fromOldMm: number | null;
  fromNewMm: number | null;
  /** After an expert prefix toward another object: how often the gripper closed at that object. */
  prefixGoal: { count: number; episodes: number } | null;
  /** The whole evaluation, with its per-episode file and rollouts when they are published. */
  probe: Probe;
}

interface BatteryData {
  section: string | null;
  columns: BatteryCondition[];
  runs: BatteryRun[];
  expert: {
    columns: { variant: string; words: string }[];
    rows: { words: string; plansAgain: boolean; cells: { column: string; variant: string }[] }[];
  };
}

const batteryData = (comparisons as unknown as { battery: BatteryData }).battery;

/** The notebook heading the battery is under. */
export const batterySection: string | null = batteryData.section;

/** The columns of both tables, in the notebook's order: the standard conditions first. */
export function batteryConditions(table?: BatteryTable): BatteryCondition[] {
  return table ? batteryData.columns.filter((column) => column.table === table) : batteryData.columns;
}

/** The runs the battery reports, in the notebook's row order. A run in progress is not among them. */
export function batteryRuns(): BatteryRun[] {
  return batteryData.runs;
}

/** A cell from the probe (or the expert's row) it reads. */
function cellOf(row: Probe | ExpertRow, column: { variant: string; words: string; table?: BatteryTable }): BatteryCell {
  const moved = row.moved;
  const counted = moved ?? row;
  return {
    variant: column.variant,
    words: column.words,
    table: column.table ?? "outside",
    kind: row.kind,
    settings: row.settings,
    successes: counted.successes,
    episodes: counted.episodes,
    retried: moved ? moved.retried : (row.secondAttempts ?? null),
    named: row.named,
    missMm: row.missMm,
    fromOldMm: moved?.fromOldMm ?? null,
    fromNewMm: moved?.fromNewMm ?? null,
    prefixGoal: "prefixGoal" in row ? row.prefixGoal : null,
    probe: row as Probe,
  };
}

/**
 * A run's final checkpoint under every condition the notebook's tables after
 * the fix report for it, in their column order (`table` says which table).
 * Empty for a run the tables do not have. A cell the notebook leaves empty is
 * not here.
 */
export function battery(run: string): BatteryCell[] {
  if (!batteryData.runs.some((entry) => entry.run === run)) return [];
  return batteryData.columns.flatMap((column) => {
    const row = probe(run, column.variant);
    return row && row.sections.includes(batteryData.section ?? "") ? [cellOf(row, column)] : [];
  });
}

/** One cell of the battery, by the export's name for the conditions. */
export function batteryCell(run: string, variant: string): BatteryCell | undefined {
  return battery(run).find((cell) => cell.variant === variant);
}

/** A row of the expert's table: with one plan per episode, or planning again. */
export interface ExpertBatteryRow {
  /** The row's words: "one plan per episode", "plans again". */
  words: string;
  plansAgain: boolean;
  /** One cell per column the notebook fills; `variant` is the policy's name for the conditions, `probe` the expert's row. */
  cells: (Omit<BatteryCell, "probe"> & { expertVariant: string; probe: ExpertRow })[];
}

/** The scripted expert under the same conditions as the battery, as the notebook's table has it. */
export function expertBattery(): ExpertBatteryRow[] {
  return batteryData.expert.rows.map((row) => ({
    words: row.words,
    plansAgain: row.plansAgain,
    cells: row.cells.flatMap((cell) => {
      const found = expert(cell.variant);
      const column = batteryData.expert.columns.find((entry) => entry.variant === cell.column);
      if (!found || !column) return [];
      return [{ ...cellOf(found, column), expertVariant: cell.variant, probe: found }];
    }),
  }));
}
