/**
 * What the disturbance figure draws, read from the data module: the
 * disturbances that have rollouts, the actors under each, the reported
 * statistic beside each actor, and the geometry of one rollout (when the
 * gripper closed, where, and a frame that holds every actor on a layout).
 *
 * Nothing here names a run, a condition or a number. The lists come from the
 * trace index (`traceConditions`, `traces`), so a refreshed export with more
 * actors or more disturbances shows up without a change here.
 */

import { traceConditions, traces, type Trace, type TraceCondition, type TraceInfo } from "@/data/files";
import { conditionLabel, runLabel } from "@/data/labels";
import { disturbanceNotes, setup } from "@/data/notebook";
import { batteryRuns, batterySection, expert, probe } from "@/data/probes";
import { run as findRun } from "@/data/runs";
import type { Count, Settings } from "@/data/types";

// ---------------------------------------------------------------- actors

/** How an actor came by its behaviour: the chapter's three kinds. */
export type ActorGroup = "clean" | "recoveries" | "expert";

export const GROUP_ORDER: ActorGroup[] = ["clean", "recoveries", "expert"];

export const GROUP_HEADING: Record<ActorGroup, { one: string; many: string }> = {
  clean: {
    one: "Policy trained on clean demonstrations",
    many: "Policies trained on clean demonstrations",
  },
  recoveries: {
    one: "Policy trained on demonstrations with recoveries",
    many: "Policies trained on demonstrations with recoveries",
  },
  expert: { one: "Scripted expert", many: "Scripted expert" },
};

export interface Actor {
  /** The notebook's words for who acted: also the key. */
  words: string;
  /** A run's name, or "expert". */
  run: string;
  plansAgain: boolean;
  group: ActorGroup;
  /** What the policy was trained on, spelled out; for the expert, what it does. */
  recipe: string;
}

/**
 * What the notebook prints of an evaluation under a disturbance. Counted over
 * the episodes in which the object could be moved. The data carries more detail
 * for every reported evaluation (medians, second attempts); a field here is
 * null where the notebook's table does not print it, so the figure states only
 * the numbers the notebook states.
 */
export interface Reported extends Count {
  /** Episodes with a second grasp attempt; null where the notebook does not print them. */
  retried: number | null;
  /** Median distance at closing from the old and from the new place, mm; null where not printed. */
  fromOldMm: number | null;
  fromNewMm: number | null;
}

/** One actor under one disturbance: its rollouts and the evaluation the notebook reports for it. */
export interface ActorUnder {
  actor: Actor;
  condition: TraceCondition;
  traces: TraceInfo[];
  /** Null when the notebook reports no evaluation of this actor under these conditions. */
  reported: Reported | null;
}

export interface DisturbanceOption {
  /** The notebook's words for the disturbance ("Moved at step 20"): also the key. */
  words: string;
  settings: Settings;
  /** The actors that have rollouts under it, keyed by their words. */
  actors: Map<string, ActorUnder>;
}

const sentenceCase = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

function actorOf(condition: TraceCondition): Actor {
  const isExpert = condition.run === "expert";
  const plansAgain = condition.plansAgain === true;
  if (isExpert) {
    return {
      words: condition.actor,
      run: condition.run,
      plansAgain,
      group: "expert",
      recipe: plansAgain
        ? "Plans again when the object has moved or the fingers met on nothing"
        : "Keeps the plan it made at the start of the episode",
    };
  }
  const entry = findRun(condition.run);
  const recoveries = entry?.design.traits.includes("recoveries") ?? false;
  return {
    words: condition.actor,
    run: condition.run,
    plansAgain: false,
    group: recoveries ? "recoveries" : "clean",
    recipe: entry ? runLabel(entry, { recipe: true }) : condition.run,
  };
}

/**
 * Which of an evaluation's numbers the notebook prints, read from the sections
 * that report it: the table "Disturbances" (before the fix) prints success, the
 * median distances and the second attempts; the tables after the fix print
 * success, and for a policy moved at the grasp the second attempts ("29
 * retried"); the expert's table prints success alone.
 */
