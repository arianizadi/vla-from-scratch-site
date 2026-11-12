/**
 * Words for the things the data names with identifiers: machines, objects,
 * tasks, weights, runs and evaluation conditions. The wording follows the lab
 * notebook, so a label here reads like the row it stands for there.
 */

import meta from "./generated/meta.json";
import { formatBudget } from "./format";
import { disturbanceNotes, setup } from "./notebook";
import type { ConditionKind, DataTrait, Machine, ObjectId, PositionFix, RunDesign, RunFamily, Settings, Task, Weights } from "./types";

// ---------------------------------------------------------------- machines

/**
 * The two machines, in the only two forms the site uses for hardware. `label`
 * the first time a page names the machine, `name` after that.
 */
export const MACHINES: Record<Machine, { name: string; label: string }> = {
  A: { name: "machine A", label: "machine A (one RTX 4090, 24 GB)" },
  B: { name: "machine B", label: "machine B (L40S GPUs)" },
};

// ---------------------------------------------------------------- objects, tasks, weights

export interface ObjectInfo {
  /** As the instruction names it: "blue hex nut". */
  label: string;
  /** For a legend or a column head: "Hex nut". */
  short: string;
  /** Key of the object's colour and marker in the figure kit's OBJECT_SERIES. */
  series: "hex_nut" | "cube" | "can" | "t_block";
}

export const OBJECTS: Record<ObjectId, ObjectInfo> = {
  hex: { label: "blue hex nut", short: "Hex nut", series: "hex_nut" },
  cube: { label: "red cube", short: "Cube", series: "cube" },
  can: { label: "green can", short: "Can", series: "can" },
  tblock: { label: "yellow T block", short: "T block", series: "t_block" },
};

/** The objects in the order every chart uses (DESIGN.md: hex nut, cube, can, T block). */
export const OBJECT_IDS: ObjectId[] = ["hex", "cube", "can", "tblock"];

/** The instruction that names an object: "pick up the blue hex nut". */
export function instructionFor(object: ObjectId): string {
  return `pick up the ${OBJECTS[object].label}`;
}

export const TASKS: Record<Task, { label: string; description: string }> = {
  pick_cube: { label: "Single cube", description: "one red cube at a random pose" },
  pick_target: {
    label: "Named object",
    description: `${setup.pickTarget.objectsOnTable} of ${setup.pickTarget.objects} objects at random poses, one of them named in the instruction`,
  },
};

/** "raw" is the weights the run trained, "ema" their running average, saved by the same run. */
export const WEIGHTS: Record<Weights, { label: string; short: string }> = {
  raw: { label: "trained weights", short: "trained" },
  ema: { label: "averaged weights", short: "averaged" },
};

/** The weights in the order the notebook writes a pair: trained / averaged. */
export const WEIGHT_IDS: Weights[] = ["raw", "ema"];

/**
 * The scripted expert, which the data lists under the run name "expert". It
 * has one plan per episode unless it is the variant that plans again when the
 * object has moved or the fingers met on nothing.
 */
export function expertLabel(plansAgain = false): string {
  return plansAgain ? "Scripted expert that plans again" : "Scripted expert";
}

// ---------------------------------------------------------------- runs

const TRAITS: Record<DataTrait, string> = {
  every_object_named: "every object named",
  early_windows: "early windows repeated",
  recoveries: "demonstrations with recoveries",
  random_start: "random start poses",
  hold_frame: "demonstrations begin with a hold frame",
};

const sentenceCase = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

/** What `runLabel` needs of a run; every Run of runs.ts has it. */
export interface Labelled {
  name: string;
  design: RunDesign;
  samplesPlanned: number;
  /** The notebook's words for the run, when it names it in words ("recoveries"). */
  words?: string | null;
}

/**
 * A run in words. When the notebook names the run in words, those words,
 * as the notebook writes them, with a capital: "Recoveries", "Random starts",
 * "From-scratch VLA, pretrained backbone". Otherwise what distinguishes the
 * run among its kind: "4000 demonstrations, no history" (the task when it is
 * the single cube, the number of demonstrations, history, a missing language
 * input, what is special about the demonstrations, and the position fix).
 * The training budget is added when the run's name carries one, or when
 * `budget` is set. `recipe` gives the second form for a run that has words.
 */
export function runLabel(run: Labelled, options: { budget?: boolean; recipe?: boolean } = {}): string {
  const { design } = run;
  if (run.words && !options.recipe) {
    const budget = options.budget ? formatBudget(run.samplesPlanned) : null;
    return sentenceCase(budget ? `${run.words}, ${budget} samples` : run.words);
  }
  const parts: string[] = [];
  switch (design.family) {
    case "language_model":
      parts.push("language model, from scratch");
      break;
    case "vlm":
      parts.push("vision-language model, from scratch");
      break;
    case "vla":
      parts.push(
        design.backbone === "qwen"
          ? "Qwen VLA"
          : design.backbone === "scratch_random"
            ? "from-scratch VLA, backbone not pretrained"
            : "from-scratch VLA",
      );
      break;
    case "policy":
      if (design.dataset?.startsWith("pick_cube")) parts.push("single cube");
      break;
    default:
      return run.name;
  }
  if (design.demos !== null) parts.push(`${design.demos} demonstrations`);
  if (design.family === "vla" && design.conditioning) parts.push(design.conditioning === "tokens" ? "every token" : "one vector");
  if (design.history !== null) parts.push(design.history ? "with history" : "no history");
  if (design.family === "policy" && design.language === false) parts.push("no language");
  parts.push(...design.traits.map((trait) => TRAITS[trait]));
  const budget = design.budget ?? (options.budget ? formatBudget(run.samplesPlanned) : null);
  if (budget) parts.push(`${budget} samples`);
  if (design.seed !== null && design.seed !== undefined) parts.push(`seed ${design.seed}`);
  if (design.positionFix) parts.push("position fix");
  return sentenceCase(parts.join(", "));
}

