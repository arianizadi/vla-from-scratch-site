# The data module

Every measured number the site shows comes from this folder. Tables, charts and figures import
it; none of them states a number of its own.

```
src/data/
  generated/            written by scripts/sync-data.mjs from the experiment export; do not edit
  notebook.json         numbers that are only in the lab notebook, copied by hand, each with its source
  findings.json         the landing page's findings, copied by hand, each with its source
  runs.ts               the runs: finished or in progress, labels, the date of the data
  checkpoints.ts        closed-loop evaluations by checkpoint, trained and averaged weights
  probes.ts             evaluations under other conditions; the battery after the fix; the scripted expert
  comparisons.ts        the notebook's tables that compare runs: before/after the fix, pooled by object
  curves.ts             loss curves
  tolerance.ts          grasp tolerance on both machines
  tokens.ts             real tokenisations
  files.ts              the index of the public files, and loaders for them
  use-public-data.ts    the same loaders as React hooks
  evaluations.ts        from a public per-episode file to the evaluation it belongs to
  notebook.ts           typed access to notebook.json
  labels.ts             words for runs, conditions, objects, machines
  format.ts             numbers printed the way the notebook prints them
  notebook-format.mjs   the rounding behind format.ts, shared with the sync script
  lab.ts                what the landing page imports
  types.ts              the shared shapes
public/data/            the larger files, fetched by figures in the browser
public/tutorial/frames/ camera frames
```

## The rules

1. **No component types a measured number.** A number on a page is read from this module, or is
   part of a chapter's text. If a figure needs a number that is not here, add it here: to the
   export, or, when only the notebook has it, to `notebook.json` with the passage it was copied
   from.
2. **A run in progress has no value.** `runs()` lists it with a name and a label, and its type
   (`RunInProgress`) has no field to read a result from. It has no checkpoints, no probes, no
   loss curve and no public file. Show it as in progress. Build every selector, table and caption
   from the module's own lists and statuses (`runsByGroup`, `batteryRuns`, `comparisonRows`, ...):
   runs finish and new runs appear when the data is refreshed, and nothing a page writes may
   assume which.
3. **The site reports what the lab notebook reports.** The export holds more evaluations than
   the notebook prints. Only the ones the notebook prints are in the generated data: checkpoint
   rows are matched to the notebook's tables automatically, the comparison tables after the fix
   cell by cell, other probes to the notebook row named for them in `scripts/sync-data.mjs`. A
   cell that disagrees with the export is reported by the sync and left out, never resolved. For
   a reported evaluation the data carries more detail than the notebook (counts per object, the
   interval, every episode); it never carries an evaluation the notebook does not have.
   `unreported` in `runs.ts` names what was left out.
4. **Print numbers with `format.ts`.** It rounds as the notebook's tables do, so 83/100 reads
   "83%" and a slope of 0.9819 reads "0.98" on the site as in the notebook. Do not use
   `toFixed` or `Math.round` on a measured value: they round a tie the other way (3 of 24 is
   "12%" in the notebook).
5. **Hardware has two names:** `MACHINES.A.label`, "machine A (one RTX 4090, 24 GB)", and
   `MACHINES.B.label`, "machine B (L40S GPUs)".

## Where each finding is