function reportedOf(condition: TraceCondition): Reported | null {
  if (!condition.reported) return null;
  const isExpert = condition.run === "expert";
  const row = isExpert ? expert(condition.reported) : probe(condition.run, condition.reported);
  const moved = row?.moved;
  if (!row || !moved) return null;
  const detailed = row.sections.includes(disturbanceNotes.section);
  const graspColumn =
    !isExpert &&
    row.settings.disturb === "grasp" &&
    batterySection !== null &&
    row.sections.includes(batterySection);
  return {
    successes: moved.successes,
    episodes: moved.episodes,
    retried: detailed || graspColumn ? moved.retried : null,
    fromOldMm: detailed ? moved.fromOldMm : null,
    fromNewMm: detailed ? moved.fromNewMm : null,
  };
}

/** True when the condition's checkpoint is the one the notebook's tables after the fix call the run's final one. */
export function isFinalCheckpoint(condition: TraceCondition): boolean {
  const row = batteryRuns().find((entry) => entry.run === condition.run);
  return row !== undefined && row.checkpoint !== null && row.checkpoint === condition.checkpoint;
}

/** Where a disturbance sorts: from the usual start pose first, during the reach by step, then at the grasp. */
function order(settings: Settings): number[] {
  return [
    settings.randomStart ? 1 : 0,
    settings.disturb === "grasp" ? 1 : 0,
    settings.disturbStep ?? 0,
    settings.disturbMm ?? 0,
  ];
}

function compare(a: number[], b: number[]): number {
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return 0;
}

function build(): { options: DisturbanceOption[]; actors: Actor[] } {
  const byWords = new Map<string, DisturbanceOption>();
  const actors = new Map<string, Actor>();

  for (const condition of traceConditions()) {
    const settings = condition.settings;
    if (condition.kind !== "disturbance" || !settings || settings.disturb === "none") continue;
    const list = traces({
      run: condition.run,
      condition: condition.condition,
    }).sort((a, b) => a.episode - b.episode);
    if (list.length === 0) continue;

    const words = condition.conditionWords ?? sentenceCase(conditionLabel(settings, { short: true }));
    const option = byWords.get(words) ?? {
      words,
      settings,
      actors: new Map<string, ActorUnder>(),
    };
    byWords.set(words, option);

    const actor = actors.get(condition.actor) ?? actorOf(condition);
    actors.set(condition.actor, actor);
    option.actors.set(actor.words, {
      actor,
      condition,
      traces: list,
      reported: reportedOf(condition),
    });
  }

  const options = [...byWords.values()].sort((a, b) => compare(order(a.settings), order(b.settings)));
  // The index's order within each group, the groups in the chapter's order.
  const actorList = [...actors.values()].sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group));
  return { options, actors: actorList };
}

const BUILT = build();

/** The disturbances that have rollouts, from the usual start pose first. */
export const DISTURBANCES: DisturbanceOption[] = BUILT.options;

/** Disturbances under which two or more actors have rollouts: the ones that make a comparison. */
export const COMPARED: DisturbanceOption[] = DISTURBANCES.filter((option) => option.actors.size >= 2);

/** Disturbances with the rollouts of one actor alone (for now: a refreshed export may add more). */
export const SINGLE: DisturbanceOption[] = DISTURBANCES.filter((option) => option.actors.size < 2);

/** Every actor that has a rollout under some disturbance, grouped clean, recoveries, expert. */
export const ACTORS: Actor[] = BUILT.actors;

/** The disturbance both chapters describe, when the data has it; else the first move during the reach. */
const PREFERRED = "Moved at step 20";
export const DEFAULT_DISTURBANCE: DisturbanceOption | undefined =
  COMPARED.find((option) => option.words === PREFERRED) ??
  COMPARED.find((option) => option.settings.disturb === "reach") ??
  COMPARED[0] ??
  DISTURBANCES[0];

/** The layouts (episodes) every actor under a disturbance has, so the comparison holds. */
export function sharedEpisodes(option: DisturbanceOption): number[] {
  const sets = [...option.actors.values()].map((entry) => new Set(entry.traces.map((trace) => trace.episode)));
  const first = sets[0] ? [...sets[0]] : [];
  return first.filter((episode) => sets.every((set) => set.has(episode))).sort((a, b) => a - b);
}

/** The episode limit of an evaluation: an episode that reaches it without a lift ran out of time. */
export const MAX_STEPS: number = setup.success.maxSteps;

// ---------------------------------------------------------------- one rollout

