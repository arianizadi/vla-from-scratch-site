/**
 * The interactive figures a chapter may ask for. The ids and the "shows" text
 * are the table in the tutorial's STYLE.md, copied word for word; that table is
 * the contract between the chapters and this site.
 *
 * This file is data only (no components), so server and client code can both
 * read it. The components are mapped in registry.ts.
 *
 * Each figure says what kind of statement it makes:
 *
 *   measured   drawn from numbers in the lab notebook
 *   computed   the real algorithm running on a toy input
 *   schematic  an explanatory drawing
 */

export type Stamp = "measured" | "computed" | "schematic";

export interface FigureInfo {
  /** Title printed in the header strip of the figure's frame. */
  title: string;
  /** What the figure shows, as STYLE.md words it. */
  shows: string;
  stamp: Stamp;
}

export const FIGURES = {
  pipeline: {
    title: "The whole loop",
    shows: "the whole loop: expert, dataset, shards, training, policy server, simulator, success rate",
    stamp: "schematic",
  },
  tokenizer: {
    title: "A sentence becomes tokens",
    shows: "a sentence split into tokens and ids with the tokenizer used here; a toy BPE merge, step by step",
    stamp: "computed",
  },
  "padding-shift": {
    title: "How padding moves a token",
    shows: "a padded batch and how padding moves a token appended at the end",
    stamp: "computed",
  },
  attention: {
    title: "An attention matrix",
    shows: "an attention matrix over a short sequence, causal mask on and off",
    stamp: "computed",
  },
  rotary: {
    title: "Rotary position encoding",
    shows: "rotary position encoding: queries and keys rotated by position, relative offset preserved",
    stamp: "computed",
  },
  "training-step": {
    title: "One optimisation step",
    shows: "one optimisation step: forward, loss, backward, update",
    stamp: "schematic",
  },
  "loss-vs-success": {
    title: "Loss against closed-loop success",
    shows: "a real loss curve next to the closed-loop success of the same checkpoints",
    stamp: "measured",
  },
  patchify: {
    title: "A frame cut into patches",
    shows: "a camera frame cut into patches, each patch becoming a token; object size in pixels",
    stamp: "computed",
  },
  "pooled-vs-tokens": {
    title: "One pooled vector or many patch tokens",
    shows: "many patch tokens against one pooled vector reaching the action head",
    stamp: "schematic",
  },
  "sequence-layout": {
    title: "The token sequences",
    shows:
      "the token sequences: VLM prompt with image placeholders; policy sequence of time, conditioning, state and action tokens",
    stamp: "schematic",
  },
  "flow-matching": {
    title: "Noise carried to actions",
    shows: "noise carried to actions by a learned flow; step-count slider; two targets and mode averaging",
    stamp: "computed",
  },
  "action-chunks": {
    title: "Predict 15, execute 8, plan again",
    shows: "predict 15 actions, execute 8, re-plan: a timeline",
    stamp: "schematic",
  },
  copycat: {
    title: "Predicting the next action from the last",
    shows: "how much of the next action can be predicted from the previous action alone",
    stamp: "measured",
  },
  "grasp-map": {
    title: "Where the gripper closed",
    shows: "top-down map of where the gripper closed relative to the object, per policy",
    stamp: "measured",
  },
  tolerance: {
    title: "Grasp success against placement error",
    shows: "grasp success against placement error, per object",
    stamp: "measured",
  },
  "arm-replay": {
    title: "Replay of a rollout",
    shows: "a 3D replay of a rollout: gripper path, objects, the moment of closing",
    stamp: "measured",
  },
  timeline: {
    title: "The work that led to VLAs",
    shows: "the papers and systems that led to VLAs, on a time axis",
    stamp: "schematic",
  },
  onset: {
    title: "When a policy starts to look",
    shows:
      "success, how often the gripper closed at the named object, and the slope, against training samples, for several runs side by side: the point where a policy starts to look at the scene",
    stamp: "measured",
  },
  disturbance: {
    title: "The object is moved during the reach",
    shows:
      "a top-down replay of an episode in which the object is moved during the reach: the old place, the new place, and where the gripper closed",
    stamp: "measured",
  },
} as const satisfies Record<string, FigureInfo>;

export type FigureId = keyof typeof FIGURES;

/** Every figure id, in the order of the STYLE.md table. */
export const FIGURE_IDS = Object.keys(FIGURES) as FigureId[];

export function isFigureId(id: string): id is FigureId {
  return Object.hasOwn(FIGURES, id);
}

export const STAMP_LABEL: Record<Stamp, string> = {
  measured: "Measured",
  computed: "Computed",
  schematic: "Schematic",
};

/** What each stamp means, in the words used across the site. */
export const STAMP_MEANING: Record<Stamp, string> = {
  measured: "drawn from numbers in the lab notebook",
  computed: "the real algorithm running on a toy input",
  schematic: "an explanatory drawing",
};

/** A figure's "shows" text as a sentence. */
export function showsSentence(id: FigureId): string {
  const text: string = FIGURES[id].shows;
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
}
