/**
 * Numbers that are only in the lab notebook: results from machine A, the
 * settings of the tasks, and tables the experiment export does not carry.
 * They are copied by hand into notebook.json, each entry with the notebook
 * section it comes from (`section`) and the passages it was copied from
 * (`quotes`). `npm run sync` checks every quote against the notebook, and
 * every number against the quotes of its entry.
 *
 * Numbers the export does carry are not here: see runs.ts, checkpoints.ts,
 * probes.ts and tolerance.ts.
 *
 * Percentages in this file are whole numbers as the notebook writes them
 * (74, not 0.74); the generated data holds shares between 0 and 1.
 */

import data from "./notebook.json";
import type { Count, Machine, ObjectId, Task } from "./types";

/** Everything in the file, as written. The exports below are its parts, typed. */
export const notebookOnly = data;

/** A low and a high value, which JSON holds as a list. */
const pair = (values: number[]): [number, number] => [values[0], values[1]];

// ---------------------------------------------------------------- tasks and data

/** The tasks and what a policy sees: control rate, cameras, action size, the success test. */
export const setup = data.setup;

/** One row of the notebook's "Datasets" table. */
export interface Dataset {
  name: string;
  /** Demonstrations. */
  episodes: number;
  /** Training windows; every frame of a demonstration starts one. */
  windows: number;
  /** What is in it, in the notebook's words. */
  what: string;
}

export const datasets: Dataset[] = data.datasets.rows;

export function dataset(name: string): Dataset | undefined {
  return datasets.find((row) => row.name === name);
}

/** Training budgets in passes over the data: `samples` on `dataset` are `epochs` epochs. */
export const datasetEpochs: { dataset: string; samples: string; epochs: number }[] = data.datasets.epochs;

// ---------------------------------------------------------------- the scripted expert

/**
 * The expert where the export has no evaluation of it: on machine A, and on
 * the single cube. Its evaluation on machine B is `expert()` in probes.ts.
 */
export const expertElsewhere: {
  section: string;
  machineA: Count & { task: Task };
  pickCube: Count & { task: Task };
} = {
  section: data.expert.section,
  machineA: { ...data.expert.machineA, task: "pick_target" },
  pickCube: { ...data.expert.pickCube, task: "pick_cube" },
};

/**
 * The scripted expert when the object is moved, 40 layouts each: with its one
 * plan per episode, and planning again. Also how far the object is moved and
 * when the expert closes the gripper.
 */
export const disturbanceNotes = data.disturbances;

// ---------------------------------------------------------------- grasp tolerance on machine A

/** One row of a grasp-tolerance table: success in percent at one sideways offset of the grasp point. */
export type TolerancePercents = { offsetMm: number } & Record<ObjectId | "all", number>;

/** The table measured on machine A. The one measured on machine B is generated: see tolerance.ts. */
export const toleranceMachineA: {
  section: string;
  task: Task;
  simulator: string;
  episodesPerOffset: number;
  rows: TolerancePercents[];
} = { ...data.toleranceMachineA, task: "pick_target" };

/** The simulator build of machine B, as the notebook names it. */
export const simulatorMachineB: string = data.toleranceMachineB.simulator;

// ---------------------------------------------------------------- first-round results (machine A)

/** One row of a first-round table: a policy after some training, with its final loss and success. */
export interface FirstRoundRow extends Count {
  demos: number;
  /** Training samples as the notebook writes them: "300k", "1.5M". */
  samples: string;
  epochs: number;
}

export interface PickCubeRow extends FirstRoundRow {
  /** Key into `pickCube.policies`. */
  policy: "clip_pooled" | "dp_vit";
  finalLoss: number;
  /** Success in percent. */
  percent: number;
  /** The 95% interval, in percent. */
  interval: [number, number];
}

/**
 * `pick_cube` on machine A: one pooled vector per image against every patch
 * as a token, the sampler settings tried on the best checkpoint, and the
 * pooled policy on its own training layouts.
 */
export const pickCube = {
  section: data.pickCube.section,
  machine: "A" as Machine,
  policies: data.pickCube.policies,
  rows: data.pickCube.rows.map(
    (row): PickCubeRow => ({ ...row, policy: row.policy as PickCubeRow["policy"], interval: pair(row.interval) }),
  ),
  inference: data.pickCube.inference,
  ownTrainingLayouts: data.pickCube.ownTrainingLayouts,
};