/** The control steps at which the gripper was told to close: each change of the command from open to closed. */
export function closeSteps(trace: Trace): number[] {
  const steps: number[] = [];
  let open = true;
  trace.action.forEach((command, step) => {
    const nowOpen = (command[command.length - 1] ?? 1) >= 0.5;
    if (open && !nowOpen) steps.push(step);
    open = nowOpen;
  });
  return steps;
}

/**
 * The close that decides the episode: for a lift, the last close (the grasp
 * that held); otherwise the first close after the object was moved (at the
 * grasp the move follows the first close, so the next one), or the first close
 * when nothing was moved. Null when there is none. The plan draws the path
 * after it lightly, so the reach and that close read at a glance.
 */
export function decisiveClose(trace: Trace): number | null {
  const closes = closeSteps(trace);
  if (closes.length === 0) return null;
  if (trace.success) return closes[closes.length - 1];
  const moved = trace.moved;
  if (!moved) return closes[0];
  return closes.find((close) => close > moved.step) ?? closes[closes.length - 1];
}

/** The stretches during which the gripper was commanded closed, [first, last] step. */
export function closedSpans(trace: Trace): [number, number][] {
  const spans: [number, number][] = [];
  let start: number | null = null;
  trace.action.forEach((command, step) => {
    const closed = (command[command.length - 1] ?? 1) < 0.5;
    if (closed && start === null) start = step;
    if (!closed && start !== null) {
      spans.push([start, step - 1]);
      start = null;
    }
  });
  if (start !== null) spans.push([start, trace.action.length - 1]);
  return spans;
}

const distance = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/**
 * Whether the gripper, at a step, was nearer the place the object was moved
 * from or the place it was moved to. A comparison, not a measurement: the
 * figure states no distance of its own.
 */
export function nearerPlace(trace: Trace, step: number): "old" | "new" | null {
  const moved = trace.moved;
  const at = trace.tcp[step];
  if (!moved || !at) return null;
  return distance(at, moved.from) <= distance(at, moved.to) ? "old" : "new";
}

/** A region of the table in the robot's frame, metres. */
export interface Bounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

/** A frame that holds the gripper and the objects of every given rollout, with a margin. */
export function boundsOf(list: Trace[], margin = 0.03): Bounds | null {
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;
  const add = (point: readonly number[]) => {
    xMin = Math.min(xMin, point[0]);
    xMax = Math.max(xMax, point[0]);
    yMin = Math.min(yMin, point[1]);
    yMax = Math.max(yMax, point[1]);
  };
  for (const trace of list) {
    trace.tcp.forEach(add);
    for (const poses of Object.values(trace.poses)) poses?.forEach(add);
    if (trace.moved) {
      add(trace.moved.from);
      add(trace.moved.to);
    }
  }
  if (!Number.isFinite(xMin)) return null;
  return {
    xMin: xMin - margin,
    xMax: xMax + margin,
    yMin: yMin - margin,
    yMax: yMax + margin,
  };
}

/** The highest the gripper went in any of the rollouts, metres. */
export function topOf(list: Trace[]): number {
  return list.reduce((top, trace) => trace.tcp.reduce((high, point) => Math.max(high, point[2]), top), 0);
}

/** What the gripper does in a rollout, in words: the one sentence the figure is about. */
export function behaviour(info: TraceInfo, trace: Trace | null): string {
  const closes = trace ? closeSteps(trace) : null;
  const count = closes?.length ?? info.closes;
  if (count === 0) return "never closes the gripper";

  const times = count === 1 ? "once" : count === 2 ? "twice" : `${count} times`;
  let where = "";
  if (trace && closes && trace.moved) {
    const places = closes.map((step) => nearerPlace(trace, step));
    const first = places[0];
    const last = places[places.length - 1];
    const all = places.every((place) => place === first);
    if (trace.moved.kind === "grasp") {
      // The first close is where the object was when it was taken away: only the later ones say anything.
      where = count > 1 ? `, the last time nearer the ${last} place` : "";
    } else if (count === 1) {
      where = `, nearer the ${first} place`;
    } else if (all) {
      where = `, ${count === 2 ? "both times" : "every time"} nearer the ${first} place`;
    } else {
      where = `, first nearer the ${first} place, the last time nearer the ${last} place`;
    }
  }
  return `closes ${times}${where}`;
}
