/**
 * What the replay can show, read from the data module's index of rollouts,
 * and the words and readings the figure prints. Nothing here names a run,
 * a condition or a number: every list is built from `traces()` and the
 * statuses and labels that come with it, so a rollout published later joins
 * the selectors by itself.
 */

import { traceCondition, traces, type Trace, type TraceInfo } from "@/data/files";
import { formatMm, formatPercent, formatSamples, formatSuccess } from "@/data/format";
import { OBJECTS, WEIGHTS, conditionLabel, expertLabel, runLabel } from "@/data/labels";
import { expertRows, probe } from "@/data/probes";
import { run as runNamed } from "@/data/runs";
import type { Count, ObjectId } from "@/data/types";
import { planDistance } from "./kinematics";

const EXPERT = "expert";

const capitalise = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
const isExpert = (info: TraceInfo) => info.run === EXPERT;
const kindOf = (info: TraceInfo) => traceCondition(info.run, info.condition)?.kind ?? null;
const trainedOnRecoveries = (info: TraceInfo) => runNamed(info.run)?.design.traits.includes("recoveries") ?? false;

/** Every published rollout, in the index's order. */
export function allRollouts(): TraceInfo[] {
  return traces();
}

// ---------------------------------------------------------------- the four starting points

export type PresetId = "expert" | "policy" | "moved" | "recovers";

export interface Preset {
  id: PresetId;
  /** Short words for a segment: who acted, and whether the object was moved. */
  label: string;
  trace: TraceInfo;
}

/** The demonstrations a policy was trained on, in a few words: "Plain demos", "Recoveries", "Random starts". */
function trainedOn(info: TraceInfo): string {
  const entry = runNamed(info.run);
  if (!entry || entry.design.traits.length === 0) return "Plain demos";
  return entry.words ? capitalise(entry.words) : runLabel(entry);
}

function presetLabel(info: TraceInfo): string {
  const who = isExpert(info) ? "Expert" : trainedOn(info);
  return info.moved ? `${who}, object moved` : who;
}

/** The share of successes the notebook reports for this rollout's policy and conditions; null when it reports none. */
function reportedRate(info: TraceInfo): number | null {
  const reported = reportedFor(info);
  return reported && reported.count.episodes > 0 ? reported.count.successes / reported.count.episodes : null;
}

/** Compares two scores entry by entry; the larger wins. */
function better(a: number[], b: number[]): boolean {
  for (let index = 0; index < a.length; index += 1) if (a[index] !== b[index]) return a[index] > b[index];
  return false;
}

/**
 * Four rollouts that tell the chapter's story: the scripted expert; a policy
 * trained on clean demonstrations that succeeds; the same policy when the
 * named object is moved, closing where it was; and the policy trained on
 * recoveries under the same move, following it. They are looked for in the
 * index, never named, and chosen by the notebook's own numbers: the move is
 * the condition under which the notebook reports the widest gap between the
 * two policies, and the failing policy is only shown when the notebook reports
 * it succeeding less often than the recoveries policy under that move. Then
 * the same layout for all four, and a single close, are preferred. A rollout
 * that is not there, or that the numbers do not support, is left out.
 */
export function presets(list: TraceInfo[] = allRollouts()): Preset[] {
  const policies = list.filter((info) => !isExpert(info) && !trainedOnRecoveries(info));
  const recoveries = list.filter((info) => !isExpert(info) && trainedOnRecoveries(info));
  const experts = list.filter(isExpert);
  const plain = (info: TraceInfo) => (runNamed(info.run)?.design.traits.length ?? 1) === 0;

  const standardExpert = (episode?: number) =>
    experts.find(
      (info) => !info.plansAgain && kindOf(info) === "baseline" && info.success && (episode === undefined || info.episode === episode),
    );
  const standardSuccess = (runName: string | null, episode?: number) =>
    policies.find(
      (info) =>
        (runName === null || info.run === runName) &&
        kindOf(info) === "baseline" &&
        info.success &&
        (episode === undefined || info.episode === episode),
    );

  let best: { score: number[]; picks: (TraceInfo | undefined)[] } | null = null;
  for (const follows of recoveries) {
    if (!follows.moved || !follows.success) continue;
    const followsRate = reportedRate(follows);
    if (followsRate === null) continue;
    for (const misses of policies) {
      if (!misses.moved || misses.success || conditionKey(misses) !== conditionKey(follows)) continue;
      const missesRate = reportedRate(misses);
      if (missesRate === null || missesRate >= followsRate) continue;
      const sameLayout = misses.episode === follows.episode;
      const succeeds = standardSuccess(misses.run, misses.episode);
      const reference = standardExpert(misses.episode);
      const score = [
        followsRate - missesRate,
        plain(misses) ? 1 : 0,
        sameLayout ? 1 : 0,
        succeeds ? 1 : 0,
        reference ? 1 : 0,
        follows.moved.kind === "reach" ? 1 : 0,
        misses.closes === 1 ? 1 : 0,
        follows.closes === 1 ? 1 : 0,
      ];
      if (!best || better(score, best.score)) {
        best = {
          score,
          picks: [reference ?? standardExpert(), succeeds ?? standardSuccess(misses.run), misses, follows],
        };
      }
    }
  }

  const picks = best?.picks ?? [
    standardExpert() ?? experts[0],
    policies.find((info) => plain(info) && kindOf(info) === "baseline" && info.success) ?? standardSuccess(null),
    // Without the notebook's numbers to show that the move defeats it, no rollout is offered as the failing policy.
    undefined,
    recoveries.find((info) => info.moved !== null && info.success),
  ];
  const ids: PresetId[] = ["expert", "policy", "moved", "recovers"];
  const seen = new Set<string>();
  const result: Preset[] = [];
  ids.forEach((id, index) => {
    const trace = picks[index];
    if (!trace || seen.has(trace.id)) return;
    seen.add(trace.id);
    result.push({ id, label: presetLabel(trace), trace });
  });
  return result;
}

