/**
 * The data behind the copycat figure, and the one calculation it makes.
 *
 * Two sources, both from the data module:
 *   - a rollout of the scripted expert (files.ts, fetched in the browser): its
 *     executed actions, seven joint targets and a gripper command per control
 *     step. The figure predicts each action by repeating the one before and
 *     measures the miss.
 *   - the probes of a policy with history (probes.ts) that change what its
 *     previous-action slot holds at the start of an episode: the hold command
 *     (as served), the expert's first command, or an expert prefix.
 *
 * Nothing here holds a measured number. Which runs, probes and rollouts there
 * are is read from the data each time, so a run that finishes or a probe that
 * is added later appears without a change here.
 */

import { finalCheckpointRow } from "@/data/checkpoints";
import type { Trace, TraceInfo } from "@/data/files";
import { traceCondition, traces } from "@/data/files";
import { conditionLabel } from "@/data/labels";
import { probedRuns, probes, type Probe } from "@/data/probes";
import { evaluationDefaults, run, runs, type Run } from "@/data/runs";
import type { Evaluation, Settings, Weights } from "@/data/types";

// ---------------------------------------------------------------- the probes

/**
 * True for an evaluation that differs from the default conditions at most in
 * what the previous-action slot holds at the start: the first previous action,
 * or a prefix of control steps driven by the expert toward the named object.
 */
export function changesOnlyTheStart(settings: Settings): boolean {
  return (
    !settings.staleImages &&
    !settings.randomStart &&
    settings.disturb === "none" &&
    settings.prefixTarget !== "distractor" &&
    settings.noise === "fresh" &&
    (settings.flowSteps === null || settings.flowSteps === evaluationDefaults.flowSteps) &&
    (settings.execHorizon === null || settings.execHorizon === evaluationDefaults.execHorizon) &&
    (settings.seedStart === null || settings.seedStart === evaluationDefaults.seedStart)
  );
}

/** One row of the probe chart. */
export interface SlotProbe {
  probe: Probe;
  /** The condition in a few words, sentence case: "As served". */
  label: string;
  /** The condition in full, for the table and the text alternative. */
  description: string;
  /** What the slot holds at the first query of the policy. */
  firstPrev: Settings["firstPrevAction"];
  /** Control steps the expert drives before the policy's first query. */
  prefix: number;
}

const capital = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

/** The probes of one run that change only the start, the default conditions first, then by how much they hand over. */
export function slotProbes(runName: string): SlotProbe[] {
  return probes(runName)
    .filter((row) => (row.kind === "baseline" || row.kind === "intervention") && changesOnlyTheStart(row.settings))
    .map((row) => ({
      probe: row,
      label: capital(conditionLabel(row.settings, { short: true, baseline: "as served" })),
      description: capital(
        conditionLabel(row.settings, {
          baseline: "as served: the previous action sent with the first query is the hold command",
        }),
      ),
      firstPrev: row.settings.firstPrevAction,
      prefix: row.settings.expertPrefix,
    }))
    .sort(
      (a, b) =>
        Number(a.probe.kind !== "baseline") - Number(b.probe.kind !== "baseline") ||
        a.prefix - b.prefix ||
        Number(a.firstPrev === "expert") - Number(b.firstPrev === "expert"),
    );
}

/**
 * The runs of a policy with history whose start was probed: at least one
 * reported probe changes what the slot holds, beside the default conditions.
 */
export function probedHistoryRuns(): Run[] {
  return probedRuns()
    .map((name) => run(name))
    .filter((entry): entry is Run => entry !== undefined && entry.design.history === true)
    .filter((entry) => slotProbes(entry.name).some((row) => row.probe.kind !== "baseline"));
}

/** A run beside the probed one, finished or not, with its result under the default conditions when it has one. */
export interface RelatedRun {
  run: Run;
  /** The last reported checkpoint, averaged weights where they were saved: the policy as served. Null while in progress or unreported. */
  result: { evaluation: Evaluation; weights: Weights; samples: number } | null;
}

/**
 * The other runs of the same policy with history on the same number of
 * demonstrations (the position fix, demonstrations that begin with a hold
 * frame, another seed), finished or in progress, except those whose start was
 * probed: those are a choice of their own in the figure. A finished one shows
 * its last reported checkpoint; one in progress is shown by name, without a
 * value.
 */
export function relatedRuns(probed: Run): RelatedRun[] {
  const selectable = new Set(probedHistoryRuns().map((entry) => entry.name));
  return runs()
    .filter(
      (entry) =>
        entry.name !== probed.name &&
        !selectable.has(entry.name) &&
        entry.design.history === true &&
        entry.design.family === probed.design.family &&
        entry.design.policy === probed.design.policy &&
        entry.design.demos === probed.design.demos,
    )
    .map((entry) => {
      const row = entry.status === "finished" ? finalCheckpointRow(entry.name) : undefined;
      const result = row
        ? row.ema
          ? { evaluation: row.ema, weights: "ema" as const, samples: row.samples }
          : { evaluation: row.raw, weights: "raw" as const, samples: row.samples }
        : null;
      return { run: entry, result };
    });
}

