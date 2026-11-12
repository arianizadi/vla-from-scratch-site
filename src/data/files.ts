/**
 * The larger data: per-episode records, rollouts and camera frames. They are
 * static files under public/, too big to bundle. This module holds their
 * index and fetches a file by id:
 *
 *   graspFiles({ run: "expert" })                       which evaluations have their episodes published
 *   traces({ run: "expert", condition: "plain" })       which rollouts there are
 *   frames({ kind: "layout", camera: "front" })         which camera frames
 *   loadGrasp(id), loadTrace(id)                        fetch one, in the browser
 *
 * `loadGrasp` and `loadTrace` make a request, so they run in the browser,
 * after the figure has mounted: call them from an effect, or use the hooks in
 * use-public-data.ts. A file is requested once per page.
 *
 * Positions are in metres in the robot's frame: the origin is its base, which
 * stands on the table top; x points away from the base over the table, y to
 * the robot's left, z up. Angles are in radians.
 */

import index from "./generated/files.json";
import type { ConditionKind, ObjectId, Settings, Task, Weights } from "./types";

// ---------------------------------------------------------------- per-episode files

/** An evaluation whose episodes are published. */
export interface GraspFileInfo {
  /** Also the file name: /data/grasp/<id>.json. */
  id: string;
  /** A run's name, or "expert". */
  run: string;
  task: Task;
  /** "plain" for a checkpoint under the default conditions, else the probe's name. */
  variant: string;
  kind: ConditionKind;
  /** The checkpoint that was evaluated, with its weights and training samples; absent for the expert. */
  checkpoint?: number;
  weights?: Weights;
  samples?: number;
  /** Number of episodes in the file. */
  episodes: number;
  bytes: number;
}

/** One evaluated episode: where the gripper was when it first closed, and where the objects were. */
export interface GraspEpisode {
  /** The layout's seed; the same seed is the same layout in every evaluation. */
  seed: number;
  /** The object the instruction named. */
  target: ObjectId;
  success: boolean;
  /** Control steps the episode ran; 200 is the limit. */
  steps: number;
  /** An object other than the named one was lifted. */
  wrongObject: boolean;
  /** The control step at which the gripper was first told to close; null when it never was. */
  closeStep: number | null;
  /** Times the gripper went from open to closed: 2 or more is a second attempt. Null in older evaluations. */
  closes: number | null;
  /** The object nearest the gripper at that moment. */
  nearest: ObjectId | null;
  /** Where the gripper was at that moment, x and y. */
  tcp: [number, number] | null;
  /** Where each object on the table was at that moment, x and y. */
  objects: Partial<Record<ObjectId, [number, number]>>;
  /** Yaw error against the grasp the expert uses; null for the can and the hex nut, which have none. */
  yawErr: number | null;
  /** Height of the gripper above the grasp point. */
  zAbove: number | null;
  /**
   * In a disturbance probe: the step at which the named object was moved, and
   * from where to where. Null when it was not moved (no free place existed).
   * Moved during the reach, `objects` holds the new place; moved at the
   * grasp, the place the gripper was aimed at.
   */
  moved: { step: number; from: [number, number]; to: [number, number] } | null;
}

export interface GraspFile extends Omit<GraspFileInfo, "episodes" | "bytes" | "kind"> {
  episodes: GraspEpisode[];
}

// ---------------------------------------------------------------- rollouts

/** A rollout that is published. */
export interface TraceInfo {
  /** Also the file name: /data/traces/<id>.json. */
  id: string;
  /** A run's name, or "expert". */
  run: string;
  /**
   * Who acted, in the notebook's words: "before the fix, plain demonstrations",
   * "recoveries", "scripted expert, plans again".
   */
  actor: string;
  /** For the expert: whether it plans again when the object has moved or the fingers met on nothing. */
  plansAgain?: boolean;
  /** The conditions it was recorded under; `traceCondition` has their settings. */
  condition: string;
  /** The conditions in the notebook's words, from the column of its table ("Moved at step 20"); null when no column has them. */
  conditionWords: string | null;
  /** The layout among the evaluation's layouts, from 0: the same number is the same layout for every actor. */
  episode: number;
  seed: number;
  target: ObjectId;
  /** The three objects on the table. */
  objects: ObjectId[];
  success: boolean;
  /** Number of control steps. */
  steps: number;
  closeStep: number | null;
  /** How many times the gripper was told to close: 2 or more is a second attempt, 0 that it never closed. */
  closes: number;
  /** When the named object was moved, and whether during the reach or at the grasp. */
  moved: { step: number; kind: "reach" | "grasp" } | null;
  /** The steps of this rollout that have camera frames (see `frames`). */
  frames?: number[];
  bytes: number;
}

/** The conditions a group of rollouts was recorded under. */
export interface TraceCondition {
  run: string;
  /** Who acted, in the notebook's words (see TraceInfo). */
  actor: string;
  condition: string;
  /** The conditions in the notebook's words, when a column of its tables has them. */
  conditionWords: string | null;
  task: Task;
  kind: ConditionKind;
  settings: Settings | null;
  /** For a policy: the checkpoint that was served. */
  checkpoint?: number;
  weights?: Weights;
  samples?: number;
  /** For the expert: whether it plans again when the object has moved or the fingers met on nothing. */
  plansAgain?: boolean;
  /**
   * The evaluation of the same policy under the same conditions that the
   * notebook reports: a variant of `probes(run)`, or of `expertRows()`. Null
   * when the notebook reports none; the rollouts are then recordings without
   * a statistic to put beside them.
   */
  reported: string | null;
  /** Number of rollouts. */
  traces: number;
}

