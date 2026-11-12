#!/usr/bin/env node
// Refreshes everything the site takes from the tutorial repository, in order:
//
//   1. sync-content.mjs   the chapters, the lab notebook and the images
//   2. sync-data.mjs      the experiment data, checked against the notebook that step 1 copied
//
//   npm run sync                                 the tutorial in ../vla-from-scratch, the export in .data/export
//   npm run sync -- /path/to/repo                the tutorial from another checkout
//   npm run sync -- --export /path/to/export     the experiment export from another folder
//   TUTORIAL_REPO=/path/to/repo EXPORT_DIR=/path/to/export npm run sync
//
// Either step can be run alone: npm run sync:content, npm run sync:data.
//
// Exit status: 0 when both steps are clean, 2 when a step printed something that needs attention
// (a quoted passage that left the notebook, an evaluation that no longer matches it), 1 when a
// step could not run. The second step runs whatever the first one returns: the notebook already
// in content/ is the one the data is checked against.

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scripts = path.dirname(fileURLToPath(import.meta.url));

let tutorial;
let exported;
const args = process.argv.slice(2);
for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === "--export") exported = args[(index += 1)];
  else if (arg.startsWith("--export=")) exported = arg.slice("--export=".length);
  else if (arg.startsWith("--")) {
    console.error(`Unknown option ${arg}. Usage: npm run sync -- [tutorial repository] [--export <export folder>]`);
    process.exit(1);
  } else tutorial = arg;
}
if (exported === undefined && args.some((arg) => arg === "--export")) {
  console.error("--export needs a folder: npm run sync -- --export /path/to/export");
  process.exit(1);
}

function step(script, argument) {
  const result = spawnSync(process.execPath, [path.join(scripts, script), ...(argument ? [argument] : [])], {
    stdio: "inherit",
  });
  if (result.error) {
    console.error(`${script} could not be started: ${result.error.message}`);
    return 1;
  }
  return result.status ?? 1;
}

const content = step("sync-content.mjs", tutorial);
if (content === 1) console.error("\nThe text was not synced; the data is checked against the notebook already in content/.");
console.log("");
const data = step("sync-data.mjs", exported);

// 1 (a step could not run) outranks 2 (a step wants attention).
process.exitCode = [content, data].some((status) => status !== 0 && status !== 2) ? 1 : Math.max(content, data);