| Finding | Read it from |
|---|---|
| 0% after 1M samples, 36% after 2M, 85% after 5M | `checkpoints("dp_vit_lang_reactive_pt4k")`: `.raw.rate`, `.ema.rate` by `.samples` |
| The failing policies were not imprecise; slope near 0 | `.raw.slope`, `.ema.slope` and `.named` of any checkpoint; `finalCheckpoint("dp_vit_pt1500")`; its episodes through `loadGrasp` |
| With history: 1/100 as served, 22/100 told the expert's first action, 77/100 after an expert prefix | `probes("dp_vit_lang_pt4k")` |
| Cameras frozen on the first frame: still at the named object in 99% of episodes | `probe("dp_vit_lang_reactive_pt4k", "probe_stale_images").named` |
| Object moved mid-reach: 0 of 96, the gripper closes where the object was | `disturbances("dp_vit_lang_reactive_pt4k")`; the rollouts through `traces` and `loadTrace` |
| Averaged weights lead during the transition | `.ema` against `.raw` in `checkpoints(...)` |
| Two sampling steps are enough | `flowStepSweep("dp_vit_lang_reactive_pt4k")` |
| What still fails: the grasp angle of the T block and the cube | `remainingFailures` in `notebook.ts`; `.perObject` of a checkpoint |
| 641 distinct positions of 2048 | `positionTable` in `notebook.ts` |
| Pooled embedding 4% against patch tokens 30% on the single cube | `pickCube` in `notebook.ts` |
| Loss does not predict success | `lossCurve(run)` beside `checkpoints(run)`; `firstRound` and `pickCube` in `notebook.ts` for the first-round rows |
| How much placement error a grasp tolerates, per object and machine | `tolerance("B")`, `tolerance("A")` |
| The scripted expert solves the task | `expert()`; on machine A and on the single cube, `expertElsewhere` in `notebook.ts` |
| Where the first-round policies closed the gripper | `firstRound.grasp` in `notebook.ts` |
| History on the single cube | `checkpoints("dp_vit_cube1k")` against `checkpoints("dp_vit_lang_reactive_cube1k")` |
| Which demonstrations: every object named, early windows repeated | `finalCheckpoint` of `dp_vit_lang_reactive_pt1500`, `..._cf` and `..._cf_early` |
| Sampler settings: actions executed per chunk, the same starting noise | `execHorizonSweep("dp_vit_lang_reactive_pt4k")` |
| The first action chunk, open loop | `openLoop` in `notebook.ts` |
| The expert when the object is moved, with one plan and planning again | `disturbanceNotes.expert` in `notebook.ts` |
| The from-scratch stages | `stageResults` in `notebook.ts` (`stageResults.machineB.vlmAfterFix` for the VLM retrained after the fix); the language model's loss curve, `lossCurve("custom_llm")` |
| **After the position fix** | |
| The same recipe after the fix ends at 93% and starts to look earlier | `beforeAfter("dp_vit_lang_reactive_pt4k_posfix")`: `.rows[i].before.raw` against `.rows[i].after.raw` by `.samples`; `.perObject` at the final checkpoint |
| Its final checkpoint, trained weights (it saved no averaged ones) | `finalCheckpointRow("dp_vit_lang_reactive_pt4k_posfix").raw` (`finalCheckpoint` is undefined for it: it has no row with both weights) |
| Random start poses: 98%, and a policy that works from other start poses | `finalCheckpointRow("dp_vit_lang_reactive_pt4k_rs_posfix")`; `batteryCell("dp_vit_lang_reactive_pt4k_rs_posfix", "random_start")` |
| Demonstrations with recoveries: follows a moved object, tries again after a missed grasp | `battery("dp_vit_lang_reactive_pt4k_recover_posfix")`: the cells of kind `disturbance`, `.retried`; against the same cells of the other `batteryRuns()` |
| Every policy trained on clean demonstrations fails when the object is moved | `battery(run)` of each run of `batteryRuns()`, the cells whose `variant` starts with `disturb_` |
| The scripted expert with one plan, and planning again, under the same conditions | `expertBattery()` |
| What the demonstrations contain, at fixed points of training | `comparisonRows("demonstrations")` for the runs and their words, `checkpointRows(run)` for the values, `run(name).best` |
| Success by object, pooled over the last checkpoints | `pooledPerObject(run)`; the runs: `comparisonRows("demonstrationsObjects")` |
| What the policies after the fix depend on (frozen cameras, an expert prefix, 2 flow steps) | `battery(run)` cells with `table === "dependsOn"` |
| Single cube after the fix | `checkpoints("dp_vit_cube1k_posfix")`, `checkpointRows("dp_vit_lang_reactive_cube1k_posfix")` |
| The Qwen backbone with one action-token vector | `checkpointRows("vla_qwen_pt1500")` (trained weights alone) |
| Runs still in progress after the fix: the second seed, the history policy on hold-frame demonstrations, the from-scratch VLA with either backbone, the Qwen backbone with every token | `runsByGroup({ fix: "after" })` filtered on `status === "in_progress"`, and `awaitedRuns()`; no values until the notebook reports them |

The tutorial's field notes (`tutorial/notes.md`) are the source of these findings' wording, not
of their numbers: they also quote results of runs in progress and a few numbers the notebook
does not print. A page built from the notes takes every number from this module; what is not
here is not stated.

## The modules

Import from the module that has what you need (`@/data/checkpoints`, not a barrel): a figure's
chunk then carries only the data it draws.

### `runs.ts`

```ts
import {
  runs, run, finishedRuns, unfinishedRuns, isFinished, runsByGroup, awaitedRuns,
  exportedAt, evaluationDefaults, unreported,
} from "@/data/runs";

runs();                                   // every run of the export but those left out, finished or in progress
run("dp_vit_lang_reactive_pt4k")?.label;  // "4000 demonstrations, no history"
run("dp_vit_lang_reactive_pt4k_recover_posfix")?.label;   // "Recoveries": the notebook's words (.words is "recoveries")
run("dp_vit_lang_reactive_pt4k_recover_posfix")?.group;   // { fix: "after", family: "demonstrations", order: ... }
runsByGroup({ fix: "after", family: "demonstrations" });  // a selector's runs, in the notebook's order; check each .status
awaitedRuns();                            // listed as in progress, not in the export yet: [{ name, label, words, design, group }]
finishedRuns().map((entry) => entry.name);
unfinishedRuns();                         // show each as in progress; there is no value to show
const entry = run("dp_vit_lang_pt4k");
if (isFinished(entry)) entry.samples;     // 2996288: where the run stood when it was stopped (entry.stopped is true)
exportedAt;                               // "2026-11-12T02:28:45Z", the date of the data (UTC)
evaluationDefaults;                       // { execHorizon: 8, flowSteps: 10, seedStart: 1000000, episodes: 100, controlHz: 20 }
unreported.probes;                        // names of probes the export has and the notebook does not report
```

