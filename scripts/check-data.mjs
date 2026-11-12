#!/usr/bin/env node
// Reads the generated data the way the site does and checks that it hangs together.
//
//   npm run check:data                                    the run that works, dp_vit_lang_reactive_pt4k
//   npm run check:data -- dp_vit_lang_pt4k                another run
//
// It prints, for the run, success by checkpoint (trained / averaged weights) and its probes, and
// then checks every generated and public file:
//
//   - a run in progress has no value anywhere: no measured field, no checkpoint, probe, curve or file;
//     every run the sync script lists as in progress is in progress; no run it leaves out is here
//   - every evaluation's numbers agree with each other, and with its per-episode file when it has one
//   - the comparison tables (before/after, pooled by object, the battery, the expert) point at
//     evaluations that exist, and their counts add up
//   - every file the index names exists, has the size and the number of episodes or steps it states,
//     every array of a rollout has one entry per step, and public/data stays within its size limits
//
// It needs no export and no notebook: it tests what is committed. Exit status 1 when a check fails.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatCount,
  formatMm,
  formatPercent,
  formatSamples,
  formatSlope,
  formatWhole,
} from "../src/data/notebook-format.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generated = (name) => JSON.parse(readFileSync(path.join(root, "src", "data", "generated", name), "utf8"));
const publicFile = (...parts) => path.join(root, "public", ...parts);

const meta = generated("meta.json");
const runs = generated("runs.json");
const checkpoints = generated("checkpoints.json");
const probes = generated("probes.json");
const expert = generated("expert.json");
const curves = generated("loss-curves.json");
const tolerance = generated("tolerance.json");
const files = generated("files.json");
const comparisons = generated("comparisons.json");

const failures = [];
let checked = 0;
/** Counts a check; records `message` when it does not hold. */
function expect(holds, message) {
  checked += 1;
  if (!holds) failures.push(message);
}

// ---------------------------------------------------------------- what the site will show

const name = process.argv[2] ?? "dp_vit_lang_reactive_pt4k";
const shown = runs.find((run) => run.name === name);
if (!shown) {
  console.error(`No run "${name}" in the generated data. Runs: ${runs.map((run) => run.name).join(", ")}.`);
  process.exit(1);
}

const both = (row, format, field) => `${format(row.raw[field])} / ${row.ema ? format(row.ema[field]) : "-"}`;
console.log(`${name} (${shown.status === "finished" ? `finished, machine ${shown.machine}` : "in progress: no values"})`);
if (checkpoints[name]) {
  console.log("\n  Samples        Success (trained / averaged)   Closed at the named object   Slope           Median miss");
  for (const row of checkpoints[name]) {
    const samples = `${formatSamples(row.samples)}${row.final ? " (final)" : ""}`;
    console.log(
      `  ${samples.padEnd(14)} ${both(row, formatPercent, "rate").padEnd(30)} ${both(row, formatPercent, "named").padEnd(28)} ${both(row, formatSlope, "slope").padEnd(15)} ${both(row, formatWhole, "missMm")} mm`,
    );
  }
}
if (probes[name]) {
  console.log("\n  Probe                         Success    Named   Miss      Object moved: success, from the old place, from the new, second attempt");
  for (const row of probes[name]) {
    const moved = row.moved
      ? `${formatCount(row.moved.successes, row.moved.episodes)}, ${formatMm(row.moved.fromOldMm)}, ${formatMm(row.moved.fromNewMm)}, ${formatCount(row.moved.retried, row.moved.episodes)}`
      : "";
    console.log(
      `  ${row.variant.padEnd(29)} ${formatCount(row.successes, row.episodes).padEnd(10)} ${formatPercent(row.named).padEnd(7)} ${formatMm(row.missMm).padEnd(9)} ${moved}`,
    );
  }
}
console.log("");

// ---------------------------------------------------------------- runs

