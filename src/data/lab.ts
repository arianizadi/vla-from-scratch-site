/**
 * The numbers the landing page shows: the findings and stages of
 * findings.json, and the two runs, the chunking and the camera of the hero
 * plate.
 *
 * findings.json carries, next to every number, the passage of the lab
 * notebook it was copied from; `npm run sync` checks that each passage is
 * still there. The hero's values are not typed here: they come from the
 * experiment export (src/data/generated) where it has them, and from the
 * hand-copied notebook numbers (notebook.json) where only the notebook does.
 *
 * Every other table, chart and figure reads the modules next to this file:
 * runs.ts, checkpoints.ts, probes.ts, curves.ts, tolerance.ts, tokens.ts,
 * files.ts, notebook.ts, with labels.ts and format.ts for the words and the
 * rounding. src/data/README.md describes them. No component states a
 * measured number of its own.
 */

import data from "./findings.json";
import expertRows from "./generated/expert.json";
import meta from "./generated/meta.json";
import { fixed } from "./notebook-format.mjs";
import notebook from "./notebook.json";

/** One measured row of a finding: a policy, or one checkpoint of a policy. */
export interface FindingRow {
  label: string;
  /** Second line under the label: the task, the data, the size. */
  detail?: string;
  /** The result as the notebook writes it ("2/50 = 4%"). */
  result: string;
  /** Where the result sits on a 0 to 100% track. */
  percent: number;
  /** The notebook's 95% interval, in percent. */
  interval?: { low: number; high: number };
  /** A second measurement of the same run ("0.040", "185 mm"); the finding names it. */
  aside?: string;
  /** A yardstick, not a learned policy: drawn hollow. */
  reference?: boolean;
  quotes: string[];
}

export interface Finding {
  id: string;
  /** The finding, as the tutorial's README words it. */
  title: string;
  /** Task, data and number of episodes the rows share. */
  setting: string;
  /** What the track measures. */
  measure: string;
  /** What the aside column holds, when the rows have one. */
  aside?: string;
  /** A level drawn across the track, for example chance. */
  chance?: { percent: number; label: string; quotes: string[] };
  rows: FindingRow[];
  /** What the rows do and do not show. */
  note: { text: string; quotes: string[] };
  /** The notebook section the rows come from. */
  section: string;
}

/** One stage of the from-scratch path: language model, VLM, VLA. */
export interface Stage {
  number: number;
  name: string;
  /** Number of the tutorial part that covers it. */
  part: number;
  model: string;
  data: string;
  budget: string;
  result: string;
  quotes: string[];
}

export const findings: Finding[] = data.findings;
export const stages: Stage[] = data.stages.items;
export const stageHardware: string = data.stages.hardware.text;
export const stageComparison: string = data.stages.comparison.text;
export const conventions: string = data.conventions.text;
export const runsInProgress: string = data.status.text;

export interface GraspRun {
  /** How the plate names the policy. */
  label: string;
  /** The notebook's name for the policy. */
  policy: string;
  task: string;
  /** Median distance between the gripper and the named object when it first closed, in mm. */
  medianMissMm: number;
  successes: number;
  episodes: number;
  /** The notebook section the numbers are copied from. */
  source: string;
}

/** A value the hero cannot do without; the build stops when the data no longer has it. */
function need<Value>(value: Value | undefined, what: string): Value {
  if (value === undefined) throw new Error(`src/data/lab.ts: the data has no ${what}. Run "npm run sync".`);
  return value;
}

// The scripted expert through the evaluation loop: from the export.
const expert = need(
  expertRows.find((row) => row.variant === "plain"),
  "evaluation of the scripted expert",
);
// The first-round policy without language ran on machine A: only the notebook has it.
const firstRound = notebook.firstRound;
const noLanguage = need(
  firstRound.rows.find((row) => row.id === "dp_vit"),
  "first-round row for dp_vit",
);
const noLanguageGrasp = need(
  firstRound.grasp.rows.find((row) => row.id === "dp_vit"),
  "first-round grasp row for dp_vit",
);
// "pick_target, first round": the heading without its code marks and its machine.
const firstRoundSection = firstRound.section.replace(/`/g, "").replace(/\s*\(machine [AB]\)$/, "");
// The vision transformer of the from-scratch VLM: the stage that has one.
const vit = need(notebook.stages.rows.find((row) => row.vit)?.vit, "vision transformer among the from-scratch stages");

export const heroRuns: Record<"expert" | "noLanguage", GraspRun> = {
  expert: {
    label: "Scripted expert",
    policy: "scripted expert",
    task: expert.task,
    // As the notebook writes it: a whole number of millimetres.
    medianMissMm: Number(fixed(expert.missMm)),
    successes: expert.successes,
    episodes: expert.episodes,
    source: expert.sections[0],
  },
  noLanguage: {
    label: "Policy without language",
    policy: noLanguage.policy,
    task: "pick_target",
    medianMissMm: noLanguageGrasp.missNamedMm,
    successes: noLanguage.successes,
    episodes: noLanguage.episodes,
    source: firstRoundSection,
  },
};

export type HeroRunId = keyof typeof heroRuns;

/** Action chunking used by every policy in the notebook's default settings. */
export const chunking: { predicted: number; executed: number; flowSteps: number; controlHz: number } = {
  // A policy predicts the current action and 14 more: only the notebook says so.
  predicted: notebook.setup.chunk.actions,
  // The evaluation defaults and the control rate come with the export.
  executed: meta.defaults.execHorizon,
  flowSteps: meta.defaults.flowSteps,
  controlHz: meta.defaults.controlHz,
};

/** The front camera and the from-scratch vision transformer's patch grid (224 px, patch 14). */
export const camera: { pixels: number; patch: number; grid: number } = {
  pixels: notebook.setup.camera.pixels,
  patch: vit.patch,
  grid: notebook.setup.camera.pixels / vit.patch,
};
