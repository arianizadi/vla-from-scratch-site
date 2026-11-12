/**
 * What the action-chunks figure reads from the data module, and the arithmetic
 * of chunked execution: how often the cameras are read and how many predicted
 * actions are thrown away when a policy executes `executed` of every `CHUNK`.
 *
 * No measured number is typed here. The chunk length, the control rate, the
 * episode limit and the default setting come from src/data; the success of
 * the settings that were run is the notebook's "Actions executed per chunk"
 * table, read through execHorizonSweep().
 */

import { formatCount, formatSamples } from "@/data/format";
import { MACHINES, WEIGHTS } from "@/data/labels";
import { disturbanceNotes, setup } from "@/data/notebook";
import { baseline, execHorizonSweep, flowStepSweep, probes, type Probe } from "@/data/probes";
import { evaluationDefaults, isFinished, run as findRun } from "@/data/runs";
import { repoUrl } from "@/lib/site";

/** The run whose sampler settings the notebook reports. */
const RUN = "dp_vit_lang_reactive_pt4k";

/** Actions a policy predicts in one go. */
export const CHUNK: number = setup.chunk.actions;
/** Actions of each chunk that are executed unless an evaluation says otherwise. */
export const DEFAULT_EXECUTED: number = Math.min(evaluationDefaults.execHorizon, CHUNK);
/** Control steps per second. */
export const CONTROL_HZ: number = evaluationDefaults.controlHz;
/** An episode ends after this many control steps. */
export const EPISODE_STEPS: number = setup.success.maxSteps;

// ---------------------------------------------------------------- the schedule

/** A number of control steps as a duration: 8 steps at 20 Hz are "0.4 s". */
export function seconds(steps: number): string {
  return `${Number((steps / CONTROL_HZ).toFixed(2))} s`;
}

/** Chunks planned in a whole episode: one every `executed` control steps. */
export function chunksPerEpisode(executed: number): number {
  return Math.ceil(EPISODE_STEPS / executed);
}

/** The control steps at which a chunk is planned, inside a window of `steps`. */
export function planSteps(executed: number, steps: number): number[] {
  return Array.from({ length: Math.ceil(steps / executed) }, (_, index) => index * executed);
}

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;

/** "0, 8, 16 and 24". */
function list(values: readonly (number | string)[]): string {
  if (values.length < 2) return values.join("");
  return `${values.slice(0, -1).join(", ")} and ${values[values.length - 1]}`;
}

/** What the setting means for a whole episode, in one sentence. */
export function scheduleSentence(executed: number): string {
  // EPISODE_STEPS is the limit: an episode that succeeds ends earlier, so the count is an upper bound.
  const looks = `up to ${plural(chunksPerEpisode(executed), "time")} in an episode (an episode lasts at most ${EPISODE_STEPS} steps)`;
  const every =
    executed === 1
      ? `the cameras are read at every control step (${seconds(1)})`
      : `the cameras are read every ${executed} control steps (${seconds(executed)})`;
  if (executed >= CHUNK) {
    return `All ${CHUNK} actions of a chunk are executed: ${every}, ${looks}, and nothing is discarded.`;
  }
  const verb = executed === 1 ? "is" : "are";
  return `${executed} of ${CHUNK} predicted actions ${verb} executed: ${every}, ${looks}, and ${CHUNK - executed} of every ${CHUNK} are discarded.`;
}

/** What happens at control step `step` (that many steps are done), in one sentence. */
export function stepSentence(executed: number, step: number): string {
  const start = Math.floor(step / executed) * executed;
  const done = step - start;
  if (done > 0) {
    return `${done} of the ${plural(executed, "action")} to execute from the chunk planned at step ${start} ${done === 1 ? "is" : "are"} done; the cameras are read again at step ${start + executed}.`;
  }
  if (step === 0) return `The cameras are read and the first ${CHUNK} actions are planned.`;
  const left = CHUNK - executed;
  return left > 0
    ? `The cameras are read again and ${CHUNK} new actions are planned; the ${left} left of the previous chunk ${left === 1 ? "is" : "are"} discarded.`
    : `The cameras are read again and ${CHUNK} new actions are planned; nothing of the previous chunk is left.`;
}

/** The drawing in words, for readers who cannot see it. */
export function timelineDescription(executed: number, steps: number): string {
  const plans = planSteps(executed, steps);
  const when =
    executed === 1
      ? "at every control step"
      : plans.length > 6
        ? `every ${executed} steps, ${plural(plans.length, "time")} in the window`
        : `at steps ${list(plans)}`;
  const fate =
    executed >= CHUNK
      ? `All ${CHUNK} actions of each plan are executed (${seconds(CHUNK)}), and nothing is discarded.`
      : `Of each plan the first ${executed === 1 ? "action is" : `${executed} are`} executed (${seconds(executed)}) and the other ${CHUNK - executed} ${CHUNK - executed === 1 ? "is" : "are"} discarded when the next plan replaces them.`;
  return `Timeline of the first ${steps} control steps of an episode, ${CONTROL_HZ} steps per second. The policy reads the cameras and plans ${CHUNK} actions ${when}. ${fate}`;
}