// ---------------------------------------------------------------- groups of runs

/** The families of runs, in the order the site presents them, with a heading and a sentence each. */
export const RUN_FAMILIES: Record<RunFamily, { label: string; description: string }> = {
  reference: {
    label: "The reference recipe",
    description: "language, no history, one instruction per layout, the larger dataset",
  },
  demonstrations: {
    label: "What the demonstrations contain",
    description: "the same policy, trained on demonstrations that differ in what they show",
  },
  history: {
    label: "History",
    description: "the previous frame, the previous state and the previous action as inputs",
  },
  single_cube: {
    label: "Single cube",
    description: "one red cube, with and without history",
  },
  backbones: {
    label: "Backbones",
    description: "the from-scratch stages and the vision-language-action policies built on a backbone",
  },
  first_round: {
    label: "First round",
    description: "the first comparisons of inputs and training budget, on the smaller dataset",
  },
};

/** The families in the order the site presents them. */
export const RUN_FAMILY_IDS: RunFamily[] = ["reference", "demonstrations", "history", "single_cube", "backbones", "first_round"];

/** Before or after the position-table bug was fixed. */
export const POSITION_FIX: Record<PositionFix, { label: string; short: string }> = {
  before: { label: "before the position fix", short: "before the fix" },
  after: { label: "after the position fix", short: "after the fix" },
};

/** The inputs of a policy as the notebook's tables put them: "language, no history". */
export function inputsLabel(design: RunDesign): string | undefined {
  if (design.language === null || design.history === null) return undefined;
  return `${design.language ? "language" : "no language"}, ${design.history ? "history" : "no history"}`;
}

/** Key of the run's colour and marker in the figure kit's POLICY_SERIES, when it has one. */
export function policySeries(
  design: RunDesign,
): "vit_tokens" | "vit_language" | "qwen_vla" | "custom_vla_pretrained" | "custom_vla_random" | undefined {
  if (design.family === "policy") return design.language ? "vit_language" : "vit_tokens";
  if (design.family !== "vla") return undefined;
  if (design.backbone === "qwen") return "qwen_vla";
  return design.backbone === "scratch_random" ? "custom_vla_random" : "custom_vla_pretrained";
}

// ---------------------------------------------------------------- conditions

/** What each kind of condition asks. */
export const CONDITION_KINDS: Record<ConditionKind, string> = {
  baseline: "As trained",
  intervention: "What the policy is given",
  disturbance: "The object is moved",
  sampler: "Sampler settings",
  layouts: "Another set of layouts",
  start: "Random start poses",
};

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;

/**
 * The conditions of an evaluation in words, naming what differs from the
 * default: "the first frame's images are sent for the whole episode". With
 * `short`, the few words a chart label has room for: "cameras frozen on the
 * first frame". Default conditions read "as trained"; pass `baseline` for
 * another word ("as served").
 */
export function conditionLabel(settings: Settings, options: { short?: boolean; baseline?: string } = {}): string {
  const { short = false, baseline = "as trained" } = options;
  const parts: string[] = [];

  if (settings.randomStart) parts.push(short ? "random start" : "every episode starts from a random gripper pose");
  if (settings.staleImages) {
    parts.push(short ? "cameras frozen on the first frame" : "the first frame's images are sent for the whole episode");
  }
  if (settings.firstPrevAction === "expert") {
    parts.push(
      short
        ? "told the expert's first action"
        : "the previous action sent with the first query is the expert's first command",
    );
  }
  if (settings.expertPrefix > 0) {
    const toward = settings.prefixTarget === "distractor" ? " toward another object" : "";
    parts.push(
      short
        ? `expert drives ${plural(settings.expertPrefix, "step")}${toward}`
        : `the expert drives the first ${plural(settings.expertPrefix, "step")}${toward}, then the policy takes over`,
    );
  }
  if (settings.disturb !== "none") {
    // The notebook states the distance only when it is not the usual one.
    const usual = settings.disturbMm === null || settings.disturbMm === disturbanceNotes.move.distanceMm;
    const by = usual ? "" : `, by ${settings.disturbMm} mm`;
    if (settings.disturb === "grasp") {
      parts.push(short ? `moved at the grasp${by}` : `the object is moved at the moment the gripper first closes${by}`);
    } else {
      parts.push(
        short
          ? `moved at step ${settings.disturbStep}${by}`
          : `the object is moved at step ${settings.disturbStep} of the reach${by}`,
      );
    }
  }
  if (settings.flowSteps !== null && settings.flowSteps !== meta.defaults.flowSteps) {
    parts.push(plural(settings.flowSteps, "flow step"));
  }
  if (settings.execHorizon !== null && settings.execHorizon !== meta.defaults.execHorizon) {
    // A policy predicts a chunk of 15 actions; asking for more executes all of them.
    const whole = settings.execHorizon >= setup.chunk.actions;
    const executed = whole ? setup.chunk.actions : settings.execHorizon;
    parts.push(
      whole
        ? `${executed} actions executed per chunk (the whole chunk)`
        : `${plural(executed, "action")} executed per chunk`,
    );
  }
  if (settings.noise === "episode") {
    parts.push(short ? "same starting noise" : "the same starting noise for every chunk of an episode");
  }
  if (settings.seedStart !== null && settings.seedStart !== meta.defaults.seedStart) {
    parts.push(short ? "second set of layouts" : `a second set of ${meta.defaults.episodes} layouts`);
  }
  return parts.length > 0 ? parts.join(", ") : baseline;
}
