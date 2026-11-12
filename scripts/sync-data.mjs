#!/usr/bin/env node
// Builds the data the site shows from an export of the experiments.
//
//   npm run sync:data                       from .data/export and .data/site_export
//   npm run sync:data -- /path/to/export    from another export
//   EXPORT_DIR=/path/to/export npm run sync:data
//   SITE_EXPORT_DIR=/path/to/site_export    the camera frames and the tokenisations, when they are
//                                           not in "site_export" next to the export
//
// The export is written in the tutorial repository by
//   python -m sim.pickup.export --out <dir>
// and holds runs.json (every run: progress, loss curve, one row per evaluation, probes, the
// expert), grasp/*.json (per-episode gripper and object positions), traces/*.json (rollouts, one
// record per control step) and tolerance.json. .data/ is not committed; what this script writes is:
//
//   src/data/generated/*.json   runs, evaluations by checkpoint, probes, the expert, loss curves,
//                               the notebook's comparison tables, grasp tolerance, tokenisations,
//                               the index of the public files
//   public/data/grasp/*.json    the per-episode files the figures draw
//   public/data/traces/*.json   a selection of the rollouts
//   public/data/index.json      the list of both, with the camera frames
//   public/tutorial/frames/     the camera frames
//
// Three rules decide what gets a value on the site:
//
//   1. A run in progress has none. A run is in progress when it is in IN_PROGRESS below, when the
//      notebook marks its table or its row "still training", or when the export says it has not
//      finished. The runs in LEFT_OUT are not shown at all.
//   2. An evaluation is shown when the lab notebook reports it. Rows by checkpoint are printed the
//      way the notebook prints them and looked up in its tables; the tables that compare runs
//      after the position fix are read cell by cell (NOTEBOOK_TABLES, BEFORE_AFTER); the other
//      probes and the expert are matched to the notebook row named for them in NOTEBOOK_ROWS. A
//      cell that disagrees with the export is reported, never resolved. What the notebook does
//      not report is listed at the end and left out, so the site never states a result the
//      notebook does not have.
//   3. Numbers that are only in the notebook live in src/data/notebook.json, copied by hand. This
//      script checks that file against the notebook: every quoted passage must still be there,
//      and every number of an entry must occur in the passages the entry quotes.
//
// Without an export the generated files are left as they are and only the checks run. With an
// export and no site export (or no tolerance.json), what was published from the missing part
// before stays as it is.
// Exit status: 0 all good, 2 something needs attention (it is printed), 1 the export cannot be read.

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  fixed,
  formatCount,
  formatMm,
  formatMs,
  formatPercent,
  formatSamples,
  formatSlope,
  formatWhole,
} from "../src/data/notebook-format.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/** A path as it is written in messages: relative to the repository when it is inside it. */
const here = (file) => {
  const relative = path.relative(root, file);
  return relative.startsWith("..") ? file : relative || ".";
};

// ================================================================ what to edit

/**
 * Runs in progress: the runs the notebook lists under "Runs in progress when this was written",
 * by their names in the export. A run on this list gets no values on the site, whatever the
 * export holds; one that is not in the export yet is listed as awaited. When the notebook
 * reports a run's result, take it off this list and run `npm run sync`. An empty list is fine.
 *
 * A run is in progress as well when the notebook marks its table or its row "still training",
 * or when the export says it has not finished.
 */
const IN_PROGRESS = [];

/** Runs of the export that are not shown at all, with the reason. */
const LEFT_OUT = {
  custom_vlm_legacy: "the VLM as trained before the position fix, kept for the record; custom_vlm is the one retrained after it",
  vla_tokens_pt1500_legacy: "stopped: trained with the position-table bug, rerun after the fix",
  vla_tokens_scratch_pt1500_legacy: "stopped: trained with the position-table bug, rerun after the fix",
  dp_vit_lang_pt4k_posfix: "never started",
};

/** Runs that were stopped before their budget and are reported as they stood, with the notebook's sentence. */
const STOPPED = {
  dp_vit_lang_pt4k: "The run was stopped at 3.0M samples.",
};

/** The notebook heading under which the runs in progress are listed. Only reported on; it may go. */
const NOTEBOOK_IN_PROGRESS_SECTION = "Runs in progress when this was written";

/**
 * Trained after the position fix: a name that ends in _posfix, and the runs listed here. A name
 * that ends in _legacy was trained with the old table, like every other run.
 */
const TRAINED_AFTER_FIX = ["custom_vlm"];

/**
 * Each run's label in the notebook's words, for the runs the notebook names in words rather than
 * by their recipe. The comparison tables after the fix name their rows with these words too, so
 * this is also how a row of such a table is attributed to a run. A run without words is labelled
 * from its name (src/data/labels.ts, runLabel).
 */
const RUN_WORDS = {
  dp_vit_lang_reactive_pt4k_posfix: "one instruction per layout",
  dp_vit_lang_reactive_pt4k_early_posfix: "early windows repeated",
  dp_vit_lang_reactive_cf4k_posfix: "every object named",
  dp_vit_lang_reactive_pt4k_recover_posfix: "recoveries",
  dp_vit_lang_reactive_pt4k_rs_posfix: "random starts",
  dp_vit_lang_reactive_pt4k_rs_recover_posfix: "random starts and recoveries",
  dp_vit_lang_reactive_pt4k_rs_recover_early_posfix: "random starts, recoveries, early windows repeated",
  dp_vit_lang_reactive_pt4k_seed43_posfix: "second seed, fixed table",
  dp_vit_lang_reactive_pt4k_seed43_legacy: "second seed, old table",
  dp_vit_lang_pt4k_hold_posfix: "history, demonstrations that begin with a hold frame",
  dp_vit_cube1k_posfix: "single cube with history, after the fix",
  dp_vit_lang_reactive_cube1k_posfix: "single cube without history, after the fix",
  vla_tokens_reactive_pt4k_posfix: "from-scratch VLA, pretrained backbone",
  vla_tokens_reactive_scratch_pt4k_posfix: "from-scratch VLA, randomly initialised backbone",
  vla_qwen_pt1500: "Qwen backbone, one action-token vector, with history",
  vla_qwen_tokens_reactive_pt4k_posfix: "Qwen backbone, every token",
  custom_vlm: "vision-language model, from scratch, retrained after the fix",
};

/** Other words a comparison table uses for a run in its first column. */
const TABLE_WORDS = {
  "before the fix, plain demonstrations": "dp_vit_lang_reactive_pt4k",
  "before the fix, one instruction per layout": "dp_vit_lang_reactive_pt4k",
};

/**
 * The family a run belongs to, for the selectors of pages and figures, when the rule in
 * familyOf() below does not give the right one.
 */
const FAMILY = {};

/**
 * How a run's name is read: <policy>_<data>[_<variant>...][_seed<n>][_<budget>][_posfix|_legacy],
 * for example dp_vit_lang_reactive_pt4k_rs_posfix. The longest policy name that fits is taken.
 *
 *   family        "policy" (the flow-matching policy on the patch tokens of a small ViT),
 *                 "vla", or one of the from-scratch stages
 *   language      the instruction is an input
 *   history       the previous frame, the previous state and the previous action are inputs
 *   conditioning  for a VLA: one vector for the action head, or every token of the backbone
 */
const POLICIES = {
  dp_vit_lang_reactive: { family: "policy", language: true, history: false },
  dp_vit_reactive: { family: "policy", language: false, history: false },
  dp_vit_lang: { family: "policy", language: true, history: true },
  dp_vit: { family: "policy", language: false, history: true },
  vla_qwen: { family: "vla", backbone: "qwen", language: true, history: true, conditioning: "vector" },
  vla_qwen_tokens_reactive: { family: "vla", backbone: "qwen", language: true, history: false, conditioning: "tokens" },
  vla_tokens_scratch_reactive: { family: "vla", backbone: "scratch_random", language: true, history: false, conditioning: "tokens" },
  vla_tokens_reactive_scratch: { family: "vla", backbone: "scratch_random", language: true, history: false, conditioning: "tokens" },
  vla_tokens_reactive: { family: "vla", backbone: "scratch", language: true, history: false, conditioning: "tokens" },
  vla_tokens_scratch: { family: "vla", backbone: "scratch_random", language: true, history: true, conditioning: "tokens" },
  vla_tokens: { family: "vla", backbone: "scratch", language: true, history: true, conditioning: "tokens" },
  custom_llm: { family: "language_model" },
  custom_vlm: { family: "vlm" },
};

/** The data part of a run's name, and the dataset it stands for in the notebook's "Datasets" table. */
const DATASETS = {
  pt1500: "pick_target_1500",
  pt4k: "pick_target_4k",
  cf: "pick_target_cf",
  cf4k: "pick_target_cf4k",
  cube1k: "pick_cube_1k",
};

/** Variants of a dataset: the name part is appended to the dataset's name, and says this about the demonstrations. */
const DATA_VARIANTS = {
  early: "early_windows", // the windows that start in the first frames are repeated
  recover: "recoveries", // the object is moved in some episodes and the expert plans again
  rs: "random_start", // every episode starts from a random gripper pose
  hold: "hold_frame", // every episode begins with a frame of the robot at rest
};

/**
 * Where the notebook reports each probe that is not in one of the comparison tables below: an
 * evaluation of one checkpoint under other conditions (frozen cameras, an expert prefix, a
 * disturbance, other sampler settings). Keys are the names the export gives the conditions;
 * "plain" is the checkpoint itself under the default conditions, the row each family of probes
 * is compared with.
 *
 *   section   the notebook heading the row is under
 *   row       the row, as the notebook writes it
 *   shows     which of this evaluation's numbers the row holds (see SHOWN); each one, printed
 *             the notebook's way, must occur in the row
 */
const NOTEBOOK_ROWS = {
  expert: {
    plain: [
      {
        section: "The scripted expert",
        row: "| Expert through the evaluation loop, `pick_target`, 100 layouts (machine B) | 100/100, gripper closes 5 mm (median) from the object, 98% within 10 mm |",
        shows: ["success", "miss", "within10"],
      },
    ],
  },
  dp_vit_lang_pt4k: {
    plain: [
      {
        checkpoint: 5,
        weights: "ema",
        section: "What the history policy depends on",
        row: "| as served: the previous action sent with the first query is the hold command | 1/100 | 30% | 186 mm |",
        shows: ["success", "named", "miss"],
      },
    ],
    probe_first_prev_expert: [
      {
        section: "What the history policy depends on",
        row: "| the previous action sent with the first query is the expert's first command | 22/100 | 97% | 25 mm |",
        shows: ["success", "named", "miss"],
      },
    ],
    probe_prefix10_named: [
      {
        section: "What the history policy depends on",
        row: "| the expert drives the first 10 steps, then the policy takes over | 77/100 | 100% | 12 mm |",
        shows: ["success", "named", "miss"],
      },
    ],
  },
  dp_vit_lang_reactive_pt4k: {
    plain: [
      {
        checkpoint: 11,
        weights: "ema",
        section: "What the no-history policy depends on",
        row: "| as trained | 85/100 | 100% | 7 mm | |",
        shows: ["success", "named", "miss"],
      },
      {
        section: "Inference settings",
        row: "| 10 | 85/100, 83/100 | 71 ms |",
        shows: ["success"],
      },
      {
        section: "Inference settings",
        row: "| 8 | 85/100 | 15/23 | 80/100 |",
        shows: ["success", "tblock"],
      },
    ],
    probe_stale_images: [
      {
        section: "What the no-history policy depends on",
        row: "| the first frame's images are sent for the whole episode | 1/100 | 99% | 17 mm | |",
        shows: ["success", "named", "miss"],
      },
    ],
    probe_prefix10_distractor: [
      {
        section: "What the no-history policy depends on",
        row: "| the expert drives the first 10 steps toward another object, then the policy takes over | 12/100 | 74% | 64 mm | closed at the object the expert was heading for: 16/100 |",
        shows: ["success", "named", "miss", "goal"],
      },
    ],
    probe_prefix25_distractor: [
      {
        section: "What the no-history policy depends on",
        row: "| the expert drives the first 25 steps toward another object, then the policy takes over | 0/100 | 0% | 209 mm | closed at the object the expert was heading for: 100/100 |",
        shows: ["success", "named", "miss", "goal"],
      },
    ],
    disturb_reach10: [
      {
        section: "Disturbances",
        row: "| at step 10 of the reach | 9/100 | 39 mm | 49 mm | 43/100 |",
        shows: ["moved", "old", "new", "retried"],
      },
    ],
    disturb_reach20: [
      {
        section: "Disturbances",
        row: "| at step 20 | 0/96 | 8 mm | 78 mm | 31/96 |",
        shows: ["moved", "old", "new", "retried"],
      },
    ],
    disturb_reach30: [
      {
        section: "Disturbances",
        row: "| at step 30 | 0/99 | 7 mm | 81 mm | 28/99 |",
        shows: ["moved", "old", "new", "retried"],
      },
    ],
    disturb_reach20_40mm: [
      {
        section: "Disturbances",
        row: "| at step 20, by 40 mm | 1/17 | 18 mm | 35 mm | 9/17 |",
        shows: ["moved", "old", "new", "retried"],
      },
    ],
    disturb_reach20_120mm: [
      {
        section: "Disturbances",
        row: "| at step 20, by 120 mm | 0/99 | 9 mm | 116 mm | 35/99 |",
        shows: ["moved", "old", "new", "retried"],
      },
    ],
    disturb_grasp: [
      {
        section: "Disturbances",
        row: "| at the moment the gripper first closes | 1/99 | - | - | 29/99 |",
        shows: ["moved", "retried"],
      },
    ],
    sweep_h8_s1: [{ section: "Inference settings", row: "| 1 | 61/100 | 21 ms |", shows: ["success", "latency"] }],
    sweep_h8_s2: [{ section: "Inference settings", row: "| 2 | 89/100, 90/100 | 25 ms |", shows: ["success", "latency"] }],
    sweep_h8_s4: [{ section: "Inference settings", row: "| 4 | 88/100, 86/100 | 32 ms |", shows: ["success", "latency"] }],
    sweep_h8_s20: [{ section: "Inference settings", row: "| 20 | 79/100 | 87 ms |", shows: ["success", "latency"] }],
    seeds2_h8_s2: [{ section: "Inference settings", row: "| 2 | 89/100, 90/100 | 25 ms |", shows: ["success"] }],
    seeds2_h8_s4: [{ section: "Inference settings", row: "| 4 | 88/100, 86/100 | 32 ms |", shows: ["success"] }],
    seeds2_h8_s10: [
      { section: "Inference settings", row: "| 10 | 85/100, 83/100 | 71 ms |", shows: ["success"] },
      {
        section: "4000 demonstrations, no history (`dp_vit_lang_reactive_pt4k`)",
        row: "A second set of 100 layouts (seeds 1,000,100-1,000,199), same checkpoint: 83/100.",
        shows: ["success"],
      },
    ],
    sweep_h2_s10: [{ section: "Inference settings", row: "| 2 | 76/100 | 8/23 | 39/100 |", shows: ["success", "tblock"] }],
    sweep_h4_s10: [{ section: "Inference settings", row: "| 4 | 84/100 | 11/23 | 55/100 |", shows: ["success", "tblock"] }],
    sweep_h16_s10: [
      { section: "Inference settings", row: "| 15 (the whole chunk) | 84/100 | 16/23 | - |", shows: ["success", "tblock"] },
    ],
    noise_episode_h2: [{ section: "Inference settings", row: "| 2 | 76/100 | 8/23 | 39/100 |", shows: ["success"] }],
    noise_episode_h4: [{ section: "Inference settings", row: "| 4 | 84/100 | 11/23 | 55/100 |", shows: ["success"] }],
    noise_episode_h8: [{ section: "Inference settings", row: "| 8 | 85/100 | 15/23 | 80/100 |", shows: ["success"] }],
  },
};