// ---------------------------------------------------------------- what was measured

/** One setting the lab notebook reports. */
export interface MeasuredSetting {
  /** Actions executed of each chunk. */
  executed: number;
  /** The whole chunk is executed. */
  wholeChunk: boolean;
  /** The setting every other evaluation uses. */
  isDefault: boolean;
  successes: number;
  episodes: number;
  /** successes / episodes. */
  rate: number;
  /** Wilson 95% interval of the rate; null when the evaluation behind the count is not in the data. */
  interval: [number, number] | null;
}

/** The evaluation a count came from: the same run, the default sampler, fresh noise, the same count. */
function sourceOf(executed: number, successes: number, episodes: number): Probe | undefined {
  return probes(RUN).find((row) => {
    const { execHorizon, flowSteps, noise, seedStart } = row.settings;
    return (
      (row.kind === "baseline" || row.kind === "sampler") &&
      execHorizon !== null &&
      Math.min(execHorizon, CHUNK) === executed &&
      flowSteps === evaluationDefaults.flowSteps &&
      seedStart === evaluationDefaults.seedStart &&
      noise === "fresh" &&
      row.successes === successes &&
      row.episodes === episodes
    );
  });
}

/** Success for each number of executed actions that was run, fewest first, with the evaluation behind each count. */
const SWEEP = execHorizonSweep(RUN).map((row) => ({
  row,
  source: sourceOf(row.executed, row.fresh.successes, row.fresh.episodes),
}));

/** Success for each number of executed actions that was run, fewest first. */
export const MEASURED: MeasuredSetting[] = SWEEP.map(({ row, source }) => ({
  executed: row.executed,
  wholeChunk: row.wholeChunk,
  isDefault: row.executed === DEFAULT_EXECUTED,
  successes: row.fresh.successes,
  episodes: row.fresh.episodes,
  rate: row.fresh.successes / row.fresh.episodes,
  // The interval belongs to the evaluation, so it is read from the evaluation the count came from.
  interval: source ? source.ci : null,
}));

/** GitHub's anchor for a Markdown heading: "Inference settings" is "#inference-settings". */
function headingAnchor(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s/g, "-");
}

/**
 * Where the lab notebook reports these counts: the heading every evaluation
 * behind them is filed under, as a link into the notebook. Null when there is
 * no count, or when the counts do not share a heading.
 */
export const MEASURED_SOURCE: { section: string; href: string } | null = (() => {
  const sources = SWEEP.map(({ source }) => source);
  if (sources.length === 0 || sources.some((source) => !source)) return null;
  const [first, ...rest] = sources as Probe[];
  const section = first.sections.find((name) => rest.every((source) => source.sections.includes(name)));
  return section ? { section, href: `${repoUrl("tutorial/lab-notebook.md")}#${headingAnchor(section)}` } : null;
})();

export function measuredAt(executed: number): MeasuredSetting | undefined {
  return MEASURED.find((row) => row.executed === executed);
}

/** The settings that were run, as words: "2, 4, 8 and 15". */
export const MEASURED_LIST: string = list(MEASURED.map((row) => row.executed));

/** Layouts per setting when every setting was run on the same number, else null. */
export const LAYOUTS_PER_SETTING: number | null =
  MEASURED.length > 0 && MEASURED.every((row) => row.episodes === MEASURED[0].episodes) ? MEASURED[0].episodes : null;

/** What the success counts were measured on, for the figure's small print. */
export function measuredOn(): string | null {
  const entry = findRun(RUN);
  const probed = baseline(RUN);
  if (MEASURED.length === 0 || !isFinished(entry) || !probed) return null;

  const { demos, history } = entry.design;
  const policy =
    demos !== null && history !== null
      ? `the policy trained on ${demos} demonstrations ${history ? "with" : "without"} history`
      : "one policy";
  const machine = entry.machine ? `, on ${MACHINES[entry.machine].label}` : "";
  const layouts =
    LAYOUTS_PER_SETTING !== null ? `the same ${LAYOUTS_PER_SETTING} unseen layouts for every setting` : "unseen layouts";

  let text = `Success was measured on ${policy}, after ${formatSamples(probed.samples)} samples (${WEIGHTS[probed.weights].label})${machine}: ${plural(evaluationDefaults.flowSteps, "flow step")}, ${layouts}, one training seed.`;

  // The default setting on another set of layouts says how far the layouts alone move the count.
  const usual = measuredAt(DEFAULT_EXECUTED);
  const second = flowStepSweep(RUN).find((row) => row.flowSteps === evaluationDefaults.flowSteps)?.second;
  if (usual && second) {
    const apart = Math.abs(usual.successes - second.successes);
    text += ` On a second set of ${second.episodes} layouts the default scored ${formatCount(second.successes, second.episodes)}: the layouts alone move the count by ${plural(apart, "episode")}.`;
  }
  return text;
}

/** The control step around which the scripted expert closes the gripper: the length of a reach. */
export const REACH_STEPS: number = disturbanceNotes.expertCloses.step;