export interface PickTargetRow extends FirstRoundRow {
  id: string;
  /** The notebook's name for the policy: "dp_vit", "vla_qwen", "vla_custom". */
  policy: string;
  label: string;
  /** The final loss as the notebook writes it: "0.069", "0.03-0.04", "~0.03". */
  lossText: string;
  /** The loss as a number, when the notebook gives exactly one. */
  loss?: number;
  /** Its two ends, when the notebook gives a range. */
  lossRange?: [number, number];
  /** The value, when the notebook gives it as approximate. */
  lossAbout?: number;
  /** Parameters in millions, when the row states them. */
  parametersM?: number;
}

/** Where the gripper was when it first closed, in percent of the episodes and in mm. */
export interface FirstRoundGrasp {
  id: string;
  label: string;
  /** Closed the gripper at all. */
  closed: number;
  /** The nearest object was the named one. */
  named: number;
  missNamedMm: number;
  missNearestMm: number;
}

/** `pick_target`, first round, on machine A: every policy near zero, and where their grippers closed. */
export const firstRound = {
  section: data.firstRound.section,
  machine: "A" as Machine,
  rows: data.firstRound.rows.map(
    (row): PickTargetRow => ({ ...row, lossRange: row.lossRange ? pair(row.lossRange) : undefined }),
  ),
  qwenWrongObject: data.firstRound.qwenWrongObject,
  grasp: {
    ...data.firstRound.grasp,
    rows: data.firstRound.grasp.rows satisfies FirstRoundGrasp[],
  },
};

// ---------------------------------------------------------------- the from-scratch stages

/** The three stages (language model, VLM, VLA) as the notebook's table has them, on machine A, and on machine B. */
export const stageResults = data.stages;

// ---------------------------------------------------------------- second round, notebook only

/** The position table computed in half precision: 641 distinct positions out of 2048. */
export const positionTable = data.positionTable;

/** One object's row of "The failures that remain": pooled success, miss, yaw error and height. */
export interface RemainingFailure extends Count {
  object: ObjectId;
  percent: number;
  missSuccessMm: number;
  missFailureMm: number;
  /** Null for the can and the hex nut, which can be grasped at any yaw. */
  yawSuccessDeg: number | null;
  yawFailureDeg: number | null;
  /** Median height above the grasp point at closing, in the failures. */
  heightFailureMm: number;
}

/** What still fails in the policy that works, by object. */
export const remainingFailures = {
  ...data.remainingFailures,
  rows: data.remainingFailures.rows.map((row): RemainingFailure => ({ ...row, object: row.object as ObjectId })),
};

/** The first action chunk from the first frame, open loop: does it head for the named object? */
export const openLoop = data.openLoop;

/** The latency of the default sampler setting, which the export does not carry, and how latencies were measured. */
export const inferenceNotes = data.inference;

/** Training throughput on the two machines, as written. */
export const throughput = data.throughput;

// ---------------------------------------------------------------- toward flower trimming

/** Successes out of episodes, which JSON holds as [successes, episodes]. */
const countOf = (value: number[]): Count => ({ successes: value[0], episodes: value[1] });
const countsOf = (values: number[][]): Count[] => values.map(countOf);

/** A run still training: what the notebook reports so far, after some of its checkpoints. */
export interface FlowerPartial {
  counts: Count[];
  checkpoint: number;
  checkpoints: number;
  samplesAboutM?: number;
  note?: string;
}

/**
 * One row of a step's table. `counts` holds one count, or the trained and the
 * averaged weights' counts; in step 1 it holds one count per speed. A row with
 * `partial` or `inProgress` is a run still training.
 */
export interface FlowerRow {
  id: string;
  /** The row's words, as the notebook writes them without the run's name. */
  words: string;
  /** The run's name as the notebook writes it ("..._seed43" where it shortens it). */
  run?: string;
  detail?: string;
  expert?: boolean;
  counts: Count[];
  /** First closes nearest the named object, in percent; null where the notebook leaves the cell empty. */
  named?: number | null;
  /** The same policy on the task it was trained on. */
  ownTask?: Count[];
  partial?: FlowerPartial;
  inProgress?: boolean;
}

