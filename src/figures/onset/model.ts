/**
 * What the onset figure draws, built from the data module's own lists so that
 * nothing here goes stale when a run finishes or a new one appears:
 *
 *   groups      one per side of the position fix (POSITION_FIX), each with its
 *               runs in the notebook's order, bucketed by family, and the runs
 *               still in progress listed beside them
 *   stops       the places on the training axis where some run of the group
 *               was evaluated; the cursor moves between them
 *   valueAt     where a run stood at a stop: its last reported checkpoint at or
 *               before it
 *
 * Only runs on the named-object task are offered (slope and "closed at the
 * named object" are measured there). A finished run with two or more reported
 * checkpoints is drawn as a line; one with a single reported checkpoint as a
 * lone point; one with none yet is listed beside the runs in progress.
 */

import { checkpointRows, type CheckpointRow } from "@/data/checkpoints";
import { formatSamples } from "@/data/format";
import { POSITION_FIX, RUN_FAMILIES, RUN_FAMILY_IDS, WEIGHT_IDS, policySeries, runLabel } from "@/data/labels";
import { POLICY_SERIES, REFERENCE, type MarkerShape } from "@/figures/kit";
import { awaitedRuns, runsByGroup, type Run } from "@/data/runs";
import type { Evaluation, PositionFix, RunFamily, Weights } from "@/data/types";

/** The three measures, top to bottom in the order a policy that starts to look moves them. */
export type MeasureId = "slope" | "named" | "rate";

export interface Measure {
  id: MeasureId;
  /** Panel title. */
  label: string;
  /** In a sentence: "closed at the named object". */
  words: string;
  /** What the scale means, for wide panels. */
  hint: string;
  /** Shares (0 to 1, printed as percent) or a plain number (the slope). */
  kind: "share" | "number";
}

export const MEASURES: readonly Measure[] = [
  {
    id: "slope",
    label: "Slope",
    words: "slope",
    hint: "1: it closes where the object is. 0: where it closes ignores the scene",
    kind: "number",
  },
  {
    id: "named",
    label: "Closed at the named object",
    words: "closed at the named object",
    hint: "share of episodes; the dashed line is chance",
    kind: "share",
  },
  {
    id: "rate",
    label: "Success",
    words: "success",
    hint: "share of episodes in which the named object was lifted",
    kind: "share",
  },
];

/** A run the figure can draw: finished, on the named-object task, with at least one reported checkpoint. */
export interface OnsetRun {
  name: string;
  /** The run, with the samples it trained for: "4000 demonstrations, with history, stopped at 3.0M of 5.0M samples". */
  label: string;
  /** The same in short, for a label at the line end: "4000 demos, with history, stopped at 3.0M". */
  short: string;
  family: RunFamily | null;
  rows: CheckpointRow[];
  /** Which weights the notebook reports for it at all. */
  has: Record<Weights, boolean>;
  /** Training samples of its last reported checkpoint. */
  lastSamples: number;
  /** Its last reported checkpoint is the end of its budget, or it was stopped there. */
  ends: "final" | "stopped" | "open";
  /**
   * How it is drawn. The hue and the marker are its policy's (POLICY_SERIES,
   * from the run's design), as in every chart of the site; runs of the same
   * policy differ by line and fill, in the group's fixed order, never by the
   * order the reader turns them on.
   */
  style: RunStyle;
}

export interface RunStyle {
  color: string;
  shape: MarkerShape;
  hollow: boolean;
  /** strokeDasharray of the line; undefined for a solid line. */
  dash?: string;
}

/** Line and fill variants for runs of one policy, in order: solid, dashed, dotted, dash-dot. */
const VARIANTS: readonly { hollow: boolean; dash?: string }[] = [
  { hollow: false },
  { hollow: true, dash: "7 4" },
  { hollow: false, dash: "2 3" },
  { hollow: true, dash: "10 3 2 3" },
];