const inProgress = new Set(runs.filter((run) => run.status === "in_progress").map((run) => run.name));
const ALLOWED_IN_PROGRESS = new Set(["name", "status", "reason", "task", "design", "samplesPlanned", "words", "group"]);
const FAMILIES = new Set(["reference", "demonstrations", "history", "single_cube", "backbones", "first_round"]);
for (const run of runs) {
  expect(run.status === "finished" || run.status === "in_progress", `${run.name}: status is "${run.status}".`);
  expect(!(meta.leftOut ?? []).includes(run.name), `${run.name} is left out by the sync script and is in the data.`);
  expect(run.group && ["before", "after"].includes(run.group.fix) && (run.group.family === null || FAMILIES.has(run.group.family)), `${run.name}: group ${JSON.stringify(run.group)}.`);
  expect(run.group?.fix === (run.design.positionFix ? "after" : "before"), `${run.name}: its group and its design disagree about the position fix.`);
  if ((meta.inProgressList ?? []).includes(run.name)) expect(run.status === "in_progress", `${run.name} is on the list of runs in progress and is shown as finished.`);
  if (run.status === "in_progress") {
    const extra = Object.keys(run).filter((key) => !ALLOWED_IN_PROGRESS.has(key));
    expect(extra.length === 0, `${run.name} is in progress and has ${extra.join(", ")}.`);
  } else {
    expect(run.sections.length > 0, `${run.name} is finished and no notebook section reports it.`);
    expect(Array.isArray(curves[run.name]) && curves[run.name].length > 0, `${run.name} is finished and has no loss curve.`);
  }
}
for (const [what, table] of [["checkpoints", checkpoints], ["probes", probes], ["a loss curve", curves]]) {
  for (const run of Object.keys(table)) {
    expect(!inProgress.has(run), `${run} is in progress and has ${what}.`);
    expect(runs.some((entry) => entry.name === run), `${run} has ${what} and is not in runs.json.`);
  }
}
for (const file of [...files.grasp, ...files.traces, ...files.conditions]) {
  expect(!inProgress.has(file.run), `${file.run} is in progress and has a public file (${file.id ?? file.condition}).`);
}
expect(meta.runs.finished + meta.runs.inProgress === runs.length, "meta.json counts other runs than runs.json holds.");

// ---------------------------------------------------------------- evaluations

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = sorted.length >> 1;
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const graspIds = new Set(files.grasp.map((file) => file.id));

/** One evaluation: its own numbers, and its per-episode file when it is published. */
function checkEvaluation(row, label) {
  expect(Number.isInteger(row.successes) && Number.isInteger(row.episodes) && row.episodes > 0, `${label}: counts ${row.successes}/${row.episodes}.`);
  expect(Math.abs(row.rate - row.successes / row.episodes) < 1e-12, `${label}: rate ${row.rate} is not ${row.successes}/${row.episodes}.`);
  expect(row.ci[0] <= row.rate + 1e-12 && row.rate <= row.ci[1] + 1e-12, `${label}: the interval ${row.ci} does not hold the rate ${row.rate}.`);
  const named = Object.values(row.perObject);
  expect(
    named.reduce((sum, object) => sum + object.successes, 0) === row.successes &&
      named.reduce((sum, object) => sum + object.episodes, 0) === row.episodes,
    `${label}: the counts per object do not add up to ${row.successes}/${row.episodes}.`,
  );
  if (!row.graspFile) return;
  expect(graspIds.has(row.graspFile), `${label}: ${row.graspFile} is not in the index of public files.`);
  const file = publicFile("data", "grasp", `${row.graspFile}.json`);
  if (!existsSync(file)) return;
  const { episodes } = JSON.parse(readFileSync(file, "utf8"));
  expect(episodes.length === row.episodes, `${label}: ${row.graspFile} has ${episodes.length} episodes.`);
  expect(episodes.filter((episode) => episode.success).length === row.successes, `${label}: ${row.graspFile} counts other successes.`);
  // The median miss, from the published positions (rounded to 0.1 mm) against the export's number.
  const closed = episodes.filter((episode) => episode.tcp && episode.objects[episode.target]);
  if (closed.length > 0 && row.missMm !== null) {
    const miss = median(closed.map((episode) => 1000 * Math.hypot(episode.tcp[0] - episode.objects[episode.target][0], episode.tcp[1] - episode.objects[episode.target][1])));
    expect(Math.abs(miss - row.missMm) < 0.2, `${label}: ${row.graspFile} gives a median miss of ${miss.toFixed(2)} mm, the evaluation says ${row.missMm.toFixed(2)}.`);
  }
  if (row.named !== null) {
    const atNamed = episodes.filter((episode) => episode.nearest === episode.target).length / episodes.length;
    expect(Math.abs(atNamed - row.named) < 1e-9, `${label}: ${row.graspFile} gives ${atNamed} closed at the named object, the evaluation says ${row.named}.`);
  }
}