/** A condition of the battery the notebook lists in a sentence: one count, or trained / averaged. */
export interface FlowerCondition {
  words: string;
  counts: Count[];
  retried?: number;
}

const rowsOf = (
  rows: { id: string; words: string; run?: string; detail?: string; expert?: boolean; counts: number[][]; named?: number | null; ownTask?: number[][]; partial?: { counts: number[][]; checkpoint: number; checkpoints: number; samplesAboutM?: number; note?: string } }[],
): FlowerRow[] =>
  rows.map((row) => ({
    ...row,
    counts: countsOf(row.counts),
    ownTask: row.ownTask ? countsOf(row.ownTask) : undefined,
    partial: row.partial ? { ...row.partial, counts: countsOf(row.partial.counts) } : undefined,
  }));

const conditionsOf = (rows: { words: string; counts: number[][]; retried?: number }[]): FlowerCondition[] =>
  rows.map((row) => ({ ...row, counts: countsOf(row.counts) }));

/**
 * One row of a cut table: the named stem cut, another stem cut, and, where the
 * notebook gives it, the share of first closes nearest the named stem (one
 * value, or trained / averaged). An empty list is a cell the notebook leaves empty.
 */
export interface FlowerCutRow {
  id: string;
  words: string;
  run?: string;
  /** The task it was evaluated on, where the table names one (`cut_one`, `cut_stem`). */
  task?: string;
  expert?: boolean;
  named: Count[];
  other: Count[];
  firstCloseNamed: number[];
  /** The notebook sets the cell in bold. */
  best?: boolean;
  inProgress?: boolean;
}

const cutRowsOf = (
  rows: { id: string; words: string; run?: string; task?: string; expert?: boolean; named: number[][]; other: number[][]; firstCloseNamed?: number[]; best?: boolean; inProgress?: boolean }[],
): FlowerCutRow[] =>
  rows.map((row) => ({
    ...row,
    named: countsOf(row.named),
    other: countsOf(row.other),
    firstCloseNamed: row.firstCloseNamed ?? [],
  }));

const { drift, lookalike, clutter, stem, cut } = data.flower;

/**
 * The five steps toward flower trimming (machine B). None of these runs is in
 * the experiment export: every value is copied from the notebook. Each step
 * keeps the notebook heading it comes from (`section`).
 */