/** The policy's hue and marker, with a variant per run of the same policy in the given order. */
function assignStyles(runs: OnsetRun[], designs: ReadonlyMap<string, Run["design"]>) {
  const seen = new Map<string, number>();
  for (const entry of runs) {
    const design = designs.get(entry.name);
    const key = design ? policySeries(design) : undefined;
    const base = key ? POLICY_SERIES[key] : { color: REFERENCE.color, shape: "circle" as MarkerShape };
    const index = seen.get(key ?? "") ?? 0;
    seen.set(key ?? "", index + 1);
    entry.style = { color: base.color, shape: base.shape, ...VARIANTS[index % VARIANTS.length] };
  }
}

/** A run listed without a value: in progress, or finished with no checkpoint reported yet. */
export interface PendingRun {
  name: string;
  label: string;
  family: RunFamily | null;
  /** In progress, or finished and not reported in the notebook's checkpoint tables yet. */
  why: "in_progress" | "unreported";
}

export interface FamilyBlock {
  family: RunFamily | null;
  label: string;
  runs: OnsetRun[];
  pending: PendingRun[];
}

export interface Stop {
  /** The smallest number of samples among the checkpoints gathered at this stop. */
  from: number;
  /** The largest: every checkpoint of the stop is at or before it. */
  samples: number;
  /** "2.0M". */
  label: string;
}

export interface OnsetGroup {
  fix: PositionFix;
  label: string;
  families: FamilyBlock[];
  /** Every drawable run, in the order of `families`. */
  runs: OnsetRun[];
  pending: PendingRun[];
  stops: Stop[];
  /** Right end of the training axis, in samples. */
  xMax: number;
  /** Domain of the slope panel: it spans 0 to 1 and every reported slope of the group. */
  slopeDomain: [number, number];
  /** The weights the group opens with: ones every run of the reference recipe reports, then the more common. */
  defaultWeights: Weights;
}

const isNamedTaskRun = (run: Run) => run.task === "pick_target";

/**
 * The run in words, without its budget. The reference recipe is named by its
 * recipe on both sides of the fix ("4000 demonstrations, no history"), so a
 * reader switching groups sees the same recipe; other runs keep the
 * notebook's words for them ("Recoveries").
 */
function baseLabel(run: Run): string {
  const design = { ...run.design, budget: null, positionFix: false };
  if (run.group.family === "reference" && run.status !== "in_progress") {
    return runLabel({ ...run, design }, { recipe: true });
  }
  return runLabel({ ...run, design });
}

/**
 * The run with the training it received, in the axis's units: "..., 5.0M
 * samples", or "..., stopped at 3.0M of 5.0M samples" for a run stopped before
 * its budget, so that a stopped run never reads as if it had its full budget.
 */
function labelsOf(run: Run, lastSamples: number): { label: string; short: string } {
  const base = baseLabel(run);
  const planned = formatSamples(run.samplesPlanned);
  const stopped = "stopped" in run && run.stopped;
  const label = stopped
    ? `${base}, stopped at ${formatSamples(lastSamples)} of ${planned} samples`
    : `${base}, ${planned} samples`;
  const short = (stopped ? `${base}, stopped at ${formatSamples(lastSamples)}` : `${base}, ${planned}`).replace(
    /(\d) demonstrations\b/g,
    "$1 demos",
  );
  return { label, short };
}

/** Checkpoints within this share of each other are one stop on the axis (0.4993M and 0.4995M are both "0.5M"). */
export const SAME_STOP = 0.02;

/** Two checkpoints of one run close enough to be one stop: drawn apart, not joined by a line. */
export const sameStop = (earlier: number, later: number) => (later - earlier) / later < SAME_STOP;

function stopsOf(runs: readonly OnsetRun[]): Stop[] {
  const samples = [...new Set(runs.flatMap((run) => run.rows.map((row) => row.samples)))].sort((a, b) => a - b);
  const stops: Stop[] = [];
  for (const value of samples) {
    const last = stops.at(-1);
    if (last && sameStop(last.from, value)) {
      last.samples = value;
      last.label = formatSamples(value);
      continue;
    }
    stops.push({ from: value, samples: value, label: formatSamples(value) });
  }
  return stops;
}

/**
 * The weights a group opens with: averaged when every run of the reference
 * recipe reports them and most of the group's lines do (they lead during the
 * transition), otherwise weights that every reference run reports, so the
 * group never opens with its reference checked and not drawn.
 */