/** A rollout: one entry per control step in every array. */
export interface Trace {
  id: string;
  run: string;
  actor: string;
  task: Task;
  condition: string;
  conditionWords: string | null;
  checkpoint?: number;
  weights?: Weights;
  samples?: number;
  plansAgain?: boolean;
  frames?: number[];
  seed: number;
  target: ObjectId;
  instruction: string;
  objects: ObjectId[];
  /** Control steps per second. */
  hz: number;
  success: boolean;
  /** The step at which the gripper was first told to close. */
  closeStep: number | null;
  /** How many times the gripper was told to close. */
  closes: number;
  /** The move of the named object, when there was one: the step, and from where to where (x, y). */
  moved: { step: number; kind: "reach" | "grasp"; from: [number, number]; to: [number, number] } | null;
  /** Number of control steps. */
  steps: number;
  /** Gripper position: x, y, z. */
  tcp: [number, number, number][];
  /** Gripper yaw. */
  yaw: number[];
  /** Gripper opening, 1 open to 0 closed. */
  grip: number[];
  /** The seven joint angles. */
  q: number[][];
  /** The action executed at this step: seven joint targets and the gripper command (1 open, 0 closed). */
  action: number[][];
  /** Each object's pose: x, y, z, yaw. */
  poses: Partial<Record<ObjectId, [number, number, number, number][]>>;
}

// ---------------------------------------------------------------- camera frames

export interface FrameInfo {
  id: string;
  /** Address of the image on the site: /tutorial/frames/<id>.png. */
  file: string;
  width: number;
  height: number;
  /**
   * "layout": an evaluation layout before the robot moves (`seed`).
   * "rollout": a step of the expert rollout that `traces({ condition: "frames" })` returns (`step`).
   * "input": a frame at the size the policy receives.
   */
  kind: "layout" | "rollout" | "input" | "other";
  camera: "front" | "wrist" | null;
  seed?: number;
  step?: number;
  bytes: number;
}

// ---------------------------------------------------------------- the index

const files = index as unknown as {
  grasp: GraspFileInfo[];
  traces: TraceInfo[];
  conditions: TraceCondition[];
  frames: FrameInfo[];
};

/** True when every given field of `query` equals the item's. */
function matches<Item>(item: Item, query: Partial<Item>): boolean {
  return (Object.keys(query) as (keyof Item)[]).every((key) => query[key] === undefined || item[key] === query[key]);
}

/** The evaluations whose episodes are published, narrowed by any of their fields. */
export function graspFiles(query: Partial<GraspFileInfo> = {}): GraspFileInfo[] {
  return files.grasp.filter((file) => matches(file, query));
}

/**
 * The published rollouts, narrowed by any of their fields. Not every rollout
 * of the export is published: for each condition, the same few layouts of
 * each actor, so `traces({ condition, episode })` sets actors side by side.
 */
export function traces(query: Partial<Omit<TraceInfo, "objects" | "moved" | "frames">> = {}): TraceInfo[] {
  return files.traces.filter((trace) => matches(trace, query as Partial<TraceInfo>));
}

/**
 * The actors with rollouts under a set of conditions, named by the notebook's
 * words for it ("Moved at step 20"), and the layouts (`episode`) every one of
 * them has: what a figure sets side by side. The expert's conditions have
 * other names in `condition` ("plans_again_disturb_reach20"); the words are
 * the same for every actor.
 */
export function sideBySide(conditionWords: string): { actors: string[]; episodes: number[] } {
  const list = files.traces.filter((trace) => trace.conditionWords === conditionWords && trace.condition !== "frames");
  const actors = [...new Set(list.map((trace) => trace.actor))];
  const sets = actors.map((actor) => new Set(list.filter((trace) => trace.actor === actor).map((trace) => trace.episode)));
  const episodes = [...(sets[0] ?? [])].filter((episode) => sets.every((set) => set.has(episode))).sort((a, b) => a - b);
  return { actors, episodes };
}

/** The conditions rollouts were recorded under, one entry per run and condition. */
export function traceConditions(): TraceCondition[] {
  return files.conditions;
}

/** The conditions of one group of rollouts. */
export function traceCondition(run: string, condition: string): TraceCondition | undefined {
  return files.conditions.find((entry) => entry.run === run && entry.condition === condition);
}

/** The camera frames, narrowed by any of their fields. */
export function frames(query: Partial<FrameInfo> = {}): FrameInfo[] {
  return files.frames.filter((frame) => matches(frame, query));
}

export const graspUrl = (id: string) => `/data/grasp/${id}.json`;
export const traceUrl = (id: string) => `/data/traces/${id}.json`;

// ---------------------------------------------------------------- fetching

const requests = new Map<string, Promise<unknown>>();

/** Fetches a JSON file of this site once; later calls get the same answer. A failed request can be tried again. */
function load<Data>(url: string): Promise<Data> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error(`${url} is fetched in the browser: call this from an effect, after the figure has mounted.`));
  }
  let request = requests.get(url) as Promise<Data> | undefined;
  if (!request) {
    request = fetch(url).then((response) => {
      if (!response.ok) throw new Error(`${url} could not be loaded (${response.status}).`);
      return response.json() as Promise<Data>;
    });
    request.catch(() => requests.delete(url));
    requests.set(url, request);
  }
  return request;
}

/** The episodes of one evaluation. `id` is a `graspFile` of an evaluation, or an id from `graspFiles()`. */
export function loadGrasp(id: string): Promise<GraspFile> {
  return load<GraspFile>(graspUrl(id));
}

/** One rollout. `id` is from `traces()`, or from the `traces` of a probe. */
export function loadTrace(id: string): Promise<Trace> {
  return load<Trace>(traceUrl(id));
}