export const flowerTrimming = {
  section: data.flower.section,
  recipe: data.flower.recipe,
  inProgress: data.flower.inProgress.runs,
  drift: {
    section: drift.section,
    run: drift.run,
    dataset: drift.dataset,
    demonstrations: drift.demonstrations,
    speedsCmS: drift.speedsCmS,
    rows: rowsOf(drift.rows),
    conditions: conditionsOf(drift.conditions.rows),
    checkpoints: drift.checkpoints.values,
  },
  lookalike: {
    section: lookalike.section,
    expert: countsOf(lookalike.expert.counts),
    rows: rowsOf(lookalike.rows),
    checkpoints: {
      spacingAboutM: lookalike.checkpoints.spacingAboutM,
      rows: lookalike.checkpoints.rows.map((row) => ({
        words: row.words,
        values: row.values.map(([success, wrong]) => ({ success, wrong })),
      })),
    },
    switch: {
      ...lookalike.switch,
      longer: { ...lookalike.switch.longer, counts: countsOf(lookalike.switch.longer.counts) },
    },
    carryOver: {
      noLeaves: { lookalike: countOf(lookalike.carryOver.noLeaves.lookalike), withLeaves: countOf(lookalike.carryOver.noLeaves.withLeaves) },
      seed43: {
        ownTask: countOf(lookalike.carryOver.seed43.ownTask),
        clutter: countOf(lookalike.carryOver.seed43.clutter),
        wrongPercent: lookalike.carryOver.seed43.wrongPercent,
      },
    },
  },
  clutter: {
    section: clutter.section,
    expert: countsOf(clutter.expert.counts),
    rows: rowsOf(clutter.rows),
    checkpoints: clutter.checkpoints.values,
    conditions: conditionsOf(clutter.conditions.rows),
  },
  stem: {
    section: stem.section,
    success: stem.success,
    expert: { counts: countsOf(stem.expert.counts), stalls: stem.expert.stalls, closesAndFails: stem.expert.closesAndFails },
    rows: rowsOf(stem.rows),
    checkpoints: { values: stem.checkpoints.values, neverPasses: countOf(stem.checkpoints.neverPasses) },
    failures: stem.failures,
    caught: {
      caught: countOf(stem.caught.caught),
      held: countOf(stem.caught.held),
      holdSteps: stem.caught.holdSteps,
      fewerActions: {
        executed: stem.caught.fewerActions.executed,
        insteadOf: stem.caught.fewerActions.insteadOf,
        counts: countsOf(stem.caught.fewerActions.counts),
        caught: countOf(stem.caught.fewerActions.caught),
      },
    },
    expertDrives: {
      graspSteps: stem.expertDrives.graspSteps,
      cutSteps: stem.expertDrives.cutSteps,
      rows: stem.expertDrives.rows.map((row) => ({
        id: row.id,
        words: row.words,
        detail: row.detail,
        grasp: countOf(row.grasp),
        caught: countOf(row.caught),
        firstCloseNamed: row.firstCloseNamed,
        cut: row.cut ? countOf(row.cut) : null,
        otherCut: row.otherCut,
      })),
    },
    diagnosis: stem.diagnosis,
    moreRuns: {
      seed43NeverAbove: stem.moreRuns.seed43NeverAbove,
      tenM: {
        checkpoints: stem.moreRuns.tenM.checkpoints,
        caughtAboutPercent: stem.moreRuns.tenM.caughtAboutPercent,
        otherHeldPercent: pair(stem.moreRuns.tenM.otherHeldPercent),
        firstCloseNamed: pair(stem.moreRuns.tenM.firstCloseNamed),
      },
    },
    expertSide: {
      command: stem.expertSide.command,
      clearanceCm: stem.expertSide.clearanceCm,
      cut: countOf(stem.expertSide.cut),
      withClearance: countOf(stem.expertSide.withClearance),
      firstVersion: countOf(stem.expertSide.firstVersion),
      firstVersionFailedRight: countOf(stem.expertSide.firstVersionFailedRight),
    },
  },
  cut: {
    section: cut.section,
    holdSteps: cut.holdSteps,
    rows: cutRowsOf(cut.rows),
    overCheckpoints: cut.overCheckpoints,
    diagnosis: {
      ...cut.diagnosis,
      closesPercent: pair(cut.diagnosis.closesPercent),
      firstCloseNamed: pair(cut.diagnosis.firstCloseNamed),
      caughtPercent: pair(cut.diagnosis.caughtPercent),
      shutFrames: pair(cut.diagnosis.shutFrames),
      stemShutFrames: pair(cut.diagnosis.stemShutFrames),
    },
    tail: {
      command: cut.tail.command,
      shutFrames: pair(cut.tail.shutFrames),
      cutOneExpert: countOf(cut.tail.cutOneExpert),
    },
    tailRows: cutRowsOf(cut.tailRows.rows),
    tailCheckpoints: cut.tailCheckpoints.rows.map((row) => ({
      words: row.words,
      values: row.values.map(([cutCount, other]) => ({ cut: cutCount, other: other ?? null })),
    })),
    conclusion: {
      cutOne: countOf(cut.conclusion.cutOne),
      firstCheckpoint: cut.conclusion.firstCheckpoint,
      firstCheckpointSamplesAboutM: cut.conclusion.firstCheckpointSamplesAboutM,
      caught: cut.conclusion.caught,
      cut: cut.conclusion.cut,
      firstCloseNamed: pair(cut.conclusion.firstCloseNamed),
      otherCutPercent: pair(cut.conclusion.otherCutPercent),
    },
    film: { name: cut.film.name, recorded: cut.film.recorded, cut: cut.film.cut, shown: cut.film.shown },
  },
};

/** The flower steps in the notebook's order, for the headings and their anchors. */
export const flowerSteps = [drift.section, lookalike.section, clutter.section, stem.section, cut.section];