function defaultWeightsOf(runs: readonly OnsetRun[]): Weights {
  const lines = runs.filter((run) => run.rows.length > 1);
  const reference = lines.filter((run) => run.family === "reference");
  const everyReference = (weights: Weights) => reference.every((run) => run.has[weights]);
  if (everyReference("ema") && lines.filter((run) => run.has.ema).length * 2 > lines.length) return "ema";
  return WEIGHT_IDS.find(everyReference) ?? "raw";
}

function buildGroup(fix: PositionFix): OnsetGroup | null {
  const blocks = new Map<RunFamily | null, FamilyBlock>();
  const firstSeen = new Map<RunFamily | null, number>();

  const block = (family: RunFamily | null, order: number) => {
    let found = blocks.get(family);
    if (!found) {
      found = { family, label: family ? RUN_FAMILIES[family].label : "Other runs", runs: [], pending: [] };
      blocks.set(family, found);
      firstSeen.set(family, order);
    }
    return found;
  };

  const designs = new Map<string, Run["design"]>();
  runsByGroup({ fix }).forEach((run, index) => {
    if (!isNamedTaskRun(run)) return;
    designs.set(run.name, run.design);
    const family = run.group.family;
    if (run.status === "in_progress") {
      block(family, index).pending.push({ name: run.name, label: baseLabel(run), family, why: "in_progress" });
      return;
    }
    const rows = checkpointRows(run.name);
    if (rows.length === 0) {
      block(family, index).pending.push({ name: run.name, label: baseLabel(run), family, why: "unreported" });
      return;
    }
    const last = rows[rows.length - 1];
    block(family, index).runs.push({
      name: run.name,
      ...labelsOf(run, last.samples),
      family,
      rows,
      has: {
        raw: rows.some((row) => row.raw !== null),
        ema: rows.some((row) => row.ema !== null),
      },
      lastSamples: last.samples,
      ends: run.stopped ? "stopped" : last.final ? "final" : "open",
      style: { color: REFERENCE.color, shape: "circle", hollow: false },
    });
  });

  // Runs the notebook lists as in progress that the export does not have yet.
  for (const entry of awaitedRuns()) {
    if (entry.group.fix !== fix || !entry.design.dataset?.startsWith("pick_target")) continue;
    block(entry.group.family, Number.POSITIVE_INFINITY).pending.push({
      name: entry.name,
      label: runLabel({ ...entry, samplesPlanned: 0 }),
      family: entry.group.family,
      why: "in_progress",
    });
  }

  // Families in the order the notebook first prints one of their runs; the site's order breaks ties.
  const rank = (family: RunFamily | null) => (family === null ? RUN_FAMILY_IDS.length : RUN_FAMILY_IDS.indexOf(family));
  const families = [...blocks.values()].sort(
    (a, b) =>
      (firstSeen.get(a.family) ?? 0) - (firstSeen.get(b.family) ?? 0) || rank(a.family) - rank(b.family),
  );
  // Within a family, lines before lone points: the lines are what the figure is about.
  for (const entry of families) {
    entry.runs = [...entry.runs.filter((run) => run.rows.length > 1), ...entry.runs.filter((run) => run.rows.length === 1)];
  }
  const runs = families.flatMap((entry) => entry.runs);
  assignStyles(runs, designs);
  const pending = families.flatMap((entry) => entry.pending);
  if (runs.length === 0 && pending.length === 0) return null;

  const stops = stopsOf(runs);
  const slopes = runs.flatMap((run) =>
    run.rows.flatMap((row) => WEIGHT_IDS.map((weights) => row[weights]?.slope).filter((value): value is number => value != null)),
  );
  const pad = 0.08;
  const slopeDomain: [number, number] = [Math.min(0, ...slopes) - pad, Math.max(1, ...slopes) + pad];

  return {
    fix,
    label: POSITION_FIX[fix].label.charAt(0).toUpperCase() + POSITION_FIX[fix].label.slice(1),
    families,
    runs,
    pending,
    stops,
    xMax: stops.at(-1)?.samples ?? 1e6,
    slopeDomain,
    defaultWeights: defaultWeightsOf(runs),
  };
}

/** The groups, before the fix first. Built once: the data is static for the life of the page. */
export const GROUPS: readonly OnsetGroup[] = (Object.keys(POSITION_FIX) as PositionFix[])
  .map(buildGroup)
  .filter((group): group is OnsetGroup => group !== null);