A finished run has `samples`, `stopped`, `finalLoss`, `machine`, `sections` (the notebook
headings that report it) and `best` (its best checkpoint, when the notebook names one). Every
run has `design` (what its name says about the policy, its inputs, its dataset, its seed), `words`
(the notebook's words for it, or null) and `group`:

| `group.fix` | `"before"` or `"after"` the position fix (`POSITION_FIX` in labels.ts has the words) |
|---|---|
| `group.family` | `"reference"` (the recipe that works), `"demonstrations"` (what the demonstrations contain), `"history"`, `"single_cube"`, `"backbones"` (the from-scratch stages and the VLAs), `"first_round"` (the first comparisons of inputs and budget); `RUN_FAMILIES` in labels.ts has a heading and a sentence for each |
| `group.order` | where the notebook first prints the run; `runsByGroup` sorts by it |

### `checkpoints.ts`

```ts
import { checkpoints, checkpointAt, finalCheckpoint, evaluationOf, runsWithCheckpoints } from "@/data/checkpoints";
import { formatBoth, formatPercent, formatSamples } from "@/data/format";

for (const row of checkpoints("dp_vit_lang_reactive_pt4k")) {
  formatSamples(row.samples);                                  // "0.5M" ... "5.0M"; row.final marks "5.0M (final)"
  formatBoth(row.raw.rate, row.ema.rate, formatPercent);       // "83% / 85%": trained / averaged
}
checkpointAt("dp_vit_lang_reactive_pt4k", 2.0e6)?.ema.rate;    // 0.36, the reported checkpoint nearest to 2.0M
finalCheckpoint("dp_vit_lang_reactive_pt4k")?.ema.perObject;   // { can: { successes: 26, episodes: 28 }, ... }
evaluationOf("dp_vit_lang_reactive_pt4k", 11, "ema")?.graspFile; // id of its per-episode file, when published
runsWithCheckpoints();                                         // the runs that have rows with both weights

// Rows whose averaged weights may be missing: not saved (several runs after the fix), or not printed.
import { checkpointRows, finalCheckpointRow, checkpointRowAt, runsWithCheckpointRows } from "@/data/checkpoints";
finalCheckpointRow("dp_vit_lang_reactive_pt4k_posfix")?.raw.rate;   // 0.93; .ema is null
checkpointRows("dp_vit_lang_reactive_pt4k_rs_posfix").map((row) => formatBoth(row.raw.rate, row.ema?.rate ?? null, formatPercent));
```

`checkpoints(run)` returns only the rows with both weights, so a figure that draws both never
meets a missing one; a run reported with its trained weights alone has none there. Use
`checkpointRows(run)` (type `CheckpointRow`, `ema: Evaluation | null`) to have every reported row.

A row has `checkpoint`, `samples`, `final`, and one `Evaluation` each for `raw` (the trained
weights) and `ema` (their running average):

| Field | Meaning |
|---|---|
| `successes`, `episodes`, `rate` | closed-loop success on unseen layouts |
| `ci` | Wilson 95% interval of the rate, `[low, high]` |
| `named` | share of episodes in which the object nearest the gripper, when it first closed, was the named one (chance is one in three) |
| `slope` | slope of where the gripper closed against where the named object was: 1 goes to the object, 0 ignores the scene |
| `missMm`, `missNearestMm` | median distance at closing to the named and to the nearest object |
| `within10`, `within20` | share that closed within 10 and 20 mm of the named object |
| `wrongObject`, `retried` | share that lifted another object; share with a second grasp attempt (null in older evaluations) |
| `perObject` | successes and episodes per named object |
| `graspFile` | id of the public file with its episodes, when it is published |

The notebook prints every checkpoint of some runs, every second one of others, and only the
final one of the rest; the data follows it.

### `probes.ts`

```ts
import { probes, probe, baseline, probedRuns, disturbances, flowStepSweep, execHorizonSweep, expert, expertRows } from "@/data/probes";
import { conditionLabel } from "@/data/labels";

probes("dp_vit_lang_pt4k");                                 // as served 1/100, expert's first action 22/100, expert prefix 77/100
probes("dp_vit_lang_reactive_pt4k", "intervention");        // frozen cameras, expert prefixes toward another object
probe("dp_vit_lang_reactive_pt4k", "probe_stale_images")?.named;   // 0.99
baseline("dp_vit_lang_reactive_pt4k");                      // the probed checkpoint itself: 85/100
probedRuns();                                               // ["dp_vit_lang_pt4k", "dp_vit_lang_reactive_pt4k"]
conditionLabel(probe("dp_vit_lang_pt4k", "probe_prefix10_named")!.settings);
// "the expert drives the first 10 steps, then the policy takes over"

disturbances("dp_vit_lang_reactive_pt4k");
// in the notebook's order; at step 20: { successes: 0, episodes: 96, retried: 31, fromOldMm: 8.49, fromNewMm: 78.1, ... }
flowStepSweep("dp_vit_lang_reactive_pt4k");
// [{ flowSteps: 1, first: 61/100, latencyMs: 20.7 }, { flowSteps: 2, first: 89/100, second: 90/100, ... }, ...]
execHorizonSweep("dp_vit_lang_reactive_pt4k");
// [{ executed: 2, fresh: 76/100, tblock: 8/23, sameNoise: 39/100 }, ..., { executed: 15, wholeChunk: true, ... }]

expert();                                                   // the scripted expert, 100 layouts on machine B: 100/100
expertRows();                                               // every reported evaluation of it
```

The battery: each run's final checkpoint (averaged weights where the run saved them) under the
conditions of the notebook's two tables "How each policy copes outside the conditions it was
trained in" and "What the same policies depend on".

```ts
import { battery, batteryCell, batteryRuns, batteryConditions, expertBattery } from "@/data/probes";

batteryRuns();             // the rows, in the notebook's order: [{ run, words: "recoveries", checkpoint: 11, weights: "ema" }, ...]
batteryConditions();       // the columns: [{ variant: "plain", words: "Standard", table: "outside" }, ..., { variant: "sweep_h8_s2", words: "2 flow steps", table: "dependsOn" }]
battery("dp_vit_lang_reactive_pt4k_recover_posfix");       // one cell per reported column, in that order
batteryCell("dp_vit_lang_reactive_pt4k_recover_posfix", "disturb_grasp");
// { successes: 78, episodes: 99, retried: 99, words: "Moved at the grasp", kind: "disturbance", fromOldMm: null, probe: {...} }
expertBattery();           // [{ words: "one plan per episode", plansAgain: false, cells: [...] }, { words: "plans again", ... }]
expertBattery()[1].cells.find((cell) => cell.variant === "disturb_reach20");   // 96/96; .expertVariant "plans_again_disturb_reach20"
```

A cell counts what the notebook counts: for a moved object, the episodes in which it could be
moved (`probe` holds the whole evaluation). `retried` is the episodes with a second grasp attempt
among those. `disturbances(run)` stays the rows of the notebook's "Disturbances" table: the moves
from the usual start pose.

A probe is an `Evaluation` with `variant` (the export's name for the conditions), `kind`
(`baseline`, `intervention`, `disturbance`, `sampler`, `layouts`), the probed `checkpoint`,
`weights` and `samples`, its `settings`, `latencyMs`, `sections`, and the ids of the `traces`
recorded under the same conditions.

For a disturbance, use `disturbances(run)` or the probe's `moved`: the notebook counts the
episodes in which the object could be moved (0/96), not all hundred (the probe's own
`successes` include the four episodes in which no free place was found).

### `curves.ts`

```ts
import { lossCurve } from "@/data/curves";

lossCurve("dp_vit_lang_reactive_pt4k");   // [[16704, 1.75731], ..., [4998848, 0.03946]]: samples seen, loss
```

At most 300 points per run. Empty for a run in progress.

### `tolerance.ts`

```ts
import { tolerance, toleranceAt, TOLERANCE_COLUMNS } from "@/data/tolerance";

tolerance("B").rows;                 // machine B, from the export: percent and counts per object and offset
tolerance("A").rows;                 // machine A, from the notebook: percent only
toleranceAt("B", 20)?.percent.can;   // 29
toleranceAt("B", 20)?.counts?.can;   // { successes: 26, episodes: 89 }
TOLERANCE_COLUMNS;                   // ["cube", "tblock", "can", "hex", "all"], the notebook's column order
```

### `tokens.ts`

```ts
import { tokenizer, tokenizations, tokenization, paddedBatch, displayPiece } from "@/data/tokens";

tokenizer.name;                                    // the tokenizer of the from-scratch models
tokenization("pick up the blue hex nut")?.ids;     // [18188, 614, 260, 4461, 17967, 2236]
tokenizations().map((sentence) => sentence.pieces.map(displayPiece));
paddedBatch();                                     // the four instructions in the chat template; mask 0 marks padding
```

### `files.ts` and `use-public-data.ts`

```ts
import { graspFiles, traces, sideBySide, traceCondition, traceConditions, frames, loadGrasp, loadTrace } from "@/data/files";
import { useGrasp, useTrace } from "@/data/use-public-data";

graspFiles({ run: "dp_vit_lang_reactive_pt4k", kind: "disturbance" });   // which evaluations have episodes published
traces({ run: "dp_vit_lang_reactive_pt4k", condition: "disturb_reach20", target: "hex" });
traces({ conditionWords: "Moved at step 20", episode: 0 });    // every actor on the same layout
sideBySide("Moved at step 20");                    // { actors: ["before the fix, plain demonstrations", ..., "scripted expert, plans again"], episodes: [0, 1, 2] }
traceConditions();                                 // one entry per run and condition, with its settings
traceCondition("expert", "plans_again_disturb_reach20")?.plansAgain;     // true
frames({ kind: "layout", camera: "front" });       // [{ file: "/tutorial/frames/layout_1000000_front.png", width: 448, ... }]

// In a client component: the file is requested after the figure has mounted.
const rollout = useTrace(id);                      // { status: "loading" } | { status: "ready", data } | { status: "error", error }
const episodes = useGrasp(evaluation.graspFile);

// Or without the hook, from an effect or an event handler:
const trace = await loadTrace(id);
const file = await loadGrasp(id);
```

`loadGrasp` and `loadTrace` reject on the server: the static HTML of a page holds the figure's
loading state, so draw something there that already reads (the frame, the axes, the caption).

### `evaluations.ts`

```ts
import { evaluationOfGraspFile } from "@/data/evaluations";

const file = graspFiles({ run: "dp_vit_lang_reactive_pt4k", variant: "plain", weights: "ema" }).at(-1)!;
evaluationOfGraspFile(file);         // the evaluation whose episodes the file holds: 85/100, median miss 7 mm
```

It reads the checkpoints and the probes, which is why it is not part of `files.ts`.

### `comparisons.ts`

```ts
import { beforeAfter, beforeAfterPairs, pooledPerObject, comparisonRows } from "@/data/comparisons";

const pair = beforeAfter("dp_vit_lang_reactive_pt4k_posfix")!;   // before: dp_vit_lang_reactive_pt4k, weights ["raw"]
pair.rows.map((row) => [row.samples, row.before?.raw?.rate, row.after?.raw?.rate]);   // "0.5M" ... "5.0M"
pair.perObject?.after.counts.tblock;           // { successes: 20, episodes: 23 } at the final checkpoint
beforeAfterPairs();                             // also the second seed, old table against fixed, once it is reported
pooledPerObject("dp_vit_lang_reactive_pt4k_rs_posfix");   // { checkpoints: [9, 10, 11], weights: ["raw", "ema"], perObject: {...} }
comparisonRows("demonstrations");               // { section, columns: ["0.5M", ...], rows: [{ run, words }] }: finished runs only
```

A side of a before/after row is null while its run is in progress.

### `notebook.ts`

Numbers that only the notebook has. Percentages here are whole numbers as written (74, not
0.74).

```ts
import {
  setup, datasets, dataset, datasetEpochs, expertElsewhere, disturbanceNotes, toleranceMachineA, simulatorMachineB,
  pickCube, firstRound, stageResults, positionTable, remainingFailures, openLoop, inferenceNotes, throughput, notebookOnly,
} from "@/data/notebook";

setup.success;                       // { liftCm: 8, holdSteps: 10, holdSeconds: 0.5, maxSteps: 200 }
datasets;                            // the "Datasets" table: name, episodes, windows, what is in it
dataset("pick_target_4k")?.windows;  // 263289
datasetEpochs;                       // [{ dataset: "pick_target_1500", samples: "1M", epochs: 10.1 }, ...]
expertElsewhere.machineA;            // { successes: 99, episodes: 100, task: "pick_target" }
disturbanceNotes.expert;             // where the notebook reports the expert under disturbances now; its numbers are expertBattery()
toleranceMachineA.rows;              // use tolerance("A") in tolerance.ts instead
simulatorMachineB;                   // the simulator build of machine B
pickCube.rows;                       // pooled vector 2/50 = 4%; patch tokens 15/50 = 30%, 20/50, 37/50 = 74%
firstRound.rows;                     // pick_target on machine A: dp_vit 1/100, the Qwen VLA 0/50 ... 6/100, vla_custom 0/100
firstRound.grasp.rows;               // where their grippers closed: named 32%, miss 185 mm, ...
stageResults.rows;                   // the three from-scratch stages; stageResults.machineB for machine B
stageResults.machineB.vlmAfterFix;   // the VLM retrained after the fix: loss, captioning check
positionTable.distinct;              // 641 (of positionTable.positions, 2048)
positionTable.noHistory;             // tokens before the actions, the action positions (firstActionPosition, lastActionPosition)
remainingFailures.rows;              // per object: pooled success, miss, yaw error, height
openLoop.policyHeadsForNamed;        // { training: 35, unseen: 48 }; openLoop.otherNamedHeadsForIt, .instructionSpreadCm
inferenceNotes.defaultLatency.ms;    // 71: the one latency the export does not carry
throughput.rows;                     // samples per second on both machines, as written
notebookOnly;                        // the whole file
```

Every part has `section`, the notebook heading it was copied from, and its entries have
`quotes`, the passages.

### `labels.ts`

```ts
import {
  MACHINES, OBJECTS, OBJECT_IDS, TASKS, WEIGHTS, WEIGHT_IDS, CONDITION_KINDS, RUN_FAMILIES, RUN_FAMILY_IDS, POSITION_FIX,
  instructionFor, expertLabel, runLabel, inputsLabel, policySeries, conditionLabel,
} from "@/data/labels";

MACHINES.B.label;                         // "machine B (L40S GPUs)"; MACHINES.B.name is "machine B"
OBJECTS.hex.label;                        // "blue hex nut"; .short "Hex nut"; .series "hex_nut" (a key of the kit's OBJECT_SERIES)
OBJECT_IDS;                               // ["hex", "cube", "can", "tblock"], the order every chart uses
instructionFor("tblock");                 // "pick up the yellow T block"
TASKS.pick_target.label;                  // "Named object"
WEIGHTS.ema.label;                        // "averaged weights"; WEIGHTS.raw.label "trained weights"; WEIGHT_IDS ["raw", "ema"]
expertLabel(true);                        // "Scripted expert that plans again"
runLabel(run("dp_vit_lang_reactive_pt1500_3M")!);                     // "1500 demonstrations, no history, 3M samples"
runLabel(run("dp_vit_lang_reactive_pt4k")!, { budget: true });        // "4000 demonstrations, no history, 5M samples"
inputsLabel(run("dp_vit_pt1500")!.design);                            // "no language, history"
policySeries(run("dp_vit_pt1500")!.design);                           // "vit_tokens" (a key of the kit's POLICY_SERIES)
runLabel(run("dp_vit_lang_reactive_pt4k_rs_posfix")!);              // "Random starts": the notebook's words
runLabel(run("dp_vit_lang_reactive_pt4k_rs_posfix")!, { recipe: true });   // "4000 demonstrations, no history, random start poses, position fix"
RUN_FAMILIES.demonstrations.label;                                    // "What the demonstrations contain"; RUN_FAMILY_IDS for their order
POSITION_FIX.after.label;                                             // "after the position fix"
conditionLabel(row.settings);                                         // "the object is moved at step 20 of the reach"
conditionLabel(row.settings, { short: true });                        // "moved at step 20"
conditionLabel(plain.settings, { baseline: "as served" });            // the word for the default conditions
CONDITION_KINDS.disturbance;                                          // "The object is moved"
```

### `format.ts`

```ts
import {
  MISSING, fixed, formatPercent, formatCount, formatSuccess, formatInterval, formatSlope, formatMm, formatMs,
  formatWhole, formatSamples, formatBoth, formatBudget, parseSamples,
} from "@/data/format";

formatPercent(0.85);                       // "85%"          formatPercent(null) is MISSING, "-"
formatCount(83, 100);                      // "83/100"
formatSuccess({ successes: 37, episodes: 50 });   // "37/50 = 74%"
formatInterval([0.604, 0.841]);            // "60-84%"
formatSlope(0.9819);                       // "0.98"
formatMm(7.36);                            // "7 mm"
formatMs(24.9);                            // "25 ms"
formatWhole(7.36);                         // "7"
formatSamples(4993664);                    // "5.0M"
formatBoth(0.83, 0.85, formatPercent);     // "83% / 85%"; formatBoth(7.4, 7.2, formatMm) is "7 / 7 mm"
formatBudget(1500000);                     // "1.5M"
parseSamples("300k");                      // 300000: the notebook's short form as a number, for an axis
fixed(12.5);                               // "12": a tie goes to the even digit, as in the notebook
```

### `lab.ts`

What the landing page imports: `findings`, `stages`, `stageHardware`, `stageComparison`,
`conventions`, `runsInProgress` (from `findings.json`), and `heroRuns`, `chunking`, `camera` for
the hero plate, which are derived: the expert from the export, the first-round policy and the
camera from `notebook.json`, the chunking from both.

## The public files

Fetched by figures in the browser, from this site only. `public/data/index.json` lists them; the
same list is `src/data/generated/files.json`, which `files.ts` imports.

Positions are in metres in the robot's frame: the origin is its base, which stands on the table
top; x points away from the base over the table, y to the robot's left, z up. Angles are in
radians. The same `seed` is the same layout in every file.

**`/data/grasp/<id>.json`**: the episodes of one evaluation (about 30 kB).

```jsonc
{
  "id": "dp_vit_lang_reactive_pt4k__pick_target__disturb_reach20",
  "run": "dp_vit_lang_reactive_pt4k",      // or "expert"
  "task": "pick_target",
  "variant": "disturb_reach20",            // "plain" for a checkpoint under the default conditions
  "checkpoint": 11, "weights": "ema", "samples": 5000000,   // absent for the expert
  "episodes": [
    {
      "seed": 1000000, "target": "hex", "success": false,
      "steps": 200,                        // control steps; 200 is the limit
      "wrongObject": false,                // another object was lifted
      "closeStep": 40,                     // when the gripper was first told to close; null if never
      "closes": 1,                         // 2 or more: a second attempt; null in older evaluations
      "nearest": "hex",                    // the object nearest the gripper at that moment
      "tcp": [0.4801, -0.1055],            // where the gripper was at that moment, x and y
      "objects": { "can": [0.5678, -0.0359], "tblock": [0.4993, 0.1496], "hex": [0.5512, -0.1476] },
      "yawErr": null,                      // against the expert's grasp; null for the can and the hex nut
      "zAbove": -0.0022,                   // height above the grasp point
      "moved": { "step": 20, "from": [0.4828, -0.1061], "to": [0.5512, -0.1476] }   // null when nothing was moved
    }
  ]
}
```

Published are: the expert; one failing policy (`dp_vit_pt1500`, final checkpoint, both
weights); the policy that works at 1.0M, 2.0M and 5.0M samples (both weights), with its
interventions and disturbances; the policy with history at 2.5M (averaged weights) with its two
probes; after the fix, the final checkpoint of the reference recipe, early windows repeated,
random starts and recoveries (every weights saved). The list is `PUBLISHED_EPISODES` in
`scripts/sync-data.mjs`.

**`/data/traces/<id>.json`**: one rollout, every array with one entry per control step (20 to
50 kB).

```jsonc
{
  "id": "dp_vit_lang_reactive_pt4k__pick_target__traces_disturb_reach20__trace_000_hex_fail",
  "run": "dp_vit_lang_reactive_pt4k",      // or "expert"
  "task": "pick_target",
  "condition": "disturb_reach20",          // see traceCondition(run, condition) for its settings
  "checkpoint": 11, "weights": "ema", "samples": 5000000,   // for a policy; "plansAgain" for the expert
  "seed": 1000000, "target": "hex", "instruction": "pick up the blue hex nut",
  "objects": ["can", "tblock", "hex"],
  "hz": 20,                                // control steps per second
  "success": false,
  "closeStep": 40,
  "moved": { "step": 20, "kind": "reach", "from": [0.4828, -0.1061], "to": [0.5512, -0.1476] },   // or null
  "steps": 200,
  "tcp": [[0.551, 0.0142, 0.5346], ...],   // gripper position: x, y, z
  "yaw": [-0.0361, ...],                   // gripper yaw
  "grip": [1, ...],                        // gripper opening, 1 open to 0 closed
  "q": [[0.0157, -0.0133, ...], ...],      // the seven joint angles
  "action": [[0.0035, ..., 0.9972], ...],  // seven joint targets and the gripper command (1 open, 0 closed)
  "poses": { "can": [[0.5678, -0.0359, 0.042, 2.6649], ...], ... }   // each object: x, y, z, yaw
}
```

The rollout files are rounded to what a drawing needs (positions to the millimetre, angles to the
milliradian; the move's `from` and `to` to 0.1 mm) and carry `actor`, `conditionWords` and
`closes` too.

Not every rollout of the export is published. The actors are the policy before the fix, the
reference policy after it, the policies trained with random starts and with recoveries, and the
scripted expert with one plan and planning again (`PUBLISHED_TRACES` in `scripts/sync-data.mjs`).
Under every condition a rollout exists for, each of them has the same three layouts, and a fourth
when it adds a success or a failure, so `sideBySide(words)` sets them next to each other. Each
entry of the index says:

| Field | |
|---|---|
| `run`, `actor` | the run (or `"expert"`, with `plansAgain`), and who acted in the notebook's words: "before the fix, plain demonstrations", "recoveries", "scripted expert, plans again" |
| `condition`, `conditionWords` | the export's name for the conditions, and the column of the notebook's table that has them ("Moved at the grasp"); the expert's `condition` names differ, its words do not |
| `episode`, `seed` | the layout, from 0, and its seed: the same for every actor |
| `target`, `success` | the named object, and whether it was lifted |
| `moved` | the step and the kind (`"reach"` or `"grasp"`) of the move, or null |
| `closeStep`, `closes` | when the gripper was first told to close, and how often it was: 2 or more is a second attempt |

One more, `traces({ condition: "frames" })`, is the expert rollout the camera frames were taken
from; its `frames` are the steps that have one. A condition whose `reported` is null has
rollouts and no statistic: the notebook does not report an evaluation under it, so show the
rollout and state no rate.

**`/tutorial/frames/<id>.png`**: camera frames. `layout_<seed>_<camera>` is an evaluation
layout before the robot moves, `expert_<camera>_<step>` a step of the expert rollout,
`<camera>_224` a frame at the size the policy receives.

## Finished, in progress, left out

Decided in `scripts/sync-data.mjs`, at its top:

- **Left out** (not in the data at all): the runs in `LEFT_OUT`, each with its reason: the VLM as
  trained before the fix (kept for the record; the notebook reports the retrained one), the two
  VLA runs stopped because of the position-table bug, and a run that never started.
- **In progress**: a run in the `IN_PROGRESS` list (the runs the notebook lists under "Runs in
  progress when this was written"), a run whose table or row the notebook marks "still
  training", and a run the export has not finished (unless it is in `STOPPED`). A name on the
  list that the export does not have yet is an awaited run (`awaitedRuns()`).
- **Finished**: every other run. A finished run must be reported by the notebook somewhere, or
  the sync asks for attention. One was stopped before its budget (`STOPPED`); it is reported as it
  stood.

The name of a run says nothing about its status: `_posfix` marks a run trained after the fix,
`_legacy` one trained with the old table (`group.fix`), and either can be finished.

## Refreshing the data

1. In the tutorial repository, write the export:
   `python -m sim.pickup.export --out <dir>` (all runs, every per-episode file; it reads
   `experiments/pickup` and `results/pickup`).
2. Here, move the export that is in place aside and put the new one in `.data/export/`:
   `mv .data/export .data/export_<date>`, then `mv <dir> .data/export`. The camera frames,
   `tokenizations.json` and `expert_trace.json` stay in `.data/site_export/`. `.data/` is not
   committed.
3. Edit `IN_PROGRESS` at the top of `scripts/sync-data.mjs`: keep the runs the notebook still
   lists as in progress, take off those it reports. When the notebook no longer has the section
   "Runs in progress when this was written", the list is empty: `const IN_PROGRESS = [];`.
4. `npm run sync`. It copies the chapters and the notebook from `../vla-from-scratch` (or
   `TUTORIAL_REPO`), then builds the data and checks it against the notebook. `npm run sync:data`
   does the second step alone; pass another export with `npm run sync -- --export <dir>` or
   `EXPORT_DIR`.
5. Read what it prints:
   - "Needs attention" (exit status 2): the data and the notebook disagree, a hand-copied passage
     moved, or a list names something that is not there. A cell that disagrees is left out; fix
     the cause, never the number.
   - "Ahead": the notebook reports more of a run in progress than the export holds. Nothing of
     it is shown; it settles when an export has the run's final evaluations.
   - "Reported?": a run on `IN_PROGRESS` that the notebook reports without "still training".
     Take it off the list once the export has its final evaluations.
   - "Left out": evaluations the notebook does not report.
6. `npm run check:data` reads the generated files as the site does and checks that they hang
   together: no value for a run in progress, each evaluation against its per-episode file, the
   comparison tables against the evaluations, the rollouts against their index, and the size of
   `public/data` (under 6 MB of rollouts, 9 MB in all).
7. Commit `src/data/generated/`, `public/data/`, `public/tutorial/frames/` and `content/` with the
   change.

What to edit, all at the top of `scripts/sync-data.mjs`:

| To | Edit |
|---|---|
| mark a run as in progress, or as reported | `IN_PROGRESS` |
| leave a run out of the site | `LEFT_OUT`, with the reason |
| name a run in the notebook's words, or attribute a comparison table's row to it | `RUN_WORDS` (`TABLE_WORDS` for other words a table uses) |
| put a run in another family | `FAMILY` |
| read a new comparison table, or a new column of one | `NOTEBOOK_TABLES`, `CONDITION_COLUMNS`, `EXPERT_WORDS`; a before/after table: `PAIR_TABLES` |
| report a probe or an expert evaluation that the notebook has in a row of its own | `NOTEBOOK_ROWS`: the notebook row, and which of the evaluation's numbers it holds |
| publish the episodes of another evaluation | `PUBLISHED_EPISODES` |
| publish rollouts of another actor | `PUBLISHED_TRACES` |
| teach it a new policy or dataset name | `POLICIES`, `DATASETS`, `DATA_VARIANTS` |
| show more checkpoints of a run | nothing here: print their rows in the notebook's table, then sync |
| add a number only the notebook has | `src/data/notebook.json`, with `section` and `quotes`; type it in `notebook.ts` |

Without an export, `npm run sync:data` leaves the generated files alone and still checks them,
and `notebook.json`, against the notebook (rows of the trained weights alone only roughly). With
an export and no `.data/site_export/`, the frames, the tokenisations and the rollout the frames
were taken from stay as they are.