for (const [run, rows] of Object.entries(checkpoints)) {
  let before = 0;
  for (const row of rows) {
    expect(row.samples > before, `${run}: checkpoint ${row.checkpoint} is out of order.`);
    before = row.samples;
    expect(row.raw !== null, `${run}, checkpoint ${row.checkpoint}: no trained weights.`);
    if (row.raw) checkEvaluation(row.raw, `${run}, checkpoint ${row.checkpoint}, trained`);
    if (row.ema) checkEvaluation(row.ema, `${run}, checkpoint ${row.checkpoint}, averaged`);
  }
  const last = runs.find((entry) => entry.name === run);
  expect(rows.at(-1).samples === last.samples, `${run}: its last checkpoint is at ${rows.at(-1).samples}, the run at ${last.samples}.`);
}
for (const [run, rows] of Object.entries(probes)) {
  for (const row of rows) {
    checkEvaluation(row, `${run} / ${row.variant}`);
    expect(row.sections.length > 0, `${run} / ${row.variant}: no notebook section reports it.`);
    expect((row.kind === "disturbance") === (row.moved !== null), `${run} / ${row.variant}: kind ${row.kind}, moved ${JSON.stringify(row.moved)}.`);
    for (const id of row.traces) expect(files.traces.some((trace) => trace.id === id), `${run} / ${row.variant}: the rollout ${id} is not in the index.`);
    if (row.variant === "plain") {
      const at = checkpoints[run]?.find((candidate) => candidate.checkpoint === row.checkpoint)?.[row.weights];
      expect(at && at.successes === row.successes && at.episodes === row.episodes, `${run} / plain is not checkpoint ${row.checkpoint} (${row.weights}).`);
    }
    if (row.moved && row.graspFile && existsSync(publicFile("data", "grasp", `${row.graspFile}.json`))) {
      const { episodes } = JSON.parse(readFileSync(publicFile("data", "grasp", `${row.graspFile}.json`), "utf8"));
      const moved = episodes.filter((episode) => episode.moved);
      expect(
        moved.length === row.moved.episodes && moved.filter((episode) => episode.success).length === row.moved.successes,
        `${run} / ${row.variant}: ${row.graspFile} has ${moved.filter((episode) => episode.success).length}/${moved.length} moved episodes, the probe says ${row.moved.successes}/${row.moved.episodes}.`,
      );
    }
  }
}
for (const row of expert) {
  checkEvaluation(row, `expert / ${row.variant}`);
  expect(row.sections.length > 0, `expert / ${row.variant}: no notebook section reports it.`);
}

// ---------------------------------------------------------------- comparisons