// ---------------------------------------------------------------- every rollout

export interface ConditionOption {
  key: string;
  label: string;
}

const conditionKey = (info: TraceInfo) => info.conditionWords ?? `condition:${info.condition}`;

function conditionWordsOf(info: TraceInfo): string {
  if (info.conditionWords) return info.conditionWords;
  const settings = traceCondition(info.run, info.condition)?.settings;
  return settings ? capitalise(conditionLabel(settings, { short: true, baseline: "standard" })) : info.condition;
}

const KIND_ORDER = ["baseline", "intervention", "sampler", "layouts", "start", "disturbance"];

/** Where a set of conditions goes in the list: the standard ones first, a move during the reach before one at the grasp. */
function conditionRank(info: TraceInfo): number[] {
  const condition = traceCondition(info.run, info.condition);
  const kind = KIND_ORDER.indexOf(condition?.kind ?? "");
  const settings = condition?.settings;
  return [
    kind < 0 ? KIND_ORDER.length : kind,
    settings?.randomStart ? 1 : 0,
    settings?.disturb === "grasp" ? 1 : 0,
    settings?.disturbStep ?? 0,
    settings?.expertPrefix ?? 0,
  ];
}

/** The conditions rollouts were recorded under: the standard ones first, then what is changed, in a fixed order. */
export function conditionOptions(list: TraceInfo[]): ConditionOption[] {
  const options = new Map<string, { option: ConditionOption; rank: number[]; first: number }>();
  list.forEach((info, index) => {
    const key = conditionKey(info);
    if (!options.has(key)) options.set(key, { option: { key, label: conditionWordsOf(info) }, rank: conditionRank(info), first: index });
  });
  const compare = (a: number[], b: number[]) => {
    for (let index = 0; index < a.length; index += 1) if (a[index] !== b[index]) return a[index] - b[index];
    return 0;
  };
  return [...options.values()].sort((a, b) => compare(a.rank, b.rank) || a.first - b.first).map((entry) => entry.option);
}

/** Who acted under one set of conditions. */
export function actorOptions(list: TraceInfo[], condition: string): string[] {
  return [...new Set(list.filter((info) => conditionKey(info) === condition).map((info) => info.actor))];
}

/** The rollouts of one actor under one set of conditions, by layout. */
export function layoutOptions(list: TraceInfo[], condition: string, actor: string): TraceInfo[] {
  return list
    .filter((info) => conditionKey(info) === condition && info.actor === actor)
    .sort((a, b) => a.episode - b.episode || a.id.localeCompare(b.id));
}

export { conditionKey };

/** "Layout 2, the red cube, lifted". */
export function layoutLabel(info: TraceInfo): string {
  return `Layout ${info.episode + 1}: ${OBJECTS[info.target].label}, ${info.success ? "lifted" : "not lifted"}`;
}

// ---------------------------------------------------------------- words for one rollout

/** Who acted, in the notebook's words, with a capital. */
export function actorWords(actor: string): string {
  return capitalise(actor);
}

/** What the policy was, its weights and training; or which expert. */
export function policyDetails(info: TraceInfo | Trace): string {
  if (info.run === EXPERT) return expertLabel(info.plansAgain ?? false);
  const entry = runNamed(info.run);
  const parts: string[] = [];
  if (entry) parts.push(runLabel(entry, { recipe: true }));
  const condition = traceCondition(info.run, info.condition);
  if (condition?.weights) parts.push(WEIGHTS[condition.weights].label);
  if (condition?.samples) parts.push(`${formatSamples(condition.samples)} samples`);
  return parts.join(", ");
}