/**
 * The tables after the position fix that compare several runs, read cell by cell. A table is
 * found in its section by header cells it has (`has`) and lacks (`lacks`). Its rows are
 * attributed to runs by the words of their first cell (RUN_WORDS, TABLE_WORDS; a trailing
 * "(`dataset`)" is ignored), the expert's rows by EXPERT_WORDS. A row the script cannot
 * attribute, or a column it does not know, is reported.
 *
 *   samples      a column per number of training samples: success with trained / averaged weights
 *                ("8% / -" where none were saved), and the best checkpoint
 *   named        a column per number of training samples: "closed at the named object, slope", of
 *                the trained weights (the averaged ones where only those exist)
 *   objects      success by object, pooled over the last `pooled` checkpoints, every weights saved
 *   conditions   a column per set of conditions (CONDITION_COLUMNS), the final checkpoint, with the
 *                averaged weights where they were saved
 *   expert       the scripted expert under the same conditions
 *
 * In a samples column, a number of samples stands for the last checkpoint that prints as it.
 */
const NOTEBOOK_TABLES = [
  { id: "demonstrations", layout: "samples", section: "What the demonstrations contain", has: ["Best checkpoint"] },
  { id: "demonstrationsNamed", layout: "named", section: "What the demonstrations contain", has: ["0.5M"], lacks: ["Best checkpoint"] },
  { id: "demonstrationsObjects", layout: "objects", section: "What the demonstrations contain", has: ["Can", "T block"], pooled: 3 },
  { id: "outside", layout: "conditions", section: "How each policy copes outside the conditions it was trained in", has: ["Standard", "Second set of layouts"] },
  { id: "dependsOn", layout: "conditions", section: "How each policy copes outside the conditions it was trained in", has: ["Cameras frozen on the first frame"] },
  { id: "expert", layout: "expert", section: "How each policy copes outside the conditions it was trained in", has: ["Expert"] },
];

/** The columns of the conditions tables, by the notebook's words, and the export's name for those conditions. */
const CONDITION_COLUMNS = {
  Standard: "plain",
  "Second set of layouts": "seeds2_h8_s10",
  "Random start": "random_start",
  "Moved at step 10": "disturb_reach10",
  "Moved at step 20": "disturb_reach20",
  "Moved at step 30": "disturb_reach30",
  "Moved at the grasp": "disturb_grasp",
  "Random start, moved at step 20": "random_start_disturb_reach20",
  "Random start, moved at the grasp": "random_start_disturb_grasp",
  "Cameras frozen on the first frame": "probe_stale_images",
  "Expert drives 10 steps toward another object": "probe_prefix10_distractor",
  "Expert drives 25 steps toward another object": "probe_prefix25_distractor",
  "2 flow steps": "sweep_h8_s2",
};

/** The rows of the expert's table: one plan per episode, or planning again. */
const EXPERT_WORDS = {
  "one plan per episode": false,
  "plans again": true,
};

/** The expert's name for a set of conditions: "random_start", "plans_again_random_start", "plans_again". */
const expertVariant = (variant, plansAgain) =>
  plansAgain ? (variant === "plain" ? "plans_again" : `plans_again_${variant}`) : variant;

/**
 * The same recipe trained with the old position table ("before") and the fixed one ("after"),
 * compared checkpoint by checkpoint in one table:
 *
 *   before_after   a cell per quantity, "before / after": success, closed at the named object,
 *                  slope, median miss, with the weights both runs saved (`weights`)
 *   old_fixed      a column per quantity and table ("Success, old table", "fixed", ...), each
 *                  cell "trained / averaged"; `words` says which word stands for which run
 *
 * A sentence after the table that says "still training" marks the run it names ("the run with
 * the fixed table"), or both.
 */
const PAIR_TABLES = [
  {
    layout: "before_after",
    section: "The same run before and after the fix",
    before: "dp_vit_lang_reactive_pt4k",
    after: "dp_vit_lang_reactive_pt4k_posfix",
    weights: ["raw"],
  },
  {
    layout: "old_fixed",
    section: "A second seed, with and without the fix",
    before: "dp_vit_lang_reactive_pt4k_seed43_legacy",
    after: "dp_vit_lang_reactive_pt4k_seed43_posfix",
    words: { before: "old", after: "fixed" },
    weights: ["raw", "ema"],
  },
];

/** Where the notebook reports a finished run that has no evaluations by checkpoint. */
const NOTEBOOK_RUNS = {
  custom_llm: [
    {
      section: "From-scratch stages on machine B",
      row: "Language model final loss 4.15.",
      shows: ["loss"],
    },
  ],
  custom_vlm: [
    {
      section: "From-scratch stages on machine B",
      row: "The VLM retrained after the fix (same data and budget): final loss 0.059",
      shows: ["loss3"],
    },
  ],
};

/** The numbers a notebook row can hold, printed the way the notebook prints them. */
const SHOWN = {
  success: (row) => formatCount(row.successes, row.episodes),
  named: (row) => formatPercent(row.named),
  miss: (row) => formatMm(row.missMm),
  within10: (row) => `${formatPercent(row.within10)} within 10 mm`,
  latency: (row) => formatMs(row.latencyMs),
  tblock: (row) => formatCount(row.perObject.tblock.successes, row.perObject.tblock.episodes),
  goal: (row) => formatCount(row.prefixGoal.count, row.prefixGoal.episodes),
  moved: (row) => formatCount(row.moved.successes, row.moved.episodes),
  old: (row) => formatMm(row.moved.fromOldMm),
  new: (row) => formatMm(row.moved.fromNewMm),
  retried: (row) => formatCount(row.moved.retried, row.moved.episodes),
  loss: (run) => fixed(run.finalLoss, 2),
  loss3: (run) => fixed(run.finalLoss, 3),
};

/**
 * The per-episode files the figures draw (public/data/grasp). Each file is about 30 kB, so only
 * the evaluations a figure shows are published:
 *
 *   at       checkpoints, as training samples ("final" for the last one); the reported
 *            checkpoint nearest to each is taken
 *   weights  which weights of those checkpoints (default: every reported one)
 *   probes   the kinds of probe whose episodes are published too
 */
const PUBLISHED_EPISODES = [
  // The reference for every map.
  { run: "expert", variants: ["plain"] },
  // One policy that fails: no language, with history. Where it closes does not depend on the scene.
  { run: "dp_vit_pt1500", at: ["final"] },
  // The policy that works, before, during and after it starts to look at the scene.
  { run: "dp_vit_lang_reactive_pt4k", at: [1.0e6, 2.0e6, 5.0e6], probes: ["intervention", "disturbance"] },
  // The policy with history, as served and with the expert's help at the start.
  { run: "dp_vit_lang_pt4k", at: [2.5e6], weights: ["ema"], probes: ["intervention"] },
  // After the position fix: the reference recipe and what the demonstrations contain.
  { run: "dp_vit_lang_reactive_pt4k_posfix", at: ["final"] },
  { run: "dp_vit_lang_reactive_pt4k_early_posfix", at: ["final"] },
  { run: "dp_vit_lang_reactive_pt4k_rs_posfix", at: ["final"] },
  { run: "dp_vit_lang_reactive_pt4k_recover_posfix", at: ["final"] },
];

/**
 * The rollouts published (public/data/traces), so a reader can compare actors on the same
 * layouts: for every condition a rollout exists for, the same episodes of each of these actors
 * ("expert" is the scripted expert, with one plan and planning again). `episodes` is how many:
 * the first number always, the second when the extra one gives an actor both a success and a
 * failure, or the condition a success or a failure it did not have.
 */
const PUBLISHED_TRACES = {
  actors: [
    "dp_vit_lang_reactive_pt4k",
    "dp_vit_lang_reactive_pt4k_posfix",
    "dp_vit_lang_reactive_pt4k_rs_posfix",
    "dp_vit_lang_reactive_pt4k_recover_posfix",
    "expert",
  ],
  episodes: [3, 4],
};

/** Upper bounds on what public/data may weigh, in bytes. */
const PUBLIC_LIMITS = { traces: 6e6, all: 9e6 };

// ================================================================ files

const NOTEBOOK = path.join(root, "content", "lab-notebook.md");
const HAND_FILE = path.join(root, "src", "data", "notebook.json");
const GENERATED = path.join(root, "src", "data", "generated");
const PUBLIC_DATA = path.join(root, "public", "data");
const FRAMES = path.join(root, "public", "tutorial", "frames");

const exportDir = path.resolve(root, process.argv[2] ?? process.env.EXPORT_DIR ?? ".data/export");
const siteExportDir = path.resolve(root, process.env.SITE_EXPORT_DIR ?? path.join(path.dirname(exportDir), "site_export"));

const problems = [];
const problem = (text) => problems.push(text);
const say = (label, text) => console.log(`${label.padEnd(13)}${text}`);
const more = (text) => console.log(`${"".padEnd(13)}${text}`);

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

/** JSON with one entry per line down to `depth` levels and compact below: short files, readable diffs. */
function stringify(value, depth) {
  const lines = (value, level, indent) => {
    if (level === 0 || value === null || typeof value !== "object") return JSON.stringify(value);
    const inner = `${indent}  `;
    if (Array.isArray(value)) {
      if (value.length === 0) return "[]";
      return `[\n${value.map((item) => inner + lines(item, level - 1, inner)).join(",\n")}\n${indent}]`;
    }
    const entries = Object.entries(value).filter(([, item]) => item !== undefined);
    if (entries.length === 0) return "{}";
    return `{\n${entries.map(([key, item]) => `${inner}${JSON.stringify(key)}: ${lines(item, level - 1, inner)}`).join(",\n")}\n${indent}}`;
  };
  return `${lines(value, depth, "")}\n`;
}

const written = { added: 0, updated: 0, unchanged: 0, removed: 0 };

/** Writes a file when its content differs, so an unchanged sync touches nothing. */
function write(file, data) {
  const buffer = typeof data === "string" ? Buffer.from(data, "utf8") : data;
  if (existsSync(file)) {
    if (readFileSync(file).equals(buffer)) {
      written.unchanged += 1;
      return;
    }
    writeFileSync(file, buffer);
    written.updated += 1;
    return;
  }
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, buffer);
  written.added += 1;
}

/** Removes the files of a generated folder that this run did not write. */
function prune(folder, keep, extension) {
  if (!existsSync(folder)) return;
  for (const name of readdirSync(folder)) {
    if (!name.endsWith(extension) || keep.has(name)) continue;
    rmSync(path.join(folder, name));
    written.removed += 1;
  }
}

// ================================================================ the notebook