const rowOf = (run, checkpoint) => checkpoints[run]?.find((row) => row.checkpoint === checkpoint);
for (const pair of comparisons.beforeAfter) {
  for (const row of pair.rows) {
    for (const side of ["before", "after"]) {
      if (row[side] === null) continue;
      const at = rowOf(pair[side], row[side]);
      expect(at && pair.weights.every((weights) => at[weights]), `${pair[side]}: the before/after row ${row.samples} points at checkpoint ${row[side]}, which has no ${pair.weights.join(" and ")} row.`);
      if (at) expect(formatSamples(at.samples) === row.samples, `${pair[side]}: checkpoint ${row[side]} is at ${formatSamples(at.samples)}, the row says ${row.samples}.`);
    }
  }
  if (pair.perObject) {
    for (const side of ["before", "after"]) {
      const at = rowOf(pair[side], pair.perObject[side].checkpoint)?.[pair.perObject.weights];
      for (const [object, value] of Object.entries(pair.perObject[side].counts)) {
        expect(at && at.perObject[object]?.successes === value.successes && at.perObject[object]?.episodes === value.episodes, `${pair[side]}: the counts per object of its final checkpoint disagree for ${object}.`);
      }
    }
  }
}
for (const [run, pooled] of Object.entries(comparisons.pooled)) {
  expect(runs.some((entry) => entry.name === run && entry.status === "finished"), `${run} has counts pooled by object and is not finished.`);
  for (const value of Object.values(pooled.perObject)) expect(value.successes <= value.episodes, `${run}: pooled ${value.successes}/${value.episodes}.`);
}
for (const entry of comparisons.battery.runs) {
  const plain = probes[entry.run]?.find((row) => row.variant === "plain");
  expect(plain && plain.checkpoint === entry.checkpoint && plain.weights === entry.weights, `${entry.run}: the battery is of checkpoint ${entry.checkpoint} (${entry.weights}), its plain row says otherwise.`);
  const final = checkpoints[entry.run]?.at(-1);
  expect(final && final.checkpoint === entry.checkpoint, `${entry.run}: the battery is not of the run's last reported checkpoint.`);
  const reported = comparisons.battery.columns.filter((column) => probes[entry.run]?.some((row) => row.variant === column.variant && row.sections.includes(comparisons.battery.section)));
  expect(reported.length > 0, `${entry.run} is a row of the battery and has no cell in it.`);
  for (const column of reported) {
    const row = probes[entry.run].find((candidate) => candidate.variant === column.variant);
    expect(row.checkpoint === entry.checkpoint && row.weights === entry.weights, `${entry.run} / ${column.variant}: not the battery's checkpoint.`);
  }
}
for (const row of comparisons.battery.expert.rows) {
  for (const cell of row.cells) {
    const found = expert.find((candidate) => candidate.variant === cell.variant);
    expect(found && found.plansAgain === row.plansAgain, `expert / ${cell.variant}: in the expert's table, and not in expert.json as "${row.words}".`);
  }
}
for (const row of tolerance.offsets) {
  for (const [object, value] of Object.entries(row)) {
    if (object !== "offsetMm") expect(value.successes <= value.episodes, `Tolerance at ${row.offsetMm} mm, ${object}: ${value.successes}/${value.episodes}.`);
  }
  const { all, offsetMm, ...objects } = row;
  expect(
    Object.values(objects).reduce((sum, value) => sum + value.episodes, 0) === all.episodes && all.episodes === tolerance.episodesPerOffset,
    `Tolerance at ${offsetMm} mm: the objects do not add up to ${tolerance.episodesPerOffset} episodes.`,
  );
}

// ---------------------------------------------------------------- public files

const onDisk = (folder) => new Set(readdirSync(publicFile(...folder)).filter((file) => !file.startsWith(".")));

for (const info of files.grasp) {
  const file = publicFile("data", "grasp", `${info.id}.json`);
  expect(existsSync(file), `${info.id}.json is in the index and not in public/data/grasp.`);
  if (!existsSync(file)) continue;
  expect(statSync(file).size === info.bytes, `${info.id}.json is ${statSync(file).size} bytes, the index says ${info.bytes}.`);
  const body = JSON.parse(readFileSync(file, "utf8"));
  expect(body.id === info.id && body.run === info.run && body.episodes.length === info.episodes, `${info.id}.json does not match its index entry.`);
}
expect(onDisk(["data", "grasp"]).size === files.grasp.length, "public/data/grasp holds other files than the index names.");