/** The conditions in full words: "the object is moved at step 20 of the reach". */
export function conditionWords(info: TraceInfo): string {
  const settings = traceCondition(info.run, info.condition)?.settings;
  if (!settings) return conditionWordsOf(info);
  return capitalise(conditionLabel(settings, { baseline: "standard conditions" }));
}

export interface Reported {
  count: Count;
  /** Counted over the episodes in which the object could be moved. */
  moved: boolean;
}

/**
 * The notebook's evaluation of the same actor under the same conditions, of
 * which this rollout is one episode; null when the notebook reports none.
 */
export function reportedFor(info: TraceInfo): Reported | null {
  const reported = traceCondition(info.run, info.condition)?.reported;
  if (!reported) return null;
  const row = isExpert(info) ? expertRows().find((entry) => entry.variant === reported) : probe(info.run, reported);
  if (!row) return null;
  return row.moved ? { count: row.moved, moved: true } : { count: row, moved: false };
}

export function reportedWords(reported: Reported): string {
  return reported.moved
    ? `${formatSuccess(reported.count)} of the episodes in which the object could be moved`
    : `${formatSuccess(reported.count)} of the episodes`;
}

// ---------------------------------------------------------------- the rollout itself

/** The steps at which the gripper was told to close: each change of the command from open to closed. */
export function closeSteps(trace: Trace): number[] {
  const steps: number[] = [];
  let open = true;
  trace.action.forEach((action, step) => {
    const closed = (action[7] ?? 1) < 0.5;
    if (closed && open) steps.push(step);
    open = !closed;
  });
  return steps;
}

export interface Moment {
  step: number;
  label: string;
}

const ORDINAL = ["First", "Second", "Third"];

/**
 * The first step at which the moved object stands at its new place. The
 * rollout records the move at `moved.step`, the step whose action is followed
 * by the move: the poses still have the object at its old place at that step
 * and at the new place from the next one. Read from the poses, so a file that
 * records it otherwise is drawn as it records it.
 */
export function moveShownAt(trace: Trace): number | null {
  const moved = trace.moved;
  if (!moved) return null;
  const poses = trace.poses[trace.target];
  const half = planDistance(moved.from, moved.to) / 2;
  if (poses && half > 0) {
    for (let step = Math.max(0, moved.step); step < poses.length; step += 1) {
      if (planDistance(poses[step], moved.from) > half) return step;
    }
  }
  return Math.min(trace.steps - 1, moved.step + 1);
}

/** The same before the rollout's file has loaded, from the index: the step after the recorded one. */
export function moveShownAtInfo(info: TraceInfo): number | null {
  return info.moved ? Math.min(info.steps - 1, info.moved.step + 1) : null;
}

/**
 * The moments worth stopping at: the start, the move, the closes, the end.
 * Two moments at the same step share it, their labels joined.
 */
export function momentsOf(trace: Trace): Moment[] {
  const last = trace.steps - 1;
  const moments: Moment[] = [{ step: 0, label: "Start" }];
  const shown = moveShownAt(trace);
  if (shown !== null) moments.push({ step: shown, label: "Object moved" });
  const closes = closeSteps(trace);
  closes.forEach((step, index) => {
    if (index < 2 || index === closes.length - 1) {
      const label = index === closes.length - 1 && index >= 2 ? "Last close" : `${ORDINAL[index] ?? "Next"} close`;
      moments.push({ step, label: closes.length === 1 ? "Gripper closes" : label });
    }
  });
  moments.push({ step: last, label: "End" });
  const byStep = new Map<number, string[]>();
  for (const moment of moments) byStep.set(moment.step, [...(byStep.get(moment.step) ?? []), moment.label]);
  return [...byStep.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([step, labels]) => ({
      step,
      label: labels.map((label, index) => (index === 0 ? label : label.charAt(0).toLowerCase() + label.slice(1))).join(", "),
    }));
}

/** Where the named object was at a step, x and y. */
function targetAt(trace: Trace, step: number): number[] | null {
  return trace.poses[trace.target]?.[step] ?? null;
}

export interface CloseReading {
  step: number;
  /** Horizontal distance from the gripper to the named object at that step, in mm. */
  toObjectMm: number | null;
  /** The same to the place the object was moved from, when it had been moved before the close. */
  toOldPlaceMm: number | null;
  /**
   * The object was moved right after this close was commanded, taken from
   * under the fingers: how far it was moved (mm). Null otherwise.
   */
  takenAwayMm: number | null;
}