/** The cells of a Markdown table line, trimmed. */
function cellsOf(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

/** The tables in a section's lines: header cells, rows of cells, and the text that follows each. */
function tablesIn(lines) {
  const tables = [];
  let current;
  for (const line of lines) {
    if (/^\s*\|/.test(line)) {
      if (!current) {
        current = { index: tables.length, header: null, rows: [], after: "" };
        tables.push(current);
      }
      const cells = cellsOf(line);
      if (cells.every((cell) => /^:?-{3,}:?$/.test(cell))) continue;
      if (!current.header) current.header = cells;
      else current.rows.push({ index: current.rows.length, cells, text: flat(line) });
      continue;
    }
    current = undefined;
    if (tables.length > 0) tables.at(-1).after += ` ${line}`;
  }
  for (const table of tables) table.after = flat(table.after);
  return tables;
}

/** The notebook as one line of text, and its sections (the text under each heading, as one line, and its tables). */
function readNotebook() {
  if (!existsSync(NOTEBOOK)) return undefined;
  const text = readFileSync(NOTEBOOK, "utf8");
  const sections = [];
  let current = { level: 1, title: "", parent: "", lines: [] };
  let chapter = "";
  for (const line of text.split(/\r?\n/)) {
    const heading = /^(#{1,3})\s+(.+?)\s*$/.exec(line);
    if (!heading) {
      current.lines.push(line);
      continue;
    }
    sections.push(current);
    const level = heading[1].length;
    if (level <= 2) chapter = heading[2];
    current = { level, title: heading[2], parent: level === 3 ? chapter : "", lines: [] };
  }
  sections.push(current);
  return {
    flat: flat(text),
    sections: sections.map(({ lines, ...section }, index) => ({
      ...section,
      index,
      body: flat(lines.join("\n")),
      tables: tablesIn(lines),
    })),
  };
}

function flat(text) {
  return text.replace(/\s+/g, " ").trim();
}

/** The sections whose own text contains a passage, in the notebook's order. */
function sectionsWith(notebook, passage) {
  const wanted = flat(passage);
  return notebook.sections.filter((section) => section.body.includes(wanted));
}

/** "A" or "B" when a section, or the section it is part of, names the machine in its title. */
function machineOf(section) {
  const named = /machine ([AB])\b/i.exec(`${section.title} ${section.parent}`);
  return named ? named[1].toUpperCase() : undefined;
}

/** Whether `token` occurs in `text` as a number of its own, not as the tail or head of a longer one. */
function hasToken(text, token) {
  for (let at = text.indexOf(token); at !== -1; at = text.indexOf(token, at + 1)) {
    const before = at === 0 ? " " : text[at - 1];
    const after = text[at + token.length] ?? " ";
    if (!/[\d./-]/.test(before) && !/\d/.test(after)) return true;
  }
  return false;
}

/** A position in the notebook, for ordering: section, table, row. */
const positionOf = (section, table = { index: 0 }, row = { index: 0 }) => section.index * 1e6 + table.index * 1e3 + row.index;

/** "0.15M", "1.50M (final)": the number of samples a cell states, its decimals, and whether it says "(final)". */
function samplesCell(cell) {
  const match = /^(\d+(?:\.\d+)?)M( \(final\))?$/.exec(cell);
  if (!match) return undefined;
  return { value: Number(match[1]) * 1e6, digits: (match[1].split(".")[1] ?? "").length, final: Boolean(match[2]) };
}

/** Whether a samples cell can stand for a checkpoint: the same number at the cell's precision, "(final)" only for the final one. */
function fitsSamples(cell, row) {
  const stated = samplesCell(cell);
  if (!stated) return false;
  if (stated.final && !row.final) return false;
  return Math.abs(stated.value - row.samples) <= 0.5 * 10 ** -stated.digits * 1e6 + 1;
}

/** The words of a comparison table's first cell, without a trailing "(`dataset`)". */
const rowWords = (cell) => cell.replace(/\s*\(`[^`]*`\)\s*$/, "").trim();

/** The run a comparison table's row names. */
function runOfWords(words) {
  if (words in TABLE_WORDS) return TABLE_WORDS[words];
  return Object.entries(RUN_WORDS).find(([, text]) => text === words)?.[0];
}

// ================================================================ the hand-maintained file

/** The numbers written in a passage: "65,391" is 65391, "1_000_000" is 1000000, "0.03-0.04" is 0.03 and 0.04. */
function numbersIn(text) {
  const found = [];
  for (const match of text.matchAll(/\d[\d,_]*(?:\.\d+)?/g)) {
    const digits = match[0].replace(/[,_]+$/, "");
    const value = Number(digits.replace(/[,_]/g, ""));
    if (Number.isNaN(value)) continue;
    // A minus sign counts when nothing but a space, a bar or a bracket stands in front of it.
    const sign = text[match.index - 1] === "-" && /^[\s|(]?$/.test(text[match.index - 2] ?? "");
    found.push(sign ? -value : value);
  }
  return found;
}

/**
 * Checks src/data/notebook.json against the notebook: every quote is in the notebook, and every
 * number stands in a quote of its own entry (the nearest object around it that has quotes).
 */
function checkHandFile(notebook) {
  if (!existsSync(HAND_FILE)) return;
  const data = readJson(HAND_FILE);
  const quotes = new Set();
  let numbers = 0;

  const walk = (value, trail, cited) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${trail}[${index}]`, cited));
      return;
    }
    if (value && typeof value === "object") {
      const own = Array.isArray(value.quotes) ? value.quotes.filter((quote) => typeof quote === "string") : undefined;
      if (own) for (const quote of own) quotes.add(quote);
      const cites = own ? own.flatMap(numbersIn) : cited;
      for (const [key, item] of Object.entries(value)) {
        if (key !== "quotes") walk(item, trail ? `${trail}.${key}` : key, cites);
      }
      return;
    }
    if (typeof value !== "number") return;
    numbers += 1;
    if (!cited) problem(`${here(HAND_FILE)}: ${trail} = ${value} has no quoted passage around it.`);
    else if (!cited.some((number) => Math.abs(number - value) < 1e-9)) {
      problem(`${here(HAND_FILE)}: ${trail} = ${value} is not in the passages its entry quotes.`);
    }
  };
  walk(data, "", undefined);

  const missing = [...quotes].filter((quote) => !notebook.flat.includes(flat(quote)));
  for (const quote of missing) problem(`${here(HAND_FILE)}: no longer in the notebook: "${quote}"`);
  say("Notebook", `${here(HAND_FILE)}: ${quotes.size} quoted passages, ${numbers} numbers checked against them.`);
}

// ================================================================ reading the export

const pair = (a, b) => `${a} / ${b}`;

/** The four value cells of a checkpoint row, as the notebook's tables print them. */
function checkpointCells(row) {
  const { raw, ema } = row;
  return `| ${pair(formatPercent(raw.rate), formatPercent(ema.rate))} | ${pair(formatPercent(raw.named), formatPercent(ema.named))} | ${pair(formatSlope(raw.slope), formatSlope(ema.slope))} | ${pair(formatWhole(raw.missMm), formatWhole(ema.missMm))} mm |`;
}

/** The same four cells for one set of weights, as a table of the trained weights alone prints them. */
const singleCells = (evaluation) => [
  formatPercent(evaluation.rate),
  formatPercent(evaluation.named),
  formatSlope(evaluation.slope),
  formatMm(evaluation.missMm),
];

const count = (value) => ({ successes: value.successes, episodes: value.episodes });

/** One evaluation in the site's field names. Numbers keep the precision of the export. */
function evaluation(source) {
  return {
    successes: source.successes,
    episodes: source.episodes,
    rate: source.success_rate,
    ci: source.ci95,
    named: source.at_named_object ?? null,
    slope: source.close_slope ?? null,
    missMm: source.median_miss_named_mm ?? null,
    missNearestMm: source.median_miss_nearest_mm ?? null,
    within10: source.within_10mm ?? null,
    within20: source.within_20mm ?? null,
    wrongObject: source.wrong_object_rate ?? null,
    retried: source.retried_rate ?? null,
    perObject: Object.fromEntries(Object.entries(source.per_target ?? {}).map(([name, value]) => [name, count(value)])),
  };
}

/** Episodes with a second grasp attempt, from the export's share; null where it has none. */
function secondAttempts(source, label) {
  if (source.retried_rate === null || source.retried_rate === undefined) return null;
  const value = source.retried_rate * source.episodes;
  if (Math.abs(value - Math.round(value)) > 1e-6) {
    problem(`${label}: a second attempt in ${value} of ${source.episodes} episodes is not a whole number.`);
    return null;
  }
  return Math.round(value);
}

/** The conditions of an evaluation, with eval.py's defaults where an older result does not record one. */
function settings(source) {
  const set = source.interventions ?? {};
  return {
    execHorizon: source.exec_horizon ?? null,
    flowSteps: source.flow_steps ?? null,
    noise: source.noise ?? "fresh",
    randomStart: Boolean(source.random_start),
    seedStart: source.seed_start ?? null,
    expertPrefix: set.expert_prefix ?? 0,
    prefixTarget: set.prefix_target ?? null,
    staleImages: Boolean(set.stale_images),
    firstPrevAction: set.first_prev_action ?? "hold",
    disturb: set.disturb ?? "none",
    disturbStep: set.disturb_step ?? null,
    disturbMm: set.disturb_mm ?? null,
  };
}

/** What a set of conditions asks of the scene and the start, leaving the sampler out: the same for a policy and for the expert. */
function conditionKey(set, defaults) {
  return JSON.stringify([
    set.randomStart,
    set.seedStart ?? defaults.seedStart,
    set.expertPrefix,
    set.prefixTarget,
    set.staleImages,
    set.firstPrevAction,
    set.disturb,
    set.disturbStep,
    set.disturbMm,
  ]);
}

/**
 * How the episodes went in which the object was actually moved. The distances from the old and the
 * new place say where the gripper closed after a move during the reach. When the object is moved as
 * the gripper closes, the gripper had already arrived, and the notebook leaves those cells empty.
 */
function moved(source) {
  if (!source.moved) return null;
  const duringReach = (source.interventions ?? {}).disturb === "reach";
  return {
    successes: source.moved.successes,
    episodes: source.moved.episodes,
    retried: source.moved.retried,
    fromOldMm: duringReach ? (source.moved.median_mm_from_old_place ?? null) : null,
    fromNewMm: duringReach ? (source.moved.median_mm_from_new_place ?? null) : null,
  };
}

/** What kind of question a set of conditions asks. */
function kindOf(set, defaults) {
  if (set.disturb !== "none") return "disturbance";
  if (set.staleImages || set.expertPrefix > 0 || set.firstPrevAction !== "hold") return "intervention";
  if (set.randomStart) return "start";
  if (set.execHorizon !== defaults.execHorizon || set.flowSteps !== defaults.flowSteps || set.noise !== "fresh") return "sampler";
  if (set.seedStart !== defaults.seedStart) return "layouts";
  return "baseline";
}