for (const info of files.traces) {
  const file = publicFile("data", "traces", `${info.id}.json`);
  expect(existsSync(file), `${info.id}.json is in the index and not in public/data/traces.`);
  if (!existsSync(file)) continue;
  expect(statSync(file).size === info.bytes, `${info.id}.json is ${statSync(file).size} bytes, the index says ${info.bytes}.`);
  const trace = JSON.parse(readFileSync(file, "utf8"));
  const columns = [trace.tcp, trace.yaw, trace.grip, trace.q, trace.action, ...trace.objects.map((object) => trace.poses[object])];
  expect(trace.steps === info.steps && columns.every((column) => Array.isArray(column) && column.length === trace.steps), `${info.id}: not every array has ${info.steps} entries.`);
  expect(trace.q.every((angles) => angles.length === 7) && trace.action.every((action) => action.length === 8), `${info.id}: joint angles or actions of the wrong size.`);
  const firstClose = trace.action.findIndex((action) => action[7] < 0.5);
  expect(trace.closeStep === (firstClose === -1 ? null : firstClose), `${info.id}: closeStep ${trace.closeStep}, the actions close at ${firstClose}.`);
  let closes = 0;
  let open = true;
  for (const action of trace.action) {
    if (open && action[7] < 0.5) closes += 1;
    open = action[7] >= 0.5;
  }
  expect(trace.closes === closes && info.closes === closes, `${info.id}: closes ${info.closes}, the actions close ${closes} times.`);
  expect(typeof info.actor === "string" && info.actor.length > 0 && Number.isInteger(info.episode) && "conditionWords" in info, `${info.id}: its index entry lacks the actor, the episode or the condition's words.`);
  expect(Boolean(info.moved) === Boolean(trace.moved) && (!info.moved || info.moved.step === trace.moved.step), `${info.id}: the index and the file disagree about the move.`);
  expect(trace.success === info.success && trace.target === info.target && trace.seed === info.seed, `${info.id} does not match its index entry.`);
  expect(files.conditions.some((entry) => entry.run === info.run && entry.condition === info.condition), `${info.id}: its conditions are not in the index.`);
  if (trace.moved) {
    // Up to the step of the move the named object stands at the old place, after it near the new
    // one (it may settle a few millimetres from where it was put down).
    const poses = trace.poses[trace.target];
    const far = (pose, place) => Math.hypot(pose[0] - place[0], pose[1] - place[1]);
    const before = poses[trace.moved.step];
    const after = poses[Math.min(trace.moved.step + 1, trace.steps - 1)];
    expect(far(before, trace.moved.from) < 0.002, `${info.id}: the object is not at its old place at step ${trace.moved.step}.`);
    expect(far(after, trace.moved.to) < 0.02 && far(after, trace.moved.to) < far(after, trace.moved.from), `${info.id}: the object is not at its new place after step ${trace.moved.step}.`);
  }
}
expect(onDisk(["data", "traces"]).size === files.traces.length, "public/data/traces holds other files than the index names.");

// The same layouts for every actor of a condition, so a figure can set them side by side.
const byWords = new Map();
for (const trace of files.traces) {
  if (trace.condition === "frames" || trace.conditionWords === null) continue;
  if (!byWords.has(trace.conditionWords)) byWords.set(trace.conditionWords, new Map());
  const actors = byWords.get(trace.conditionWords);
  if (!actors.has(trace.actor)) actors.set(trace.actor, new Set());
  actors.get(trace.actor).add(trace.episode);
}
for (const [words, actors] of byWords) {
  const sets = [...actors.values()];
  const shared = [...sets[0]].filter((episode) => sets.every((set) => set.has(episode)));
  expect(shared.length >= Math.min(3, ...sets.map((set) => set.size)), `"${words}": the actors share ${shared.length} layouts.`);
}

// Sizes: what the site serves from public/data.
const bytesUnder = (folder) =>
  readdirSync(folder).reduce((sum, name) => {
    const file = path.join(folder, name);
    return sum + (statSync(file).isDirectory() ? bytesUnder(file) : statSync(file).size);
  }, 0);
const tracesBytes = bytesUnder(publicFile("data", "traces"));
const allBytes = bytesUnder(publicFile("data"));
expect(tracesBytes < 6e6, `public/data/traces holds ${(tracesBytes / 1e6).toFixed(2)} MB, more than 6 MB.`);
expect(allBytes < 9e6, `public/data holds ${(allBytes / 1e6).toFixed(2)} MB, more than 9 MB.`);

for (const frame of files.frames) {
  const file = publicFile(...frame.file.split("/").filter(Boolean));
  expect(existsSync(file) && statSync(file).size === frame.bytes, `${frame.file} is missing or not ${frame.bytes} bytes.`);
}
expect(
  readFileSync(publicFile("data", "index.json"), "utf8") === readFileSync(path.join(root, "src", "data", "generated", "files.json"), "utf8"),
  "public/data/index.json and src/data/generated/files.json differ.",
);

// ---------------------------------------------------------------- result

if (failures.length > 0) {
  console.error(`${failures.length} of ${checked} checks failed:`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log(
  `${checked} checks passed: ${runs.length} runs (${inProgress.size} in progress, without values), ${Object.values(checkpoints).flat().length} checkpoints, ` +
    `${Object.values(probes).flat().length} probes, ${files.grasp.length} per-episode files, ${files.traces.length} rollouts ` +
    `(${(tracesBytes / 1e6).toFixed(1)} MB; ${(allBytes / 1e6).toFixed(1)} MB in public/data), ${files.frames.length} frames.`,
);