/** The value of one measure in an evaluation; null when the notebook does not report it. */
export function measureOf(evaluation: Evaluation | null, measure: MeasureId): number | null {
  if (!evaluation) return null;
  return evaluation[measure] ?? null;
}

/** The rows of a run that report the given weights. */
export function rowsWith(run: OnsetRun, weights: Weights): CheckpointRow[] {
  return run.rows.filter((row) => row[weights] !== null);
}

export interface StandAt {
  /** The checkpoint the values come from: the last one reported at or before the point. */
  row: CheckpointRow;
  evaluation: Evaluation;
  /** The run was evaluated at this stop (not only earlier). */
  here: boolean;
  /** The run has no checkpoint after this one, and it lies before the stop: its budget ended, or it was stopped. */
  past: boolean;
  /** Earlier checkpoints of the run gathered at the same stop (a checkpoint and the final one 15k samples later). */
  alsoHere: CheckpointRow[];
}

/**
 * Where a run stood at a point of training, with the given weights: its last
 * reported checkpoint at or before `samples`. Undefined before its first one.
 * With a stop, `here` says whether the run was evaluated at that stop.
 */
export function standAt(run: OnsetRun, weights: Weights, samples: number, stop?: Stop): StandAt | undefined {
  const rows = rowsWith(run, weights);
  let found: CheckpointRow | undefined;
  for (const row of rows) {
    if (row.samples <= samples) found = row;
  }
  const evaluation = found?.[weights];
  if (!found || !evaluation) return undefined;
  const from = stop?.from ?? samples;
  const here = found.samples >= from;
  const last = found;
  return {
    row: found,
    evaluation,
    here,
    past: found === rows[rows.length - 1] && found.samples < from,
    alsoHere: here ? rows.filter((row) => row !== last && row.samples >= from && row.samples <= last.samples) : [],
  };
}

/** The rows of a run, with the given weights, that training had reached at `samples`: nothing later is shown. */
export function revealedRows(run: OnsetRun, weights: Weights, samples: number): CheckpointRow[] {
  return rowsWith(run, weights).filter((row) => row.samples <= samples + 1);
}

/**
 * Where a policy has started to look: the first checkpoint whose slope reaches
 * SLOPE_MARK, and the first whose success reaches SUCCESS_MARK. Both are half
 * of their scale; they are thresholds chosen for the drawing, not measurements.
 */
export const SLOPE_MARK = 0.5;
export const SUCCESS_MARK = 0.5;

export interface Lead {
  run: OnsetRun;
  slope: CheckpointRow;
  /** Undefined while success has not reached the mark (by the cursor, or ever). */
  success: CheckpointRow | undefined;
  /** Samples between the two; to the cursor or the run's last checkpoint when success has not reached the mark. */
  samples: number;
}

/**
 * The run among `runs` whose slope reached its mark longest before its success
 * did (the first listed among equal leads), from the checkpoints revealed at `samples`. A run whose success reached
 * the mark is preferred to one whose success has not (yet); none when no slope
 * has reached its mark before success did.
 */
export function leadOf(runs: readonly OnsetRun[], weights: Weights, samples: number): Lead | undefined {
  let best: Lead | undefined;
  const better = (lead: Lead) =>
    !best ||
    (lead.success !== undefined && best.success === undefined) ||
    // Leads that differ by less than a stop are equal: the run listed first keeps it.
    ((lead.success === undefined) === (best.success === undefined) &&
      lead.samples - best.samples > SAME_STOP * Math.max(lead.samples, best.samples));
  for (const run of runs) {
    const rows = revealedRows(run, weights, samples);
    const slope = rows.find((row) => (row[weights]?.slope ?? Number.NEGATIVE_INFINITY) >= SLOPE_MARK);
    if (!slope) continue;
    const success = rows.find((row) => (row[weights]?.rate ?? 0) >= SUCCESS_MARK);
    const end = success?.samples ?? Math.min(samples, rows.at(-1)?.samples ?? samples);
    const lead: Lead = { run, slope, success, samples: end - slope.samples };
    if (lead.samples > 0 && better(lead)) best = lead;
  }
  return best;
}