/** The value most of the rows have. */
function mostCommon(values) {
  const tally = new Map();
  for (const value of values) if (value !== null && value !== undefined) tally.set(value, (tally.get(value) ?? 0) + 1);
  return [...tally].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

/** What a run's name says about it (see POLICIES); the number of demonstrations comes from the notebook's table. */
function designOf(name, datasets) {
  const suffix = /_(posfix|legacy)$/.exec(name)?.[1];
  const positionFix = suffix === "posfix" || TRAINED_AFTER_FIX.includes(name);
  const stem = suffix ? name.slice(0, -suffix.length - 1) : name;
  const policy = Object.keys(POLICIES)
    .sort((a, b) => b.length - a.length)
    .find((candidate) => stem === candidate || stem.startsWith(`${candidate}_`));
  const design = {
    family: null,
    policy: policy ?? null,
    backbone: null,
    language: null,
    history: null,
    conditioning: null,
    dataset: null,
    demos: null,
    traits: [],
    budget: null,
    seed: null,
    positionFix,
  };
  if (!policy) {
    problem(`${name}: the name starts with no policy that POLICIES knows; the run is labelled with its name.`);
    return design;
  }
  Object.assign(design, POLICIES[policy]);

  const parts = stem.slice(policy.length + 1).split("_").filter(Boolean);
  const unread = [];
  for (const part of parts) {
    if (design.dataset === null && part in DATASETS) design.dataset = DATASETS[part];
    else if (design.dataset !== null && part in DATA_VARIANTS) {
      design.dataset += `_${part}`;
      design.traits.push(DATA_VARIANTS[part]);
    } else if (/^\d+(\.\d+)?M$/.test(part)) design.budget = part;
    else if (/^seed\d+$/.test(part)) design.seed = Number(part.slice(4));
    else unread.push(part);
  }
  if (unread.length > 0) problem(`${name}: "${unread.join("_")}" in the name is not understood (see DATASETS and DATA_VARIANTS).`);
  if (design.dataset) {
    if (/^pick_target_cf/.test(design.dataset)) design.traits.unshift("every_object_named");
    const row = datasets.find((candidate) => candidate.name === design.dataset);
    if (row) design.demos = row.episodes;
    else problem(`${name}: the dataset ${design.dataset} is not in the "Datasets" table of ${here(HAND_FILE)}.`);
  }
  return design;
}

/**
 * The family a run belongs to:
 *
 *   reference       the recipe that works: language, no history, one instruction per layout, the larger dataset
 *   demonstrations  the same policy on demonstrations that differ in what they contain
 *   history         the policy with history on the larger dataset
 *   single_cube     the single cube
 *   backbones       the from-scratch stages and the VLAs
 *   first_round     the first comparisons of inputs and training budget, on the smaller dataset
 */
function familyOf(name, design) {
  if (name in FAMILY) return FAMILY[name];
  if (design.family === null) return null;
  if (design.family !== "policy") return "backbones";
  if (design.dataset?.startsWith("pick_cube")) return "single_cube";
  const larger = design.demos !== null && design.demos >= 4000;
  if (design.history) return larger ? "history" : "first_round";
  if (design.traits.length > 0) return "demonstrations";
  return design.language && larger ? "reference" : "first_round";
}

/** The task a run is evaluated on: the one its dataset is recorded on. */
function taskOf(run, design) {
  const named = design.dataset ? /^pick_(?:cube|target)/.exec(design.dataset)?.[0] : undefined;
  const evaluated = mostCommon([...run.evaluations, ...run.probes].map((row) => row.task));
  if (named && evaluated && named !== evaluated) {
    problem(`${run.name}: its name says ${named}, its evaluations are on ${evaluated}.`);
  }
  return evaluated ?? named ?? null;
}

/** Everything the export holds, in the site's shape. Nothing is left out here except the runs in LEFT_OUT. */
function readExport() {
  const source = readJson(path.join(exportDir, "runs.json"));
  const datasets = existsSync(HAND_FILE) ? (readJson(HAND_FILE).datasets?.rows ?? []) : [];
  const everyRow = [...source.runs.flatMap((run) => run.probes), ...(source.expert ?? [])];
  const defaults = {
    execHorizon: mostCommon(everyRow.map((row) => row.exec_horizon)),
    flowSteps: mostCommon(everyRow.map((row) => row.flow_steps)),
    seedStart: mostCommon(everyRow.map((row) => row.seed_start)),
    episodes: mostCommon([...source.runs.flatMap((run) => run.evaluations), ...everyRow].map((row) => row.episodes)),
  };

  const leftOut = [];
  const runs = [];
  for (const run of source.runs) {
    if (run.name in LEFT_OUT) {
      leftOut.push(run.name);
      continue;
    }

    const byCheckpoint = new Map();
    for (const row of run.evaluations) {
      if (!byCheckpoint.has(row.checkpoint)) byCheckpoint.set(row.checkpoint, {});
      byCheckpoint.get(row.checkpoint)[row.weights] = row;
    }
    const sampleCount = (number) => {
      const rows = byCheckpoint.get(number) ?? {};
      return rows.raw?.samples ?? rows.ema?.samples ?? null;
    };
    const checkpoints = [...byCheckpoint]
      .sort((a, b) => a[0] - b[0])
      .map(([number, rows]) => ({
        checkpoint: number,
        samples: sampleCount(number),
        final: sampleCount(number) === run.samples_total,
        raw: rows.raw ? { ...evaluation(rows.raw), source: rows.raw.grasp_file } : null,
        ema: rows.ema ? { ...evaluation(rows.ema), source: rows.ema.grasp_file } : null,
      }));

    const probes = run.probes.map((row) => ({
      variant: row.variant,
      checkpoint: row.checkpoint,
      weights: row.weights,
      samples: sampleCount(row.checkpoint),
      task: row.task,
      settings: settings(row),
      ...evaluation(row),
      secondAttempts: secondAttempts(row, `${run.name} / ${row.variant}`),
      latencyMs: row.latency_ms ?? null,
      moved: moved(row),
      prefixGoal: row.closed_at_prefix_goal && settings(row).expertPrefix > 0 ? { ...row.closed_at_prefix_goal } : null,
      source: row.grasp_file,
      traceFiles: row.trace_files ?? [],
    }));

    // The best evaluation of the run: the highest success, the earliest checkpoint among equals.
    let best;
    for (const row of run.evaluations) if (!best || row.success_rate > best.success_rate) best = row;

    const design = designOf(run.name, datasets);
    runs.push({
      name: run.name,
      state: run.state,
      design,
      task: taskOf(run, design),
      samplesPlanned: run.samples_total,
      samplesSeen: run.samples_seen,
      finalLoss: run.loss ?? null,
      curve: run.loss_curve ?? [],
      checkpoints,
      probes,
      best: best
        ? {
            checkpoint: best.checkpoint,
            weights: best.weights,
            samples: best.samples,
            successes: best.successes,
            episodes: best.episodes,
            rate: best.success_rate,
          }
        : null,
    });
  }
  for (const name of Object.keys(LEFT_OUT)) {
    if (!source.runs.some((run) => run.name === name)) more(`LEFT_OUT names ${name}, which is not in the export (nothing to leave out).`);
  }

  const expert = (source.expert ?? []).map((row) => ({
    variant: row.variant,
    task: row.task,
    plansAgain: Boolean(row.plans_again),
    settings: settings(row),
    ...evaluation(row),
    secondAttempts: secondAttempts(row, `expert / ${row.variant}`),
    moved: moved(row),
    source: row.grasp_file,
    traceFiles: row.trace_files ?? [],
  }));

  return { time: source.time, defaults, runs, expert, leftOut };
}

// ================================================================ what the notebook prints

/** Checks the rows NOTEBOOK_ROWS names for one evaluation; returns the sections that report it. */
function citations(notebook, entries, row, label) {
  const sections = [];
  for (const entry of entries) {
    const found = sectionsWith(notebook, entry.row);
    const section = found.find((candidate) => candidate.title === entry.section);
    if (!section) {
      problem(
        found.length > 0
          ? `${label}: the row is in "${found[0].title}", not in "${entry.section}": ${entry.row}`
          : `${label}: no longer in the notebook: ${entry.row}`,
      );
      continue;
    }
    const absent = entry.shows.filter((name) => !hasToken(entry.row, SHOWN[name](row)));
    if (absent.length > 0) {
      problem(
        `${label}: the export has ${absent.map((name) => `${name} ${SHOWN[name](row)}`).join(", ")}, the notebook row reads: ${entry.row}`,
      );
      continue;
    }
    if (!sections.some((known) => known.title === section.title)) sections.push(section);
  }
  return sections;
}

/** What the notebook prints of one run, gathered from every table before deciding anything. */
function freshFinding() {
  return {
    checkpoints: new Map(), // checkpoint -> Set of weights
    sections: new Map(), // title -> section
    probes: new Map(), // variant -> { sections: Map, checkpoint?, weights? }
    marks: [], // where the notebook says "still training"
    best: false,
    position: Infinity,
  };
}

/** Records that the notebook prints these weights of a checkpoint, at a row of a table. */
function noteCheckpoint(finding, checkpoint, weights, section, position) {
  if (!finding.checkpoints.has(checkpoint)) finding.checkpoints.set(checkpoint, new Set());
  for (const name of weights) finding.checkpoints.get(checkpoint).add(name);
  finding.sections.set(section.title, section);
  finding.position = Math.min(finding.position, position);
}

/** Records that the notebook reports a probe of a run (or of the expert). */
function noteProbe(finding, variant, section, position, extra = {}) {
  if (!finding.probes.has(variant)) finding.probes.set(variant, { sections: new Map(), ...extra });
  finding.probes.get(variant).sections.set(section.title, section);
  finding.sections.set(section.title, section);
  finding.position = Math.min(finding.position, position);
}

/** The latest checkpoint whose samples the notebook prints as `cell`: "5.0M" is the final one, not the one just before it. */
function checkpointPrintedAs(run, cell) {
  const wanted = cell.replace(/\s*\(final\)$/, "");
  return run.checkpoints.filter((row) => formatSamples(row.samples) === wanted).at(-1);
}

/**
 * The rows of a run's own tables, and the rows of other tables that print a checkpoint of it in
 * the same form: "x% / y%" for both sets of weights, or the trained weights alone in a table that
 * has only those. A run's own table is one most of whose rows are the run's; when the text after
 * it, or a row of it, says "still training", the run is marked as still training.
 */
function matchOwnRows(run, notebook, finding) {
  const tableHits = new Map(); // table -> { section, rows: Set }
  const hitTable = (section, table, row) => {
    if (!tableHits.has(table)) tableHits.set(table, { section, rows: new Set() });
    tableHits.get(table).rows.add(row);
  };
  for (const row of run.checkpoints) {
    const both = row.raw && row.ema ? checkpointCells(row) : undefined;
    const single = row.raw ? singleCells(row.raw) : undefined;
    for (const section of notebook.sections) {
      for (const table of section.tables) {
        const bySamples = table.header?.[0] === "Samples";
        const singleTable = table.header?.some((cell) => /^Success \((raw|EMA)\)$/.test(cell));
        for (const line of table.rows) {
          if (bySamples && !fitsSamples(line.cells[0], row)) continue;
          if (both && line.text.includes(both)) {
            noteCheckpoint(finding, row.checkpoint, ["raw", "ema"], section, positionOf(section, table, line));
            hitTable(section, table, line);
          } else if (single && singleTable && bySamples && single.every((cell, index) => line.cells[index + 1] === cell)) {
            noteCheckpoint(finding, row.checkpoint, ["raw"], section, positionOf(section, table, line));
            hitTable(section, table, line);
          }
        }
      }
    }
  }
  for (const [table, { section, rows }] of tableHits) {
    const own = rows.size * 2 > table.rows.length;
    const marked = [...rows].find((line) => /still training/i.test(line.text));
    if (marked) finding.marks.push(`"${section.title}": ${marked.text}`);
    else if (own && /still training/i.test(table.after)) finding.marks.push(`"${section.title}": ${table.after.slice(0, 80)}`);
  }
}

/** The table a NOTEBOOK_TABLES entry describes, or undefined (and a problem). */
function locateTable(notebook, spec) {
  const section = notebook.sections.find((candidate) => candidate.title === spec.section);
  if (!section) {
    problem(`NOTEBOOK_TABLES ${spec.id}: the notebook has no section "${spec.section}".`);
    return undefined;
  }
  const table = section.tables.find(
    (candidate) =>
      candidate.header &&
      (spec.has ?? []).every((cell) => candidate.header.includes(cell)) &&
      !(spec.lacks ?? []).some((cell) => candidate.header.includes(cell)),
  );
  if (!table) {
    problem(`NOTEBOOK_TABLES ${spec.id}: no table in "${spec.section}" has the columns ${spec.has.join(", ")}.`);
    return undefined;
  }
  return { section, table };
}

/** A notebook cell against what the export prints for it; a disagreement is a problem, never resolved. */
function agree(label, cell, expected) {
  if (cell === expected) return true;
  problem(`${label}: the export has ${expected}, the notebook's cell reads ${cell}.`);
  return false;
}

/** The weights a conditions table uses for a run: the averaged ones where the run saved them. */
function batteryWeights(run) {
  const last = run.checkpoints.at(-1);
  return last?.ema ? "ema" : "raw";
}

/**
 * One cell of a conditions table: "85/100", "0/96", "1/99 (29 retried)",
 * "1/100 (at the named object 99%)", "12/100 (closed at the other object 16/100)". For a
 * disturbance the count is over the episodes in which the object could be moved.
 */
function conditionCell(label, cell, row) {
  const match = /^(\d+)\/(\d+)(?: \((.+)\))?$/.exec(cell);
  if (!match) {
    problem(`${label}: the cell "${cell}" is not understood.`);
    return false;
  }
  const counted = row.moved ?? row;
  if (!agree(label, `${match[1]}/${match[2]}`, formatCount(counted.successes, counted.episodes))) return false;
  const note = match[3];
  if (!note) return true;
  if (/^\d+ retried$/.test(note)) {
    const retried = row.moved ? row.moved.retried : row.secondAttempts;
    return agree(label, note, `${retried ?? "-"} retried`);
  }
  if (/^at the named object \d+%$/.test(note)) return agree(label, note, `at the named object ${formatPercent(row.named)}`);
  if (/^closed at the other object \d+\/\d+$/.test(note)) {
    const goal = row.prefixGoal;
    return agree(label, note, `closed at the other object ${goal ? formatCount(goal.count, goal.episodes) : "-"}`);
  }
  problem(`${label}: "(${note})" in the cell "${cell}" is not understood.`);
  return false;
}

/** The quantities of an old_fixed table's header: "Success, old table", "fixed", "Slope, old". */
function pairColumns(header, words) {
  const sides = Object.fromEntries(Object.entries(words).map(([side, word]) => [word, side]));
  let quantity;
  return header.slice(1).map((cell) => {
    const match = /^(?:(Success|Closed at the named object|Slope)(?:, )?)?(\w+)?(?: table)?$/.exec(cell);
    if (match?.[1]) quantity = { Success: "success", "Closed at the named object": "named", Slope: "slope" }[match[1]];
    const side = match?.[2] ? sides[match[2]] : undefined;
    return { cell, quantity: side ? quantity : undefined, side };
  });
}

/**
 * Finds every "still training" of the comparison tables first, so that no cell of a run in
 * progress is taken as a result: a row that says it, and a sentence after a pair table.
 */
function markStillTraining(notebook, findings) {
  const finding = (name) => {
    if (!findings.has(name)) findings.set(name, freshFinding());
    return findings.get(name);
  };
  for (const spec of NOTEBOOK_TABLES) {
    const section = notebook.sections.find((candidate) => candidate.title === spec.section);
    for (const table of section?.tables ?? []) {
      for (const line of table.rows) {
        const name = runOfWords(rowWords(line.cells[0]));
        if (name && /still training/i.test(line.text)) finding(name).marks.push(`"${section.title}": ${line.cells[0]}, still training`);
      }
    }
  }
  for (const spec of PAIR_TABLES) {
    const section = notebook.sections.find((candidate) => candidate.title === spec.section);
    const text = [section?.body ?? ""].join(" ");
    for (const sentence of text.split(/(?<=\.)\s+/).filter((part) => /still training/i.test(part))) {
      const named = spec.words ? Object.entries(spec.words).filter(([, word]) => new RegExp(`\\b${word} table\\b`).test(sentence)).map(([side]) => side) : [];
      for (const side of named.length > 0 ? named : ["before", "after"]) finding(spec[side]).marks.push(`"${spec.section}": ${sentence}`);
    }
  }
}

/**
 * Reads the comparison tables and the pair tables, cell by cell, into the findings. A run in
 * progress is checked where the export has the checkpoint, and gives nothing; where the export
 * does not have it yet, the cell is counted as ahead of the export.
 */
function matchComparisons(data, notebook, findings, expertFinding) {
  const byName = new Map(data.runs.map((run) => [run.name, run]));
  const tables = {};
  const pooled = {};
  const beforeAfter = [];
  const ahead = new Map(); // run -> cells the export cannot check yet
  const reportedListed = new Map(); // run on IN_PROGRESS -> sections that report it without "still training"
  const finding = (name) => {
    if (!findings.has(name)) findings.set(name, freshFinding());
    return findings.get(name);
  };
  const isListed = (name) => IN_PROGRESS.includes(name);
  const exportFinished = (name) => {
    const run = byName.get(name);
    return Boolean(run) && (run.state === "done" || name in STOPPED);
  };
  const hasValues = (name) => !isListed(name) && finding(name).marks.length === 0 && exportFinished(name);
  const behind = (name) => ahead.set(name, (ahead.get(name) ?? 0) + 1);

  for (const spec of NOTEBOOK_TABLES) {
    const located = locateTable(notebook, spec);
    if (!located) continue;
    const { section, table } = located;
    const entry = { id: spec.id, layout: spec.layout, section: section.title, rows: [], columns: [] };
    tables[spec.id] = entry;

    if (spec.layout === "expert") {
      const columns = table.header.slice(1);
      entry.columns = columns.map((words) => ({ words, variant: CONDITION_COLUMNS[words] ?? null }));
      for (const line of table.rows) {
        const words = rowWords(line.cells[0]);
        if (!(words in EXPERT_WORDS)) {
          problem(`"${section.title}", the expert's table: the row "${line.cells[0]}" is not in EXPERT_WORDS.`);
          continue;
        }
        const plansAgain = EXPERT_WORDS[words];
        const cells = [];
        columns.forEach((column, index) => {
          const cell = line.cells[index + 1] ?? "";
          const variant = CONDITION_COLUMNS[column];
          if (!variant) {
            problem(`"${section.title}", the expert's table: the column "${column}" is not in CONDITION_COLUMNS.`);
            return;
          }
          if (cell === "") return;
          const name = expertVariant(variant, plansAgain);
          const row = data.expert.find((candidate) => candidate.variant === name);
          const label = `expert / ${name} ("${section.title}", ${words}, ${column})`;
          if (!row) {
            problem(`${label}: the notebook has ${cell}, the export has no such evaluation of the expert.`);
            return;
          }
          if (row.plansAgain !== plansAgain) problem(`${label}: the export's row ${row.plansAgain ? "plans" : "does not plan"} again.`);
          if (!conditionCell(label, cell, row)) return;
          noteProbe(expertFinding, name, section, positionOf(section, table, line));
          cells.push({ column: variant, variant: name });
        });
        entry.rows.push({ words, plansAgain, cells });
      }
      continue;
    }

    const columns = table.header.slice(1);
    entry.columns =
      spec.layout === "conditions"
        ? columns.map((words) => ({ words, variant: CONDITION_COLUMNS[words] ?? null }))
        : columns.map((words) => ({ words }));
    if (spec.layout === "conditions") {
      for (const column of columns) {
        if (!(column in CONDITION_COLUMNS)) problem(`"${section.title}": the column "${column}" is not in CONDITION_COLUMNS.`);
      }
    }

    for (const line of table.rows) {
      const words = rowWords(line.cells[0]);
      const name = runOfWords(words);
      const run = name ? byName.get(name) : undefined;
      if (!name) {
        problem(`"${section.title}": the row "${line.cells[0]}" names no run (RUN_WORDS, TABLE_WORDS).`);
        continue;
      }
      entry.rows.push({ run: name, words });
      const position = positionOf(section, table, line);
      const found = finding(name);
      found.position = Math.min(found.position, position);
      if (!run) {
        if (hasValues(name)) problem(`"${section.title}": the row "${line.cells[0]}" is ${name}, which is not in the export.`);
        else behind(name);
        continue;
      }
      const values = hasValues(name); // a run in progress is checked, not reported
      if (!values && isListed(name) && found.marks.length === 0) {
        if (!reportedListed.has(name)) reportedListed.set(name, new Set());
        reportedListed.get(name).add(section.title);
      }

      columns.forEach((column, index) => {
        const cell = line.cells[index + 1] ?? "";
        if (cell === "") return;
        const label = `${name} ("${section.title}", ${column})`;

        if (spec.layout === "samples" && column === "Best checkpoint") {
          if (!values) return behind(name);
          const expected = run.best ? `${formatPercent(run.best.rate)} (${run.best.weights}, ${formatSamples(run.best.samples)})` : "-";
          if (agree(label, cell.replace(/, still training$/, ""), expected)) found.best = true;
          return;
        }
        if (spec.layout === "samples" || spec.layout === "named") {
          if (!samplesCell(column)) {
            problem(`"${section.title}": the column "${column}" is not a number of samples.`);
            return;
          }
          const row = checkpointPrintedAs(run, column);
          if (!row || !row.raw) {
            if (values) problem(`${label}: the notebook has ${cell}, the export has no checkpoint at ${column}.`);
            else behind(name);
            return;
          }
          if (spec.layout === "samples") {
            const expected = `${formatPercent(row.raw.rate)} / ${row.ema ? formatPercent(row.ema.rate) : "-"}`;
            if (agree(label, cell, expected) && values) {
              noteCheckpoint(found, row.checkpoint, row.ema ? ["raw", "ema"] : ["raw"], section, position);
            }
          } else {
            const weights = row.raw ?? row.ema;
            if (agree(label, cell, `${formatPercent(weights.named)}, ${formatSlope(weights.slope)}`) && values) {
              noteCheckpoint(found, row.checkpoint, [row.raw ? "raw" : "ema"], section, position);
            }
          }
          return;
        }
        if (spec.layout === "objects") {
          if (!values) return behind(name); // pooled over the last checkpoints: only a finished run has them
          const object = { Can: "can", Cube: "cube", "Hex nut": "hex", "T block": "tblock" }[column];
          if (!object) {
            problem(`"${section.title}": the column "${column}" names no object.`);
            return;
          }
          const last = run.checkpoints.slice(-spec.pooled);
          const evaluations = last.flatMap((row) => [row.raw, row.ema].filter(Boolean));
          const sum = { successes: 0, episodes: 0 };
          for (const value of evaluations) {
            sum.successes += value.perObject[object]?.successes ?? 0;
            sum.episodes += value.perObject[object]?.episodes ?? 0;
          }
          const expected = `${formatCount(sum.successes, sum.episodes)} = ${formatPercent(sum.successes / sum.episodes)}`;
          if (agree(label, cell, expected) && values) {
            pooled[name] ??= {
              section: section.title,
              checkpoints: last.map((row) => row.checkpoint),
              weights: [...new Set(last.flatMap((row) => ["raw", "ema"].filter((weights) => row[weights])))],
              perObject: {},
            };
            pooled[name].perObject[object] = sum;
            found.sections.set(section.title, section);
          }
          return;
        }
        // conditions: the final checkpoint, which a run in progress does not have
        const variant = CONDITION_COLUMNS[column];
        if (!variant) return;
        if (!values) return behind(name);
        const final = run.checkpoints.at(-1);
        const weights = batteryWeights(run);
        if (variant === "plain") {
          if (!final?.[weights]) {
            problem(`${label}: the run has no final checkpoint with ${weights} weights.`);
            return;
          }
          if (conditionCell(label, cell, final[weights]) && values) {
            noteCheckpoint(found, final.checkpoint, [weights], section, position);
            noteProbe(found, "plain", section, position, { checkpoint: final.checkpoint, weights });
          }
          return;
        }
        const row = run.probes.find((candidate) => candidate.variant === variant);
        if (!row) {
          problem(`${label}: the notebook has ${cell}, the export has no probe "${variant}".`);
          return;
        }
        if (final && (row.checkpoint !== final.checkpoint || row.weights !== weights)) {
          problem(`${label}: the probe is of checkpoint ${row.checkpoint} (${row.weights}), the table is of the final checkpoint ${final.checkpoint} (${weights}).`);
          return;
        }
        if (conditionCell(label, cell, row) && values) noteProbe(found, variant, section, position);
      });
    }
  }

  // The same recipe with the old and the fixed position table.
  for (const spec of PAIR_TABLES) {
    const section = notebook.sections.find((candidate) => candidate.title === spec.section);
    const table =
      spec.layout === "before_after"
        ? section?.tables.find((candidate) => candidate.header?.some((cell) => /before \/ after/.test(cell)))
        : section?.tables.find((candidate) => candidate.header?.[0] === "Samples");
    if (!section || !table) {
      problem(`PAIR_TABLES: the notebook has no such table in "${spec.section}".`);
      continue;
    }
    const runs = { before: byName.get(spec.before), after: byName.get(spec.after) };
    const values = { before: hasValues(spec.before), after: hasValues(spec.after) };
    const rows = [];
    const format = { success: (value) => formatPercent(value.rate), named: (value) => formatPercent(value.named), slope: (value) => formatSlope(value.slope) };
    const columns = spec.layout === "old_fixed" ? pairColumns(table.header, spec.words) : [];
    for (const column of columns) {
      if (!column.quantity || !column.side) problem(`PAIR_TABLES "${spec.section}": the column "${column.cell}" is not understood.`);
    }
    for (const line of table.rows) {
      const samples = line.cells[0];
      const position = positionOf(section, table, line);
      const at = {};
      for (const side of ["before", "after"]) {
        const name = spec[side];
        const label = `${name} ("${section.title}", ${samples})`;
        const cells =
          spec.layout === "before_after"
            ? line.cells.slice(1, 5).map((cell) => cell.split(" / ")[side === "before" ? 0 : 1]?.replace(/ mm$/, "") ?? "")
            : columns.map((column, index) => (column.side === side ? line.cells[index + 1] ?? "" : ""));
        if (cells.every((cell) => cell === "")) continue;
        finding(name).position = Math.min(finding(name).position, position);
        const run = runs[side];
        const row = run ? checkpointPrintedAs(run, samples) : undefined;
        if (!row || spec.weights.some((weights) => !row[weights])) {
          if (values[side]) problem(`${label}: the notebook has a cell, the export has no ${spec.weights.join(" and ")} checkpoint at ${samples}.`);
          else behind(name);
          continue;
        }
        let ok = true;
        if (spec.layout === "before_after") {
          const value = row[spec.weights[0]];
          const expected = [formatPercent(value.rate), formatPercent(value.named), formatSlope(value.slope), formatWhole(value.missMm)];
          cells.forEach((cell, index) => {
            ok = agree(label, cell, expected[index]) && ok;
          });
        } else {
          columns.forEach((column, index) => {
            if (column.side !== side || !column.quantity || cells[index] === "") return;
            ok = agree(`${label}, ${column.cell}`, cells[index], `${format[column.quantity](row.raw)} / ${format[column.quantity](row.ema)}`) && ok;
          });
        }
        if (!ok || !values[side]) continue;
        noteCheckpoint(finding(name), row.checkpoint, spec.weights, section, position);
        at[side] = row.checkpoint;
      }
      if (at.before !== undefined || at.after !== undefined) rows.push({ samples, before: at.before ?? null, after: at.after ?? null });
    }
    // "Per object at the final checkpoint, before / after: can 26/28 / 25/28, ..."
    let perObject = null;
    const sentence = /Per object at the final checkpoint, before \/ after: ([^.]*)\./.exec(section.body);
    if (sentence && values.before && values.after && runs.before && runs.after) {
      const weights = spec.weights[0];
      const a = runs.before.checkpoints.at(-1)?.[weights];
      const b = runs.after.checkpoints.at(-1)?.[weights];
      const counts = { before: {}, after: {} };
      let ok = Boolean(a && b);
      for (const item of sentence[1].matchAll(/(can|cube|hex|tblock) (\d+\/\d+) \/ (\d+\/\d+)/g)) {
        const [, object, left, right] = item;
        const label = `${spec.before} / ${spec.after} ("${section.title}", per object, ${object})`;
        const x = a?.perObject[object];
        const y = b?.perObject[object];
        ok = agree(label, left, x ? formatCount(x.successes, x.episodes) : "-") && ok;
        ok = agree(label, right, y ? formatCount(y.successes, y.episodes) : "-") && ok;
        counts.before[object] = x;
        counts.after[object] = y;
      }
      if (ok) {
        perObject = {
          weights,
          before: { checkpoint: runs.before.checkpoints.at(-1).checkpoint, counts: counts.before },
          after: { checkpoint: runs.after.checkpoints.at(-1).checkpoint, counts: counts.after },
        };
      }
    }
    if (rows.length > 0) {
      beforeAfter.push({ section: section.title, before: spec.before, after: spec.after, weights: spec.weights, rows, perObject });
    }
  }

  return { tables, pooled, beforeAfter, ahead, reportedListed };
}

/** Keeps what the notebook reports and says what it left out. */
function select(data, notebook) {
  const unreported = { checkpoints: {}, probes: {}, expert: [] };
  const findings = new Map();
  for (const run of data.runs) {
    const finding = freshFinding();
    findings.set(run.name, finding);
    matchOwnRows(run, notebook, finding);
  }
  const expertFinding = freshFinding();
  markStillTraining(notebook, findings);
  const comparisons = matchComparisons(data, notebook, findings, expertFinding);

  const runs = [];
  const checkpoints = {};
  const probes = {};
  const curves = {};
  const episodes = []; // { source, run, task, checkpoint, weights, samples, variant, kind }
  const groupOf = (run, finding) => ({
    fix: run.design.positionFix ? "after" : "before",
    family: familyOf(run.name, run.design),
    order: Number.isFinite(finding.position) ? finding.position : null,
  });

  for (const run of data.runs) {
    const finding = findings.get(run.name);
    const words = RUN_WORDS[run.name] ?? null;
    let status = "finished";
    let reason;
    if (IN_PROGRESS.includes(run.name) || finding.marks.length > 0) {
      status = "in_progress";
      reason = "notebook";
    } else if (!(run.state === "done" || run.name in STOPPED)) {
      status = "in_progress";
      reason = "not_finished";
      problem(`${run.name} has not finished in the export (${run.state}) and is not in STOPPED; it is shown as in progress.`);
    }
    if (status === "in_progress") {
      runs.push({
        name: run.name,
        status,
        reason,
        task: run.task,
        design: run.design,
        samplesPlanned: run.samplesPlanned,
        words,
        group: groupOf(run, finding),
      });
      continue;
    }

    // Rows by checkpoint: those the notebook prints, with the weights it prints.
    const listed = [];
    const skipped = [];
    for (const row of run.checkpoints) {
      const weights = finding.checkpoints.get(row.checkpoint);
      if (!weights) {
        skipped.push(row.checkpoint);
        continue;
      }
      if (!weights.has("raw") || !row.raw) {
        problem(`${run.name}, checkpoint ${row.checkpoint}: the notebook prints its averaged weights alone; the site has no row for that.`);
        skipped.push(row.checkpoint);
        continue;
      }
      listed.push({ ...row, ema: weights.has("ema") ? row.ema : null });
    }
    if (skipped.length > 0) unreported.checkpoints[run.name] = skipped;
    const note = (found) => {
      for (const section of found) finding.sections.set(section.title, section);
    };

    // The best checkpoint: reported when the notebook names it beside the run's last row, or in a comparison table.
    const last = run.checkpoints.at(-1);
    let best = null;
    if (run.best && last?.raw && last.ema) {
      const cell = `${formatPercent(run.best.rate)} (${run.best.weights}, ${formatSamples(run.best.samples)})`;
      if (notebook.flat.includes(`${checkpointCells(last)} ${cell} |`)) best = run.best;
    }
    if (run.best && finding.best) best = run.best;

    // Probes: reported when NOTEBOOK_ROWS names their row, or a comparison table has their cell.
    const named = NOTEBOOK_ROWS[run.name] ?? {};
    const variants = [...new Set([...Object.keys(named), ...finding.probes.keys()])];
    const kept = [];
    for (const variant of variants) {
      const entries = named[variant] ?? [];
      const fromTables = finding.probes.get(variant);
      let row;
      if (variant === "plain") {
        const checkpoint = entries[0]?.checkpoint ?? fromTables?.checkpoint;
        const weights = entries[0]?.weights ?? fromTables?.weights;
        if (entries[0] && fromTables && (fromTables.checkpoint !== checkpoint || fromTables.weights !== weights)) {
          problem(`${run.name}: NOTEBOOK_ROWS names checkpoint ${checkpoint} (${weights}) as the probed one, a comparison table checkpoint ${fromTables.checkpoint} (${fromTables.weights}).`);
        }
        const at = listed.find((candidate) => candidate.checkpoint === checkpoint);
        if (!at?.[weights]) {
          problem(`${run.name}: NOTEBOOK_ROWS names checkpoint ${checkpoint} (${weights}), which the notebook does not report.`);
          continue;
        }
        const { source, ...numbers } = at[weights];
        row = {
          variant,
          checkpoint,
          weights,
          samples: at.samples,
          task: run.task,
          settings: {
            execHorizon: data.defaults.execHorizon,
            flowSteps: data.defaults.flowSteps,
            noise: "fresh",
            randomStart: false,
            seedStart: data.defaults.seedStart,
            expertPrefix: 0,
            prefixTarget: null,
            staleImages: false,
            firstPrevAction: "hold",
            disturb: "none",
            disturbStep: null,
            disturbMm: null,
          },
          ...numbers,
          secondAttempts: numbers.retried === null ? null : Math.round(numbers.retried * numbers.episodes),
          latencyMs: null,
          moved: null,
          prefixGoal: null,
          source,
          traceFiles: [],
        };
      } else {
        row = run.probes.find((candidate) => candidate.variant === variant);
        if (!row) {
          problem(`${run.name}: NOTEBOOK_ROWS names the probe "${variant}", which is not in the export.`);
          continue;
        }
      }
      const cited = entries.length > 0 ? citations(notebook, entries, row, `${run.name} / ${variant}`) : [];
      const sections = new Map(cited.map((section) => [section.title, section]));
      for (const [title, section] of fromTables?.sections ?? []) sections.set(title, section);
      if (sections.size === 0) continue;
      note(sections.values());
      for (const section of cited) finding.position = Math.min(finding.position, positionOf(section));
      const order = [...sections.values()].sort((a, b) => a.index - b.index).map((section) => section.title);
      kept.push({ ...row, kind: kindOf(row.settings, data.defaults), sections: order });
    }
    kept.sort((a, b) => (a.variant === "plain" ? -1 : b.variant === "plain" ? 1 : 0));
    // A probe that only records rollouts is not a result; some of its rollouts are published.
    const dropped = run.probes
      .filter((row) => !kept.some((known) => known.variant === row.variant) && !row.variant.startsWith("traces_"))
      .map((row) => row.variant);
    if (dropped.length > 0) unreported.probes[run.name] = dropped;

    // A run without evaluations is reported by the row NOTEBOOK_RUNS names.
    if (NOTEBOOK_RUNS[run.name]) {
      const cited = citations(notebook, NOTEBOOK_RUNS[run.name], run, run.name);
      note(cited);
      for (const section of cited) finding.position = Math.min(finding.position, positionOf(section));
    }

    const stopped = run.name in STOPPED;
    const samples = stopped ? (listed.at(-1)?.samples ?? run.samplesSeen) : run.samplesSeen;
    if (stopped) {
      const sentence = STOPPED[run.name];
      if (!notebook.flat.includes(flat(sentence))) problem(`${run.name}: STOPPED quotes "${sentence}", which is no longer in the notebook.`);
      else if (!sentence.includes(formatSamples(samples))) {
        problem(`${run.name}: its last reported checkpoint is at ${formatSamples(samples)}; the notebook says "${sentence}"`);
      }
    } else if (run.samplesSeen !== run.samplesPlanned) {
      problem(`${run.name} is finished, but saw ${run.samplesSeen} of ${run.samplesPlanned} samples.`);
    }
    const sections = [...finding.sections.values()].sort((a, b) => a.index - b.index);
    if (sections.length === 0) {
      problem(`${run.name} is finished in the export, but the notebook reports none of its rows; add it to IN_PROGRESS or to NOTEBOOK_RUNS.`);
    }
    if (listed.length > 0 && listed.at(-1).samples !== samples) {
      problem(`${run.name}: the notebook does not report its last checkpoint (${formatSamples(samples)}); the site would end the run early.`);
    }

    const machines = [...new Set(sections.map(machineOf).filter(Boolean))];
    if (machines.length > 1) problem(`${run.name} is reported under machine ${machines.join(" and machine ")}.`);

    runs.push({
      name: run.name,
      status,
      task: run.task,
      design: run.design,
      samplesPlanned: run.samplesPlanned,
      words,
      group: groupOf(run, finding),
      samples,
      stopped,
      // The last loss the trainer logged. A stopped run did not end, so it has none.
      finalLoss: stopped ? null : run.finalLoss,
      machine: machines[0] ?? null,
      sections: sections.map((section) => section.title),
      best,
    });
    if (listed.length > 0) checkpoints[run.name] = listed;
    if (kept.length > 0) probes[run.name] = kept;
    // A stopped run's curve ends where the notebook reports it: at its last checkpoint.
    curves[run.name] = stopped ? run.curve.filter(([seen]) => seen <= samples) : run.curve;

    for (const row of listed) {
      for (const weights of ["raw", "ema"]) {
        if (!row[weights]) continue;
        episodes.push({
          source: row[weights].source,
          run: run.name,
          task: run.task,
          checkpoint: row.checkpoint,
          weights,
          samples: row.samples,
          final: row.final,
          variant: "plain",
          kind: "baseline",
        });
      }
    }
    for (const row of kept) {
      if (row.variant === "plain") continue;
      episodes.push({
        source: row.source,
        run: run.name,
        task: row.task,
        checkpoint: row.checkpoint,
        weights: row.weights,
        samples: row.samples,
        final: false,
        variant: row.variant,
        kind: row.kind,
      });
    }
  }

  // The expert.
  const expert = [];
  for (const row of data.expert) {
    const entries = NOTEBOOK_ROWS.expert?.[row.variant] ?? [];
    const fromTables = expertFinding.probes.get(row.variant);
    if (entries.length === 0 && !fromTables) {
      unreported.expert.push(row.variant);
      continue;
    }
    const cited = entries.length > 0 ? citations(notebook, entries, row, `expert / ${row.variant}`) : [];
    const sections = new Map(cited.map((section) => [section.title, section]));
    for (const [title, section] of fromTables?.sections ?? []) sections.set(title, section);
    if (sections.size === 0) continue;
    const ordered = [...sections.values()].sort((a, b) => a.index - b.index);
    const machines = [...new Set(ordered.map(machineOf).filter(Boolean))];
    expert.push({
      ...row,
      kind: kindOf(row.settings, data.defaults),
      machine: machines[0] ?? /machine ([AB])\b/.exec(entries[0]?.row ?? "")?.[1] ?? null,
      sections: ordered.map((section) => section.title),
    });
    episodes.push({ source: row.source, run: "expert", task: row.task, variant: row.variant, kind: "baseline" });
  }

  // The list of runs in progress, against what the notebook still says.
  const listSection = notebook.sections.find((section) => section.title === NOTEBOOK_IN_PROGRESS_SECTION);
  const awaited = IN_PROGRESS.filter((name) => !data.runs.some((run) => run.name === name) && !data.leftOut.includes(name));
  for (const name of IN_PROGRESS) {
    if (data.leftOut.includes(name)) problem(`IN_PROGRESS names ${name}, which LEFT_OUT leaves out.`);
  }
  if (!listSection && IN_PROGRESS.length > 0) {
    problem(`The notebook no longer has "${NOTEBOOK_IN_PROGRESS_SECTION}", and IN_PROGRESS still names ${IN_PROGRESS.length} runs; take off those the notebook reports.`);
  }

  return { runs, checkpoints, probes, expert, curves, episodes, unreported, comparisons, awaited, listSection: Boolean(listSection) };
}

// ================================================================ grasp tolerance, tokenisations

const TOLERANCE_COLUMNS = ["cube", "tblock", "can", "hex", "all"]; // the notebook's column order

function readTolerance(notebook) {
  const file = path.join(exportDir, "tolerance.json");
  if (!existsSync(file)) return undefined;
  const source = readJson(file);
  const offsets = Object.entries(source.by_offset_mm)
    .map(([offset, row]) => ({
      offsetMm: Number(offset),
      ...Object.fromEntries(TOLERANCE_COLUMNS.filter((name) => row[name]).map((name) => [name, count(row[name])])),
    }))
    .sort((a, b) => a.offsetMm - b.offsetMm);

  // Which of the notebook's two tables is this? The one whose rows read the same.
  const section = notebook.sections.find((candidate) => candidate.title === "Grasp tolerance");
  const machines = new Set();
  for (const row of offsets) {
    const cells = `| ${formatMm(row.offsetMm)} | ${TOLERANCE_COLUMNS.map((name) => formatPercent(row[name].successes / row[name].episodes)).join(" | ")} |`;
    const at = section ? section.body.indexOf(cells) : -1;
    if (at === -1) {
      problem(`Grasp tolerance: the notebook has no row ${cells}`);
      continue;
    }
    const before = [...section.body.slice(0, at).matchAll(/Machine ([AB]) \(/g)].at(-1);
    machines.add(before ? before[1] : "?");
  }
  if (machines.size > 1) problem(`Grasp tolerance: the export's rows are spread over the tables of machine ${[...machines].join(" and ")}.`);
  return {
    task: source.task,
    episodesPerOffset: source.episodes_per_offset,
    machine: machines.size === 1 && !machines.has("?") ? [...machines][0] : null,
    section: "Grasp tolerance",
    offsets,
  };
}

function readTokenizations() {
  const file = path.join(siteExportDir, "tokenizations.json");
  if (!existsSync(file)) return undefined;
  const source = readJson(file);
  const sentence = (item) => {
    if (item.ids.length !== item.pieces.length) problem(`Tokenisations: "${item.text}" has ${item.ids.length} ids and ${item.pieces.length} pieces.`);
    return { text: item.text, ids: item.ids, pieces: item.pieces, ...(item.mask ? { mask: item.mask } : {}) };
  };
  return {
    tokenizer: source.tokenizer,
    vocabSize: source.vocab_size,
    padId: source.pad_id,
    paddingSide: source.padding_side,
    sentences: (source.sentences ?? []).map(sentence),
    chatTemplate: (source.chat_template ?? []).map(sentence),
  };
}

// ================================================================ per-episode files

const round = (digits) => (value) => Math.round(value * 10 ** digits) / 10 ** digits;
const round4 = (values) => values.map(round(4));

/** One evaluated episode: where the gripper first closed and where the objects were. Metres. */
function episode(source) {
  return {
    seed: source.seed,
    target: source.target,
    success: source.success,
    steps: source.steps,
    wrongObject: source.wrong_object,
    closeStep: source.close_step ?? null,
    closes: source.closes ?? null,
    nearest: source.nearest ?? null,
    tcp: source.tcp ?? null,
    objects: source.objects ?? {},
    yawErr: source.yaw_err ?? null,
    zAbove: source.z_above ?? null,
    moved: source.moved ? { step: source.moved.step, from: source.moved.from_xy, to: source.moved.to_xy } : null,
  };
}

/** Which of the reported evaluations get their episodes published. */
function publishedEpisodes(selected) {
  const chosen = [];
  const take = (item) => {
    if (!item.source) problem(`${item.run} / ${item.variant}: the export has no per-episode file for it.`);
    else if (!chosen.includes(item)) chosen.push(item);
  };
  for (const rule of PUBLISHED_EPISODES) {
    const ofRun = selected.episodes.filter((item) => item.run === rule.run);
    if (ofRun.length === 0) {
      const entry = selected.runs.find((run) => run.name === rule.run);
      if (entry?.status !== "in_progress") problem(`PUBLISHED_EPISODES names ${rule.run}, which has no reported evaluation.`);
      continue;
    }
    for (const variant of rule.variants ?? []) ofRun.filter((item) => item.variant === variant).forEach(take);
    const plain = ofRun.filter((item) => item.variant === "plain" && item.checkpoint !== undefined);
    for (const at of plain.length > 0 ? (rule.at ?? []) : []) {
      const wanted = at === "final" ? Math.max(...plain.map((item) => item.samples)) : at;
      const nearest = plain.reduce((best, item) => (Math.abs(item.samples - wanted) < Math.abs(best.samples - wanted) ? item : best));
      plain
        .filter((item) => item.checkpoint === nearest.checkpoint && (rule.weights ?? ["raw", "ema"]).includes(item.weights))
        .forEach(take);
    }
    for (const kind of rule.probes ?? []) ofRun.filter((item) => item.variant !== "plain" && item.kind === kind).forEach(take);
  }
  return chosen;
}

function writeEpisodes(selected) {
  const folder = path.join(PUBLIC_DATA, "grasp");
  const kept = new Set();
  const index = [];
  for (const item of publishedEpisodes(selected)) {
    const file = path.join(exportDir, item.source);
    if (!existsSync(file)) {
      problem(`${item.source} is named in runs.json and missing from the export.`);
      continue;
    }
    const source = readJson(file);
    const id = path.basename(item.source, ".json");
    const body = {
      id,
      run: item.run,
      task: item.task,
      variant: item.variant,
      ...(item.checkpoint === undefined ? {} : { checkpoint: item.checkpoint, weights: item.weights, samples: item.samples }),
      episodes: source.episodes.map(episode),
    };
    const text = stringify(body, 2);
    write(path.join(folder, `${id}.json`), text);
    kept.add(`${id}.json`);
    const { episodes, ...head } = body;
    index.push({ ...head, kind: item.kind, episodes: episodes.length, bytes: Buffer.byteLength(text) });
  }
  prune(folder, kept, ".json");
  return index;
}

// ================================================================ rollouts

/** How many times the gripper was told to close after being open: 2 or more is a second attempt. */
function closesOf(actions) {
  let closes = 0;
  let open = true;
  for (const action of actions) {
    const closing = action[7] < 0.5;
    if (open && closing) closes += 1;
    open = !closing;
  }
  return closes;
}

/**
 * A rollout with one array per quantity, one entry per control step, rounded to what a drawing
 * needs: positions to the millimetre, angles to the milliradian. Metres and radians.
 */
function rollout(source, label) {
  const steps = source.steps;
  const mm = round(3);
  const action = steps.map((step) => step.action.map(mm));
  // The step at which the gripper is first told to close; the export records the same rule.
  const firstClose = action.findIndex((values) => values[7] < 0.5);
  const closeStep = firstClose === -1 ? null : firstClose;
  if (source.close_step !== undefined && source.close_step !== closeStep) {
    problem(`${label}: the export says the gripper first closed at step ${source.close_step}, the actions say ${closeStep}.`);
  }
  const moved = source.disturbed?.to_xy
    ? {
        step: source.disturbed.step,
        kind: source.disturbed.kind,
        from: round4(source.disturbed.from_xy),
        to: round4(source.disturbed.to_xy),
      }
    : null;
  return {
    seed: source.seed,
    target: source.target,
    instruction: source.instruction,
    objects: source.objects,
    hz: source.control_hz,
    success: source.success,
    closeStep,
    closes: closesOf(action),
    moved,
    steps: steps.length,
    tcp: steps.map((step) => step.tcp.map(mm)),
    yaw: steps.map((step) => mm(step.yaw)),
    grip: steps.map((step) => round(2)(step.grip)),
    q: steps.map((step) => step.q.map(mm)),
    action,
    poses: Object.fromEntries(source.objects.map((name) => [name, steps.map((step) => step.objects[name].map(mm))])),
  };
}

const settingsKey = (set) => JSON.stringify(Object.entries(set).sort(([a], [b]) => a.localeCompare(b)));

/** The episodes of one condition that every actor publishes: PUBLISHED_TRACES.episodes. */
function chooseSeeds(groups) {
  const [least, most] = PUBLISHED_TRACES.episodes;
  const tally = new Map();
  for (const group of groups) for (const seed of group.outcomes.keys()) tally.set(seed, (tally.get(seed) ?? 0) + 1);
  const candidates = [...tally].sort((a, b) => b[1] - a[1] || a[0] - b[0]).map(([seed]) => seed);
  const chosen = candidates.slice(0, least);
  const mixed = (seeds) => {
    let actors = 0;
    const all = new Set();
    for (const group of groups) {
      const outcomes = new Set(seeds.filter((seed) => group.outcomes.has(seed)).map((seed) => group.outcomes.get(seed)));
      if (outcomes.size === 2) actors += 1;
      for (const outcome of outcomes) all.add(outcome);
    }
    return actors * 2 + (all.size === 2 ? 1 : 0);
  };
  while (chosen.length < most) {
    const now = mixed(chosen);
    let best;
    for (const seed of candidates) {
      if (chosen.includes(seed)) continue;
      const gain = mixed([...chosen, seed]) - now;
      if (gain > 0 && (!best || gain > best.gain)) best = { seed, gain };
    }
    if (!best) break;
    chosen.push(best.seed);
  }
  return new Set(chosen);
}

function writeRollouts(data, selected, frameSteps, previous) {
  const folder = path.join(PUBLIC_DATA, "traces");
  const kept = new Set();
  const traces = [];
  const conditions = [];
  const rates = new Set();
  const finished = new Set(selected.runs.filter((run) => run.status === "finished").map((run) => run.name));

  // The reported row measured under the same conditions as a rollout, when there is one.
  const reported = (run, source) => {
    const rows = run === "expert" ? selected.expert : (selected.probes[run] ?? []);
    return rows.find(
      (row) =>
        settingsKey(row.settings) === settingsKey(source.settings) &&
        (run === "expert"
          ? row.plansAgain === source.plansAgain
          : row.checkpoint === source.checkpoint && row.weights === source.weights),
    )?.variant;
  };

  // The notebook's words for an actor and for a set of conditions, from the comparison tables.
  const tables = selected.comparisons.tables;
  const actorWords = (run, plansAgain) => {
    if (run === "expert") {
      const row = tables.expert?.rows.find((candidate) => candidate.plansAgain === plansAgain);
      return `scripted expert, ${row?.words ?? (plansAgain ? "plans again" : "one plan per episode")}`;
    }
    for (const id of ["outside", "dependsOn"]) {
      const row = tables[id]?.rows.find((candidate) => candidate.run === run);
      if (row) return row.words;
    }
    return RUN_WORDS[run] ?? run;
  };
  const columnWords = new Map();
  for (const id of ["outside", "dependsOn"]) {
    for (const column of tables[id]?.columns ?? []) {
      const probe = Object.values(selected.probes)
        .flat()
        .find((row) => row.variant === column.variant);
      if (probe && !columnWords.has(conditionKey(probe.settings, data.defaults))) {
        columnWords.set(conditionKey(probe.settings, data.defaults), column.words);
      }
    }
  }

  // Every group of rollouts of the actors, by the conditions it was recorded under.
  const groups = [];
  for (const run of data.runs) {
    if (!PUBLISHED_TRACES.actors.includes(run.name) || !finished.has(run.name)) continue;
    for (const row of run.probes) {
      if (row.traceFiles.length === 0) continue;
      groups.push({ run: run.name, row, extra: { checkpoint: row.checkpoint, weights: row.weights, samples: row.samples } });
    }
  }
  if (PUBLISHED_TRACES.actors.includes("expert")) {
    for (const row of data.expert) if (row.traceFiles.length > 0) groups.push({ run: "expert", row, extra: { plansAgain: row.plansAgain } });
  }
  for (const name of PUBLISHED_TRACES.actors) {
    if (name !== "expert" && !finished.has(name)) problem(`PUBLISHED_TRACES names ${name}, which is not a finished run.`);
  }
  const byCondition = new Map();
  for (const group of groups) {
    group.files = [];
    group.outcomes = new Map();
    for (const name of group.row.traceFiles) {
      const file = path.join(exportDir, name);
      if (!existsSync(file)) {
        problem(`${name} is named in runs.json and missing from the export.`);
        continue;
      }
      const source = readJson(file);
      group.files.push({ name, file, source });
      group.outcomes.set(source.seed, source.success);
    }
    const key = conditionKey(group.row.settings, data.defaults);
    if (!byCondition.has(key)) byCondition.set(key, []);
    byCondition.get(key).push(group);
  }

  const add = (source, id, head) => {
    const body = { id, ...head, ...rollout(source, id) };
    const text = stringify(body, 1);
    write(path.join(folder, `${id}.json`), text);
    kept.add(`${id}.json`);
    rates.add(body.hz);
    traces.push({
      id,
      run: head.run,
      actor: head.actor,
      ...(head.plansAgain === undefined ? {} : { plansAgain: head.plansAgain }),
      condition: head.condition,
      conditionWords: head.conditionWords,
      episode: body.seed - data.defaults.seedStart,
      seed: body.seed,
      target: body.target,
      objects: body.objects,
      success: body.success,
      steps: body.steps,
      closeStep: body.closeStep,
      closes: body.closes,
      moved: body.moved ? { step: body.moved.step, kind: body.moved.kind } : null,
      ...(head.frames ? { frames: head.frames } : {}),
      bytes: Buffer.byteLength(text),
    });
  };

  let available = 0;
  for (const [key, list] of byCondition) {
    const seeds = chooseSeeds(list);
    for (const { run, row, extra, files } of list) {
      available += files.length;
      const chosen = files.filter(({ source }) => seeds.has(source.seed));
      if (chosen.length === 0) continue;
      const condition = row.variant.replace(/^traces_/, "");
      const actor = actorWords(run, extra.plansAgain);
      const conditionWords = columnWords.get(key) ?? null;
      conditions.push({
        run,
        actor,
        condition,
        conditionWords,
        task: row.task,
        ...extra,
        settings: row.settings,
        kind: kindOf(row.settings, data.defaults),
        reported: reported(run, row) ?? null,
        traces: chosen.length,
      });
      const head = { run, actor, task: row.task, condition, conditionWords, ...extra };
      for (const { name, source } of chosen) add(source, path.basename(name, ".json"), head);
    }
  }

  // The rollout the camera frames were taken from.
  const framed = path.join(siteExportDir, "expert_trace.json");
  if (existsSync(framed)) {
    const source = readJson(framed);
    const id = `expert__pick_target__frames__trace_${String(source.seed % 1000).padStart(3, "0")}_${source.target}_${source.success ? "ok" : "fail"}`;
    const plain = data.expert.find((row) => row.variant === "plain");
    const actor = actorWords("expert", false);
    conditions.push({
      run: "expert",
      actor,
      condition: "frames",
      conditionWords: plain ? (columnWords.get(conditionKey(plain.settings, data.defaults)) ?? null) : null,
      task: "pick_target",
      plansAgain: false,
      settings: plain?.settings ?? null,
      kind: "baseline",
      reported: plain && selected.expert.some((row) => row.variant === "plain") ? "plain" : null,
      traces: 1,
    });
    add(source, id, {
      run: "expert",
      actor,
      task: "pick_target",
      condition: "frames",
      conditionWords: conditions.at(-1).conditionWords,
      plansAgain: false,
      frames: frameSteps,
    });
  } else {
    // Without the site export the rollout that was published before stays, with its entry.
    for (const trace of previous.traces.filter((entry) => entry.condition === "frames")) {
      if (!existsSync(path.join(folder, `${trace.id}.json`))) continue;
      traces.push(trace);
      kept.add(`${trace.id}.json`);
      conditions.push(...previous.conditions.filter((entry) => entry.run === trace.run && entry.condition === "frames"));
    }
  }

  const exported = path.join(exportDir, "traces");
  const listed = new Set(existsSync(exported) ? readdirSync(exported).filter((name) => name.endsWith(".json")) : []);
  const named = new Set([...data.runs.flatMap((run) => run.probes), ...data.expert].flatMap((row) => row.traceFiles.map((name) => path.basename(name))));
  const stray = [...listed].filter((name) => !named.has(name));
  if (stray.length > 0) problem(`${stray.length} rollouts are in the export and in no evaluation of runs.json: ${stray.join(", ")}`);

  prune(folder, kept, ".json");
  return { traces, conditions, rates, available };
}

// ================================================================ camera frames

/** Width and height of a PNG, from its header. */
function pngSize(buffer) {
  const png = buffer.length > 24 && buffer.readUInt32BE(0) === 0x89504e47 && buffer.toString("ascii", 12, 16) === "IHDR";
  return png ? { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) } : undefined;
}

function writeFrames(previous) {
  const folder = path.join(siteExportDir, "frames");
  if (!existsSync(folder)) return previous.frames; // without the site export the frames stay as they are
  const kept = new Set();
  const frames = [];
  for (const name of readdirSync(folder).filter((file) => file.endsWith(".png")).sort()) {
    const buffer = readFileSync(path.join(folder, name));
    const size = pngSize(buffer);
    if (!size) {
      problem(`${name} is not a PNG image; it was not copied.`);
      continue;
    }
    write(path.join(FRAMES, name), buffer);
    kept.add(name);

    const id = name.replace(/\.png$/, "");
    const layout = /^layout_(\d+)_(front|wrist)$/.exec(id);
    const expert = /^expert_(front|wrist)_(\d+)$/.exec(id);
    const input = /^(front|wrist)_(\d+)$/.exec(id);
    const what = layout
      ? { kind: "layout", camera: layout[2], seed: Number(layout[1]) }
      : expert
        ? { kind: "rollout", camera: expert[1], step: Number(expert[2]) }
        : input
          ? { kind: "input", camera: input[1] }
          : { kind: "other", camera: null };
    frames.push({ id, file: `/tutorial/frames/${name}`, ...size, ...what, bytes: buffer.length });
  }
  prune(FRAMES, kept, ".png");
  return frames;
}

/** Bytes of every file under a folder. */
function folderBytes(folder) {
  if (!existsSync(folder)) return 0;
  let total = 0;
  for (const name of readdirSync(folder)) {
    const file = path.join(folder, name);
    const stat = statSync(file);
    total += stat.isDirectory() ? folderBytes(file) : stat.size;
  }
  return total;
}

// ================================================================ checking what is on disk

/** Without an export: do the generated rows still read as the notebook reads? */
function checkGenerated(notebook) {
  const file = (name) => path.join(GENERATED, name);
  if (!existsSync(file("checkpoints.json"))) {
    say("Generated", `nothing in ${here(GENERATED)} yet; run this with an export.`);
    return;
  }
  const comparisons = existsSync(file("comparisons.json")) ? readJson(file("comparisons.json")) : { tables: {} };
  const inTables = (run, variant) =>
    ["outside", "dependsOn"].some(
      (id) => comparisons.tables[id]?.rows.some((row) => row.run === run) && comparisons.tables[id].columns.some((column) => column.variant === variant),
    );
  let rows = 0;
  let unchecked = 0;
  for (const [run, list] of Object.entries(readJson(file("checkpoints.json")))) {
    for (const row of list) {
      rows += 1;
      if (!row.ema) {
        // A row of the trained weights alone is printed in several forms; it is checked with an export.
        if (!notebook.flat.includes(formatPercent(row.raw.rate))) problem(`${run}, checkpoint ${row.checkpoint}: the notebook has no ${formatPercent(row.raw.rate)}.`);
        unchecked += 1;
        continue;
      }
      if (sectionsWith(notebook, checkpointCells(row)).length === 0 && !inTables(run, "plain")) {
        unchecked += 1;
      }
    }
  }
  const probes = existsSync(file("probes.json")) ? readJson(file("probes.json")) : {};
  for (const [run, list] of Object.entries(probes)) {
    for (const row of list) {
      rows += 1;
      const entries = NOTEBOOK_ROWS[run]?.[row.variant];
      if (entries) citations(notebook, entries, row, `${run} / ${row.variant}`);
      else if (!inTables(run, row.variant)) problem(`${run} / ${row.variant} is in ${here(file("probes.json"))} and in neither NOTEBOOK_ROWS nor a comparison table.`);
    }
  }
  for (const row of existsSync(file("expert.json")) ? readJson(file("expert.json")) : []) {
    rows += 1;
    const entries = NOTEBOOK_ROWS.expert?.[row.variant];
    if (entries) citations(notebook, entries, row, `expert / ${row.variant}`);
  }
  say("Generated", `${rows} rows in ${here(GENERATED)} checked against the notebook${unchecked ? ` (${unchecked} of them only roughly: run with an export for the full check)` : ""}.`);
}

// ================================================================ run

const notebook = readNotebook();
if (!notebook) {
  console.error(`No lab notebook at ${here(NOTEBOOK)}. Run "npm run sync:content" first: the data is checked against it.`);
  process.exit(1);
}
checkHandFile(notebook);

if (!existsSync(path.join(exportDir, "runs.json"))) {
  say("Export", `no runs.json in ${here(exportDir)}; the generated data is left as it is.`);
  more("Copy an export there (python -m sim.pickup.export --out <dir>) or pass its folder to refresh the data.");
  checkGenerated(notebook);
} else {
  let data;
  try {
    data = readExport();
  } catch (error) {
    console.error(`The export in ${here(exportDir)} could not be read: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
  const selected = select(data, notebook);
  const finished = selected.runs.filter((run) => run.status === "finished");
  const inProgress = selected.runs.filter((run) => run.status === "in_progress");
  const exportedAt = new Date(data.time * 1000).toISOString().replace(/\.\d+Z$/, "Z");

  say(
    "Export",
    `${data.runs.length + data.leftOut.length} runs in ${here(exportDir)}, written ${exportedAt}: ${finished.length} finished, ${inProgress.length} in progress, ${data.leftOut.length} left out (LEFT_OUT).`,
  );
  more(`Finished: ${finished.map((run) => run.name).join(", ")}.`);
  more(`In progress, no values: ${inProgress.map((run) => `${run.name}${run.reason === "notebook" && !IN_PROGRESS.includes(run.name) ? " (the notebook says still training)" : ""}`).join(", ") || "none"}.`);
  if (selected.awaited.length > 0) more(`In IN_PROGRESS and not in the export yet: ${selected.awaited.join(", ")}.`);
  more(
    selected.listSection
      ? `The notebook still has "${NOTEBOOK_IN_PROGRESS_SECTION}"; IN_PROGRESS names ${IN_PROGRESS.length} runs.`
      : `The notebook has no "${NOTEBOOK_IN_PROGRESS_SECTION}" any more; IN_PROGRESS names ${IN_PROGRESS.length} runs.`,
  );

  // What comes from the site export (frames, tokenisations, the rollout the frames were taken from)
  // and the tolerance table stay as they are when their source is not there.
  const index = path.join(GENERATED, "files.json");
  const previous = existsSync(index) ? readJson(index) : { grasp: [], traces: [], conditions: [], frames: [] };
  const frames = writeFrames(previous);
  const frameSteps = frames.filter((frame) => frame.kind === "rollout" && frame.camera === "front").map((frame) => frame.step);
  const grasp = writeEpisodes(selected);
  const { traces, conditions, rates, available } = writeRollouts(data, selected, frameSteps, previous);
  const tolerance = readTolerance(notebook);
  const tokenizations = readTokenizations();

  // The control rate comes with the rollouts; the sampler's defaults with the evaluations.
  if (rates.size > 1) problem(`The rollouts were recorded at different control rates: ${[...rates].join(", ")} Hz.`);
  const defaults = { ...data.defaults, controlHz: rates.size === 1 ? [...rates][0] : null };
  const sentence = `${defaults.execHorizon} actions executed per chunk, ${defaults.flowSteps} flow steps, unless stated`;
  if (!notebook.flat.includes(sentence)) problem(`The notebook no longer says "${sentence}"; the export's defaults are ${JSON.stringify(defaults)}.`);

  const graspId = (source) => (source ? path.basename(source, ".json") : undefined);
  const published = new Set(grasp.map((file) => file.id));
  const episodesOf = (source) => (published.has(graspId(source)) ? graspId(source) : undefined);
  const tracesOf = (run, row) =>
    conditions
      .filter((condition) => condition.run === run && condition.reported === row.variant)
      .flatMap((condition) => traces.filter((trace) => trace.run === run && trace.condition === condition.condition))
      .map((trace) => trace.id);

  const tidyEvaluation = (row) => {
    if (!row) return null;
    const { source, ...numbers } = row;
    return { ...numbers, graspFile: episodesOf(source) };
  };
  const tidyProbe = (run) => (row) => {
    const { source, traceFiles, ...rest } = row;
    void traceFiles;
    return { ...rest, graspFile: episodesOf(source), traces: tracesOf(run, row) };
  };

  // The comparison tables, as the order and the words pages build their selectors from; their
  // values stay in checkpoints.json, probes.json and expert.json.
  const { tables, pooled, beforeAfter } = selected.comparisons;
  const shownRuns = new Set(finished.map((run) => run.name));
  const battery = {
    section: tables.outside?.section ?? tables.dependsOn?.section ?? null,
    columns: ["outside", "dependsOn"].flatMap((id) =>
      (tables[id]?.columns ?? []).filter((column) => column.variant).map((column) => ({ variant: column.variant, words: column.words, table: id })),
    ),
    runs: [...new Set(["outside", "dependsOn"].flatMap((id) => tables[id]?.rows ?? []).map((row) => row.run))]
      .filter((run) => shownRuns.has(run))
      .map((run) => {
        const plain = selected.probes[run]?.find((row) => row.variant === "plain");
        const words = ["outside", "dependsOn"].map((id) => tables[id]?.rows.find((row) => row.run === run)?.words).find(Boolean);
        return { run, words, checkpoint: plain?.checkpoint ?? null, weights: plain?.weights ?? null };
      }),
    expert: {
      columns: (tables.expert?.columns ?? []).filter((column) => column.variant).map((column) => ({ variant: column.variant, words: column.words })),
      rows: tables.expert?.rows ?? [],
    },
  };
  const comparisonTables = Object.fromEntries(
    Object.entries(tables)
      .filter(([id]) => !["outside", "dependsOn", "expert"].includes(id))
      .map(([id, table]) => [
        id,
        { section: table.section, columns: table.columns.map((column) => column.words), rows: table.rows.filter((row) => shownRuns.has(row.run)) },
      ]),
  );

  const files = { grasp, traces, conditions, frames };
  const outputs = {
    "meta.json": [
      {
        source: "python -m sim.pickup.export",
        exportedAt,
        machine: mostCommon(finished.map((run) => run.machine)),
        defaults,
        runs: { finished: finished.length, inProgress: inProgress.length, leftOut: data.leftOut.length },
        awaited: selected.awaited.map((name) => {
          const design = designOf(name, existsSync(HAND_FILE) ? (readJson(HAND_FILE).datasets?.rows ?? []) : []);
          return { name, words: RUN_WORDS[name] ?? null, design, group: { fix: design.positionFix ? "after" : "before", family: familyOf(name, design), order: null } };
        }),
        inProgressList: IN_PROGRESS,
        leftOut: data.leftOut,
        unreported: selected.unreported,
      },
      3,
    ],
    "runs.json": [selected.runs, 1],
    "checkpoints.json": [
      Object.fromEntries(
        Object.entries(selected.checkpoints).map(([run, rows]) => [
          run,
          rows.map((row) => ({ ...row, raw: tidyEvaluation(row.raw), ema: tidyEvaluation(row.ema) })),
        ]),
      ),
      2,
    ],
    "probes.json": [Object.fromEntries(Object.entries(selected.probes).map(([run, rows]) => [run, rows.map(tidyProbe(run))])), 2],
    "expert.json": [selected.expert.map(tidyProbe("expert")), 1],
    "comparisons.json": [{ beforeAfter, pooled, tables: comparisonTables, battery }, 4],
    "loss-curves.json": [selected.curves, 1],
    "files.json": [files, 2],
  };
  if (tolerance) outputs["tolerance.json"] = [tolerance, 2];
  if (tokenizations) outputs["tokenizations.json"] = [tokenizations, 2];
  for (const [name, [value, depth]] of Object.entries(outputs)) write(path.join(GENERATED, name), stringify(value, depth));
  prune(GENERATED, new Set([...Object.keys(outputs), "tolerance.json", "tokenizations.json"]), ".json");
  write(path.join(PUBLIC_DATA, "index.json"), stringify(files, 2));

  const total = (map) => Object.values(map).reduce((sum, list) => sum + list.length, 0);
  const evaluated = data.runs.filter((run) => finished.some((entry) => entry.name === run.name));
  say(
    "Reported",
    `${total(selected.checkpoints)} of ${evaluated.reduce((sum, run) => sum + run.checkpoints.length, 0)} checkpoints of the finished runs, ${total(selected.probes)} probes (the plain rows included) and ${selected.expert.length} of ${data.expert.length} expert evaluations are in the notebook.`,
  );
  for (const run of finished) {
    const rows = selected.checkpoints[run.name] ?? [];
    const skipped = selected.unreported.checkpoints[run.name];
    const probes = selected.probes[run.name]?.length ?? 0;
    const single = rows.filter((row) => !row.ema).length;
    more(
      `${run.name}: ${rows.length} checkpoint${rows.length === 1 ? "" : "s"}` +
        (single ? ` (${single} with the trained weights alone)` : "") +
        (skipped ? ` (not in the notebook: ${skipped.join(", ")})` : "") +
        (probes ? `, ${probes} probes` : "") +
        (run.best ? `, best ${formatPercent(run.best.rate)} (${run.best.weights}, ${formatSamples(run.best.samples)})` : "") +
        (run.stopped ? ", stopped" : "") +
        `; machine ${run.machine ?? "?"}.`,
    );
  }
  say(
    "Comparisons",
    `${beforeAfter.map((entry) => `${entry.before} / ${entry.after}: ${entry.rows.length} rows`).join("; ") || "no before/after pair"}; ` +
      `battery: ${battery.runs.length} runs, ${battery.columns.length} conditions; expert: ${battery.expert.rows.length} rows; pooled by object: ${Object.keys(pooled).length} runs.`,
  );
  const { ahead, reportedListed } = selected.comparisons;
  if (ahead.size > 0) {
    say("Ahead", "the notebook reports more of these runs in progress than the export holds (they keep no values until both agree):");
    for (const [name, cells] of ahead) more(`${name}: ${cells} cell${cells === 1 ? "" : "s"} the export cannot check yet.`);
  }
  for (const [name, sections] of reportedListed) {
    say("Reported?", `IN_PROGRESS names ${name}, and "${[...sections].join('", "')}" reports it without "still training". Once the export has its final evaluations, take it off IN_PROGRESS and sync.`);
  }
  const unreportedProbes = Object.entries(selected.unreported.probes);
  if (unreportedProbes.length > 0 || selected.unreported.expert.length > 0) {
    say("Left out", "evaluations the notebook does not report (add their row to NOTEBOOK_ROWS once it does):");
    for (const [run, variants] of unreportedProbes) more(`${run}: ${variants.join(", ")}.`);
    if (selected.unreported.expert.length > 0) more(`expert: ${selected.unreported.expert.join(", ")}.`);
  }
  if (tolerance) say("Tolerance", `${tolerance.offsets.length} offsets, ${tolerance.episodesPerOffset} episodes each: the notebook's table for machine ${tolerance.machine ?? "?"}.`);
  else say("Tolerance", `no tolerance.json in ${here(exportDir)}; the table in ${here(GENERATED)} is left as it is.`);
  if (tokenizations) say("Tokens", `${tokenizations.sentences.length} sentences and a padded batch of ${tokenizations.chatTemplate.length}, ${tokenizations.tokenizer}.`);
  const absent = ["frames", "tokenizations.json", "expert_trace.json"].filter((name) => !existsSync(path.join(siteExportDir, name)));
  if (absent.length > 0) say("Site export", `no ${absent.join(", ")} in ${here(siteExportDir)}; what was published from there before is left as it is.`);
  const size = (list) => `${(list.reduce((sum, item) => sum + item.bytes, 0) / 1e6).toFixed(1)} MB`;
  say("Public", `${grasp.length} per-episode files (${size(grasp)}) and ${traces.length} of ${available} rollouts (${size(traces)}) in ${here(PUBLIC_DATA)}; ${frames.length} frames (${size(frames)}) in ${here(FRAMES)}.`);
  const tracesBytes = folderBytes(path.join(PUBLIC_DATA, "traces"));
  const allBytes = folderBytes(PUBLIC_DATA);
  more(`On disk: ${(tracesBytes / 1e6).toFixed(2)} MB of rollouts, ${(allBytes / 1e6).toFixed(2)} MB in ${here(PUBLIC_DATA)} in all.`);
  if (tracesBytes > PUBLIC_LIMITS.traces) problem(`public/data/traces holds ${(tracesBytes / 1e6).toFixed(2)} MB, more than ${PUBLIC_LIMITS.traces / 1e6} MB: publish fewer rollouts (PUBLISHED_TRACES).`);
  if (allBytes > PUBLIC_LIMITS.all) problem(`public/data holds ${(allBytes / 1e6).toFixed(2)} MB, more than ${PUBLIC_LIMITS.all / 1e6} MB.`);
  say("Files", `${written.added} new, ${written.updated} updated, ${written.unchanged} unchanged, ${written.removed} removed.`);
}

if (problems.length > 0) {
  console.warn(`\nNeeds attention (${problems.length}):`);
  for (const text of problems) console.warn(`  - ${text}`);
  process.exitCode = 2;
}