/** How far from the named object, and from where it had been, the gripper was at a close. */
export function closeReading(trace: Trace, step: number): CloseReading {
  const tcp = trace.tcp[step];
  const target = targetAt(trace, step);
  const shown = moveShownAt(trace);
  const movedBefore = trace.moved && shown !== null && shown <= step ? trace.moved : null;
  const takenAway = trace.moved && shown !== null && step >= trace.moved.step && step < shown ? trace.moved : null;
  return {
    step,
    toObjectMm: tcp && target ? planDistance(tcp, target) * 1000 : null,
    toOldPlaceMm: tcp && movedBefore ? planDistance(tcp, movedBefore.from) * 1000 : null,
    takenAwayMm: takenAway ? planDistance(takenAway.from, takenAway.to) * 1000 : null,
  };
}

/** Seconds into the episode at a step. */
export function secondsAt(trace: Pick<Trace, "hz">, step: number): string {
  return `${(step / trace.hz).toFixed(2)} s`;
}

export interface Readout {
  time: string;
  /** Opening of the fingers, and whether they have been told to close. */
  gripper: string;
  /** Horizontal distance to the named object. */
  distance: string;
  /** Height of the point between the fingertips above the table. */
  height: string;
}

export function readoutAt(trace: Trace, step: number): Readout {
  const tcp = trace.tcp[step];
  const target = targetAt(trace, step);
  const closing = (trace.action[step]?.[7] ?? 1) < 0.5;
  const opening = trace.grip[step] ?? 1;
  return {
    time: secondsAt(trace, step),
    gripper: `${formatPercent(opening)} open${closing ? ", told to close" : ""}`,
    distance: tcp && target ? formatMm(planDistance(tcp, target) * 1000) : "-",
    height: tcp ? formatMm(tcp[2] * 1000) : "-",
  };
}

/** A sentence for each close the gripper made, for the text alternative. */
function closeSentence(trace: Trace, reading: CloseReading, ordinal: string): string {
  const object = OBJECTS[trace.target].label;
  const parts = [`${ordinal} told to close at step ${reading.step} (${secondsAt(trace, reading.step)})`];
  if (reading.toObjectMm !== null) {
    parts.push(
      reading.takenAwayMm !== null
        ? `${formatMm(reading.toObjectMm)} from the ${object}, which was then taken from under the fingers`
        : `${formatMm(reading.toObjectMm)} from the ${object}`,
    );
  }
  if (reading.toOldPlaceMm !== null) parts.push(`${formatMm(reading.toOldPlaceMm)} from where it had been`);
  return `${parts.join(", ")}.`;
}

/**
 * The text alternative: what the replay shows, with its numbers. Before the
 * file has loaded it says what the index says.
 */
export function describe(info: TraceInfo, trace: Trace | null): string {
  const object = OBJECTS[info.target].label;
  const sentences = [
    `Replay of one rollout: ${isExpert(info) ? policyDetails(info).toLowerCase() : `${info.actor} (${policyDetails(info)})`}, ${conditionWords(info).toLowerCase()}, layout ${info.episode + 1}.`,
    `Instruction: "pick up the ${object}".`,
  ];
  if (info.moved) {
    const when =
      info.moved.kind === "grasp"
        ? `The ${object} was moved at step ${info.moved.step}, when the gripper was first told to close`
        : `The ${object} was moved at step ${info.moved.step}, during the reach`;
    const shown = trace ? moveShownAt(trace) : null;
    sentences.push(
      trace?.moved && shown !== null
        ? `${when}: from step ${shown} it stands ${formatMm(planDistance(trace.moved.from, trace.moved.to) * 1000)} from where it was.`
        : `${when}.`,
    );
  }
  if (trace) {
    const closes = closeSteps(trace);
    if (closes.length === 0) sentences.push("The gripper was never told to close.");
    closes.slice(0, 3).forEach((step, index) => {
      const ordinal = closes.length === 1 ? "The gripper was" : `${ORDINAL[index]}, the gripper was`;
      sentences.push(closeSentence(trace, closeReading(trace, step), ordinal));
    });
    if (closes.length > 3) sentences.push(`It was told to close ${closes.length} times in all.`);
  } else if (info.closeStep !== null) {
    sentences.push(`The gripper was first told to close at step ${info.closeStep}, ${info.closes} time${info.closes === 1 ? "" : "s"} in all.`);
  }
  sentences.push(
    `The ${object} was ${info.success ? "lifted" : "not lifted"}; the episode ran ${info.steps} control steps${trace ? ` (${secondsAt(trace, info.steps)})` : ""}.`,
  );
  const reported = reportedFor(info);
  if (reported) {
    sentences.push(`Under the same conditions ${isExpert(info) ? "the expert" : "this policy"} succeeded in ${reportedWords(reported)}.`);
  }
  return sentences.join(" ");
}

export type { ObjectId };
