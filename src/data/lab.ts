/**
 * Measured numbers shown on the site, copied from the tutorial's lab notebook
 * (tutorial/lab-notebook.md, synced to content/lab-notebook.md). This file is
 * the one place a number may enter the site: tables, charts and figures import
 * from here and never state a number of their own. A run that is still in
 * progress gets an entry without a value.
 *
 * It holds what the landing page shows: the hero plate's two runs (below) and
 * the findings and stages of findings.json. That file carries, next to every
 * number, the passage of the notebook it was copied from; `npm run sync`
 * checks that each passage is still there. The lab page will replace this
 * with a module generated from the notebook.
 */

import data from "./findings.json";

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

export const heroRuns = {
  expert: {
    label: "Scripted expert",
    policy: "scripted expert",
    task: "pick_target",
    medianMissMm: 5,
    successes: 100,
    episodes: 100,
    source: "The scripted expert",
  },
  noLanguage: {
    label: "Policy without language",
    policy: "dp_vit",
    task: "pick_target",
    medianMissMm: 185,
    successes: 1,
    episodes: 100,
    source: "pick_target, first round",
  },
} as const satisfies Record<string, GraspRun>;

export type HeroRunId = keyof typeof heroRuns;

/** Action chunking used by every policy in the notebook's default settings. */
export const chunking = {
  predicted: 15,
  executed: 8,
  flowSteps: 10,
  controlHz: 20,
} as const;

/** The front camera and the from-scratch vision transformer's patch grid (224 px, patch 14). */
export const camera = {
  pixels: 224,
  patch: 14,
  grid: 16,
} as const;
