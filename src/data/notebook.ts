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