// ---------------------------------------------------------------- the rollouts

/**
 * The expert's rollouts under the default conditions: one plan per episode,
 * the usual start pose, nothing moved. Without "plain" rollouts, any others
 * recorded under those same conditions; never a random start or a replan,
 * whose first command does not start from the same hold command.
 */
export function expertRollouts(): TraceInfo[] {
  const plain = traces({ run: "expert", condition: "plain" });
  if (plain.length > 0) return plain;
  return traces({ run: "expert" }).filter((entry) => {
    const settings = traceCondition("expert", entry.condition)?.settings;
    return (
      entry.moved === null &&
      entry.success &&
      entry.plansAgain !== true &&
      settings !== null &&
      settings !== undefined &&
      !settings.randomStart &&
      changesOnlyTheStart(settings) &&
      settings.expertPrefix === 0 &&
      settings.firstPrevAction === "hold"
    );
  });
}

/** The seven joint targets of an action, without the gripper command. */
export const JOINTS = 7;

export interface StepRow {
  step: number;
  /** The action the expert executed at this step: seven joint targets and the gripper command. */
  action: number[];
  /** The prediction "the next action is the previous one". */
  previous: number[];
  /** Length of the difference of the seven joint targets, in rad. */
  miss: number;
  /** Executed by the expert before the policy's first query (an expert prefix): the policy is not asked here. */
  expertDrives: boolean;
}

export interface RolloutModel {
  rows: StepRow[];
  /** The step of the policy's first query: 0, or the length of the expert prefix. */
  firstQuery: number;
  /** Every step at which the gripper command changes, and whether it closes there. */
  gripChanges: { step: number; closes: boolean }[];
  /** The largest miss over every version of step 0, so that the scale does not change with the slot. */
  missMax: number;
  /** The hold command: the arm's start pose as targets, gripper open. */
  hold: number[];
}

const jointMiss = (a: number[], b: number[]) =>
  Math.sqrt(a.slice(0, JOINTS).reduce((sum, value, index) => sum + (value - b[index]) ** 2, 0));

/**
 * The hold command of a rollout: the arm's start joint angles as targets and
 * the gripper open. The rollout does not record the command itself; its
 * joint angles at step 0, where the arm holds that command, stand in for it,
 * and the gripper is open as in the expert's first command.
 */
export function holdCommand(trace: Trace): number[] {
  return [...trace.q[0].slice(0, JOINTS), trace.action[0][JOINTS]];
}

/**
 * Step by step: the expert's action, the previous action repeated, and the
 * miss. What the previous action is at step 0 depends on the slot: the hold
 * command as served, or a copy of the expert's first command (the probe that
 * sends it). Which of the two the policy saw in training depends on its
 * demonstrations: see trainingSlot in notes.ts.
 */
export function rolloutModel(
  trace: Trace,
  slot: { firstPrev: Settings["firstPrevAction"]; prefix: number },
): RolloutModel {
  const hold = holdCommand(trace);
  const actions = trace.action;
  const firstQuery = Math.min(slot.prefix, actions.length - 1);
  const first = slot.firstPrev === "expert" ? actions[0] : hold;
  const rows = actions.map((action, step) => {
    const previous = step === 0 ? first : actions[step - 1];
    return {
      step,
      action,
      previous,
      miss: jointMiss(action, previous),
      expertDrives: step < firstQuery,
    };
  });
  const gripChanges = actions.flatMap((action, step) =>
    step > 0 && action[JOINTS] !== actions[step - 1][JOINTS]
      ? [{ step, closes: action[JOINTS] < actions[step - 1][JOINTS] }]
      : [],
  );
  const missMax = Math.max(jointMiss(actions[0], hold), ...rows.map((row) => row.miss));
  return {
    rows,
    firstQuery,
    gripChanges,
    missMax,
    hold,
  };
}

/** The joint the expert's first command moves furthest from the hold command: the default selection. */
export function jointMovedFirst(trace: Trace): number {
  const hold = holdCommand(trace);
  let best = 0;
  for (let joint = 1; joint < JOINTS; joint += 1) {
    if (Math.abs(trace.action[0][joint] - hold[joint]) > Math.abs(trace.action[0][best] - hold[best])) best = joint;
  }
  return best;
}

/** Facts for the text alternative: the miss at the first query against the rest of the rollout. */
export function missSummary(model: RolloutModel) {
  const asked = model.rows.filter((row) => !row.expertDrives);
  const first = asked[0];
  const later = asked.slice(1).map((row) => row.miss);
  const sorted = [...later].sort((a, b) => a - b);
  const middle = sorted.length / 2;
  const median =
    sorted.length === 0
      ? 0
      : sorted.length % 2 === 1
        ? sorted[Math.floor(middle)]
        : (sorted[middle - 1] + sorted[middle]) / 2;
  const laterMax = later.length > 0 ? Math.max(...later) : 0;
  return {
    first,
    median,
    laterMax,
    firstIsLargest: first !== undefined && first.miss > laterMax,
  };
}
