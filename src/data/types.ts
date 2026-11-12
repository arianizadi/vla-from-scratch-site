/**
 * The shapes of the generated data (src/data/generated, written by
 * scripts/sync-data.mjs). The accessors are in the modules next to this file;
 * src/data/README.md lists them.
 */

/** The two tasks: one red cube, or three of four objects with one of them named. */
export type Task = "pick_cube" | "pick_target";

/** The objects, by the names the simulator gives them. */
export type ObjectId = "cube" | "can" | "hex" | "tblock";

/** The two sets of weights a run saves: the trained ones, and their running average. */
export type Weights = "raw" | "ema";

/** The two machines of the lab notebook. */
export type Machine = "A" | "B";

/** Successes out of episodes. */
export interface Count {
  successes: number;
  episodes: number;
}

/**
 * One closed-loop evaluation: a policy run on layouts it never saw. Shares
 * are between 0 and 1; print them with src/data/format.ts, which rounds as
 * the notebook does.
 */
export interface Evaluation extends Count {
  /** successes / episodes. */
  rate: number;
  /** Wilson 95% interval of the rate, low and high. */
  ci: [number, number];
  /**
   * Share of the episodes in which the object nearest the gripper, when it
   * first closed, was the named one. With three objects on the table, chance
   * is one in three.
   */
  named: number | null;
  /**
   * Least-squares slope of where the gripper first closed against where the
   * named object was, both table axes pooled. 1: it closes where the object
   * is. 0: where it closes does not depend on the scene.
   */
  slope: number | null;
  /** Median distance, in mm, between the gripper and the named object when the gripper first closed. */
  missMm: number | null;
  /** The same to the nearest object, whichever it was. */
  missNearestMm: number | null;
  /** Share of the episodes in which the gripper closed within 10 mm of the named object. */
  within10: number | null;
  /** The same within 20 mm. */
  within20: number | null;
  /** Share of the episodes in which an object other than the named one was lifted. */
  wrongObject: number | null;
  /** Share of the episodes with a second grasp attempt. Null in evaluations made before it was recorded. */
  retried: number | null;
  /** Successes and episodes for each object that was named. */
  perObject: Partial<Record<ObjectId, Count>>;
  /** Id of the public file with this evaluation's episodes, when it is published (see files.ts). */
  graspFile?: string;
}

/** The conditions an evaluation ran under. The defaults are `evaluationDefaults` in runs.ts. */
export interface Settings {
  /** Actions executed of each predicted chunk before the policy plans again. */
  execHorizon: number | null;
  /** Steps the sampler takes from noise to an action chunk. */
  flowSteps: number | null;
  /** The noise a chunk starts from: fresh each time, or the same for every chunk of an episode. */
  noise: "fresh" | "episode";
  /** Every episode starts from a random gripper pose above the table. */
  randomStart: boolean;
  /** Seed of the first layout. Another value than the default is another set of layouts. */
  seedStart: number | null;
  /** The scripted expert drives this many steps before the policy takes over. */
  expertPrefix: number;
  /** Which object the expert heads for during those steps: the named one, or another one. */
  prefixTarget: "named" | "distractor" | null;
  /** The first frame's images are sent for the whole episode. */
  staleImages: boolean;
  /** The previous action sent with the first query: the hold command, or the expert's first command. */
  firstPrevAction: "hold" | "expert";
  /** The named object is moved once: during the reach, or at the moment the gripper first closes. */
  disturb: "none" | "reach" | "grasp";
  /** The control step at which it is moved during the reach. */
  disturbStep: number | null;
  /** How far it is moved, in mm. */
  disturbMm: number | null;
}

/**
 * What a set of conditions asks:
 *
 *   baseline      the default conditions
 *   intervention  something the policy is given is changed (frozen cameras, an expert prefix, the first previous action)
 *   disturbance   the object is moved
 *   sampler       other sampler settings (flow steps, actions executed per chunk, starting noise)
 *   layouts       the default conditions on another set of layouts
 *   start         random start poses
 */
export type ConditionKind = "baseline" | "intervention" | "disturbance" | "sampler" | "layouts" | "start";

/** How a run's demonstrations differ from one clean pass per layout. */
export type DataTrait = "every_object_named" | "early_windows" | "recoveries" | "random_start" | "hold_frame";

/** What a run's name says about it. scripts/sync-data.mjs reads the names (POLICIES, DATASETS). */
export interface RunDesign {
  /**
   * "policy" is the flow-matching policy on the patch tokens of a small
   * ViT; "vla" a vision-language-action policy; the other two are the
   * from-scratch stages that come before one. Null when the name could not be read.
   */
  family: "policy" | "vla" | "language_model" | "vlm" | null;
  /** The notebook's name for the policy: "dp_vit_lang_reactive". */
  policy: string | null;
  /** For a VLA: a pretrained Qwen backbone, the from-scratch VLM, or the same VLM randomly initialised. */
  backbone: "qwen" | "scratch" | "scratch_random" | null;
  /** The instruction is an input. */
  language: boolean | null;
  /** The previous frame, the previous state and the previous action are inputs. */
  history: boolean | null;
  /** The dataset, as the notebook's "Datasets" table names it. */
  dataset: string | null;
  /** Demonstrations in that dataset. */
  demos: number | null;
  traits: DataTrait[];
  /** The training budget when the name carries one: "3M". */
  budget: string | null;
  /** Trained after the position-table bug was fixed. */
  positionFix: boolean;
  /** For a VLA: one vector for the action head, or every token of the backbone. Null for the other families. */
  conditioning?: "vector" | "tokens" | null;
  /** The training seed when the name gives another than the usual one ("seed43" is 43); null otherwise. */
  seed?: number | null;
}

/**
 * The families the site groups runs into, for selectors:
 *
 *   reference       the recipe that works: language, no history, one instruction per layout, the larger dataset
 *   demonstrations  the same policy on demonstrations that differ in what they contain
 *   history         the policy with history on the larger dataset
 *   single_cube     the single cube
 *   backbones       the from-scratch stages and the VLAs
 *   first_round     the first comparisons of inputs and training budget, on the smaller dataset
 */
export type RunFamily = "reference" | "demonstrations" | "history" | "single_cube" | "backbones" | "first_round";

/** Trained before the position-table bug was fixed, or after. */
export type PositionFix = "before" | "after";

/** Where a run belongs: before or after the fix, its family, and its place in the notebook. */
export interface RunGroup {
  fix: PositionFix;
  /** Null when the run's name could not be read. */
  family: RunFamily | null;
  /** Where the notebook first prints the run, for ordering a selector the notebook's way; null when it does not print it. */
  order: number | null;
}

/** How the episodes went in which the object was actually moved (a free place existed). */
export interface Moved extends Count {
  /** Episodes with a second grasp attempt. */
  retried: number;
  /** Median distance, in mm, between where the gripper closed and where the object had been. Null when it is moved at the grasp. */
  fromOldMm: number | null;
  /** The same to where the object was put. */
  fromNewMm: number | null;
}
