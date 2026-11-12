/**
 * What the grasp map can show, built from the data module's own lists: every
 * evaluation of the named-object task whose episodes are published
 * (`graspFiles()`), grouped as a selector, with the weights and the
 * conditions each one was evaluated under. Nothing here names a run or a
 * number: a run that finishes and gets a per-episode file appears by itself.
 *
 * And the geometry of the map: where the gripper closed, in millimetres from
 * the object the map is centred on, and a radial scale that is to scale
 * inside the 30 mm ring and compressed beyond it.
 */

import { evaluationOfGraspFile } from "@/data/evaluations";
import { beforeAfter } from "@/data/comparisons";
import { graspFiles, type GraspEpisode, type GraspFileInfo } from "@/data/files";
import { formatCount, formatSamples } from "@/data/format";
import { CONDITION_KINDS, POSITION_FIX, WEIGHT_IDS, conditionLabel, expertLabel, runLabel } from "@/data/labels";
import { expert, probe } from "@/data/probes";
import { isFinished, run as findRun } from "@/data/runs";
import type { ConditionKind, Count, Evaluation, Machine, Moved, ObjectId, PositionFix, Settings, Weights } from "@/data/types";

// ---------------------------------------------------------------- the selector

/** One evaluated checkpoint (or the scripted expert): a row of the selector. */
export interface EvaluationRow {
  /** `run|checkpoint`, unique. */
  key: string;
  run: string;
  checkpoint?: number;
  samples?: number;
  /** The run in words: "4000 demonstrations, no history", "Scripted expert". */
  label: string;
  /** "5.0M samples", or null for the expert. */
  samplesText: string | null;
  /** The weights it has published files for, in the notebook's order (trained, averaged). */
  weights: Weights[];
  files: GraspFileInfo[];
}

/** One run of the selector, with its evaluated checkpoints (one row each). */
export interface RunEntry {
  run: string;
  /** The run in words, as the rows say it. */
  label: string;
  /**
   * After the position fix, the run trained with the same recipe before it,
   * when the notebook sets the two side by side: "Same recipe as “4000
   * demonstrations, no history”, retrained after the fix". Null otherwise.
   */
  pairedWith: string | null;
  rows: EvaluationRow[];
}

export interface RowGroup {
  id: "expert" | PositionFix;
  /** Heading of the group; null for the expert, which stands first on its own. */
  label: string | null;
  runs: RunEntry[];
  rows: EvaluationRow[];
}

const capital = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

function buildGroups(): RowGroup[] {
  const byKey = new Map<string, EvaluationRow>();
  for (const file of graspFiles({ task: "pick_target" })) {
    const isExpert = file.run === "expert";
    const entry = isExpert ? undefined : findRun(file.run);
    // A run in progress has no published file; should one appear, it is not shown before the run is reported.
    if (!isExpert && entry?.status !== "finished") continue;
    const key = `${file.run}|${file.checkpoint ?? ""}`;
    let row = byKey.get(key);
    if (!row) {
      row = {
        key,
        run: file.run,
        checkpoint: file.checkpoint,
        samples: file.samples,
        label: isExpert ? expertLabel(false) : runLabel(entry!),
        samplesText: file.samples !== undefined ? `${formatSamples(file.samples)} samples` : null,
        weights: [],
        files: [],
      };
      byKey.set(key, row);
    }
    row.files.push(file);
  }
  for (const row of byKey.values()) {
    row.weights = WEIGHT_IDS.filter((weights) => row.files.some((file) => file.weights === weights));
  }

  const fixOf = (row: EvaluationRow): PositionFix | "expert" =>
    row.run === "expert" ? "expert" : (findRun(row.run)?.group.fix ?? "before");
  const orderOf = (row: EvaluationRow) => findRun(row.run)?.group.order ?? Number.POSITIVE_INFINITY;
  const shownRuns = new Set([...byKey.values()].map((row) => row.run));

  const pairedWith = (runName: string): string | null => {
    const pair = beforeAfter(runName);
    if (!pair || pair.after !== runName || pair.before === runName) return null;
    const before = findRun(pair.before);
    if (!before) return null;
    const where = shownRuns.has(pair.before) ? " above" : "";
    return `Same recipe as “${runLabel(before)}”${where}, retrained after the fix`;
  };

  const ids: RowGroup["id"][] = ["expert", "before", "after"];
  return ids
    .map((id) => {
      const rows = [...byKey.values()]
        .filter((row) => fixOf(row) === id)
        .sort(
          (a, b) =>
            orderOf(a) - orderOf(b) || a.run.localeCompare(b.run) || (a.samples ?? 0) - (b.samples ?? 0),
        );
      const runs: RunEntry[] = [];
      for (const row of rows) {
        const last = runs[runs.length - 1];
        if (last && last.run === row.run) last.rows.push(row);
        else runs.push({ run: row.run, label: row.label, pairedWith: pairedWith(row.run), rows: [row] });
      }
      return { id, label: id === "expert" ? null : capital(POSITION_FIX[id].label), runs, rows };
    })
    .filter((group) => group.rows.length > 0);
}

export const GROUPS: RowGroup[] = buildGroups();
export const ROWS: EvaluationRow[] = GROUPS.flatMap((group) => group.rows);

/** The run a row belongs to. */
export function runEntryOf(row: EvaluationRow): RunEntry | undefined {
  for (const group of GROUPS) {
    const entry = group.runs.find((candidate) => candidate.run === row.run);
    if (entry) return entry;
  }
  return undefined;
}

/**
 * The evaluation the figure opens on: the one that carries its contrast, the
 * failing policy whose grasps do not depend on where the objects are (its
 * final published checkpoint), with the scripted expert one click away. When
 * that run has no published file, the first policy in the list, then the
 * first row.
 */
const OPENING_RUN = "dp_vit_pt1500";
export const DEFAULT_ROW: EvaluationRow | undefined =
  ROWS.filter((row) => row.run === OPENING_RUN).at(-1) ?? ROWS.find((row) => row.run !== "expert") ?? ROWS[0];

/** The weights to show for a row: the reader's choice when the row has it, else the averaged weights, else what there is. */
export function weightsFor(row: EvaluationRow, preferred: Weights): Weights | undefined {
  if (row.weights.length === 0) return undefined;
  if (row.weights.includes(preferred)) return preferred;
  return row.weights.includes("ema") ? "ema" : row.weights[0];
}

// ---------------------------------------------------------------- conditions

const KIND_ORDER = Object.keys(CONDITION_KINDS) as ConditionKind[];

/** A set of conditions a row was evaluated under, with its file. */
export interface ConditionOption {
  file: GraspFileInfo;
  variant: string;
  kind: ConditionKind;
  /** "As trained", "Cameras frozen on the first frame", "Moved at step 20". */
  label: string;
  settings: Settings | null;
  /** For a moved object: how the episodes in which it could be moved went. */
  moved: Moved | null;
}

function conditionRecord(file: GraspFileInfo): { settings: Settings; moved: Moved | null } | undefined {
  if (file.run === "expert") return expert(file.variant);
  if (file.variant === "plain") return undefined;
  return probe(file.run, file.variant);
}

/** The conditions of a row with the given weights: the default conditions first, then by kind, in the index's order. */
export function conditionsFor(row: EvaluationRow, weights: Weights | undefined): ConditionOption[] {
  return row.files
    .filter((file) => file.weights === weights)
    .map((file, index) => {
      const record = conditionRecord(file);
      const settings = record?.settings ?? null;
      const label =
        file.variant === "plain"
          ? capital(CONDITION_KINDS.baseline.toLowerCase())
          : settings
            ? capital(conditionLabel(settings, { short: true }))
            : CONDITION_KINDS[file.kind];
      return { option: { file, variant: file.variant, kind: file.kind, label, settings, moved: record?.moved ?? null }, index };
    })
    .sort(
      (a, b) =>
        Number(b.option.variant === "plain") - Number(a.option.variant === "plain") ||
        KIND_ORDER.indexOf(a.option.kind) - KIND_ORDER.indexOf(b.option.kind) ||
        a.index - b.index,
    )
    .map(({ option }) => option);
}

/** The evaluation a file holds the episodes of: its success, how often it closed at the named object, its medians. */
export function evaluationOf(file: GraspFileInfo): Evaluation | undefined {
  return evaluationOfGraspFile(file);
}

/** The machine an evaluation ran on, as the notebook says; null when the data does not say. */
export function machineOf(file: GraspFileInfo): Machine | null {
  if (file.run === "expert") return expert(file.variant)?.machine ?? null;
  const entry = findRun(file.run);
  return isFinished(entry) ? entry.machine : null;
}

/** "85/100 lifted", for a selector row: what the default conditions gave with the weights shown. */
export function rowCount(row: EvaluationRow, weights: Weights | undefined): string | null {
  const file = row.files.find((entry) => entry.variant === "plain" && entry.weights === weights);
  const evaluation = file ? evaluationOf(file) : undefined;
  return evaluation ? formatCount(evaluation.successes, evaluation.episodes) : null;
}

/** The count a condition is reported with: for a moved object, the episodes in which it could be moved. */
export function reportedCount(option: ConditionOption): Count | undefined {
  if (option.moved) return option.moved;
  return evaluationOf(option.file);
}

// ---------------------------------------------------------------- what the map is centred on

/**
 * "named": the named object where it stood when the gripper first closed (for
 * a moved object, where it stood before the move); "moved_to": where a moved
 * object was put; "nearest": whichever object was nearest the gripper.
 */
export type Reference = "named" | "moved_to" | "nearest";

export const isDisturbance = (option: ConditionOption | undefined) => option?.kind === "disturbance";

export function referenceOptions(disturbance: boolean): { value: Reference; label: string }[] {
  return disturbance
    ? [
        { value: "named", label: "Old place" },
        { value: "moved_to", label: "New place" },
        { value: "nearest", label: "Nearest" },
      ]
    : [
        { value: "named", label: "Named object" },
        { value: "nearest", label: "Nearest object" },
      ];
}

/** The words for what the map is centred on, inside a sentence. */
export function referenceWords(reference: Reference, disturbance: boolean): string {
  if (reference === "nearest") return "the object nearest the gripper";
  if (reference === "moved_to") return "the place the named object was moved to";
  return disturbance ? "the place the named object stood before it was moved" : "the named object";
}

// ---------------------------------------------------------------- episodes on the map

/** An episode as the map draws it. */
export interface Dot {
  seed: number;
  target: ObjectId;
  success: boolean;
  nearest: ObjectId | null;
  closes: number | null;
  /** Offset of the gripper from the reference, in mm, robot frame: x away from the robot, y to its left. */
  dx: number;
  dy: number;
  /** Its length, in mm. */
  distance: number;
  /** Where the gripper was, in metres, robot frame. */
  tcp: [number, number];
  /** Distance to the named object (or, moved, where it stood) and to the nearest object, in mm. */
  toNamed: number;
  toNearest: number | null;
  /** For a moved object: distance to where it was put. */
  toMovedTo: number | null;
  /** The reference position, in metres, and every object of the layout at the close. */
  origin: [number, number];
  objects: Partial<Record<ObjectId, [number, number]>>;
  /** The named object moved: where it stood, where it was put. */
  moved: GraspEpisode["moved"];
}

const mm = (from: [number, number], to: [number, number]) => Math.hypot(to[0] - from[0], to[1] - from[1]) * 1000;

/**
 * The episodes of a file as dots relative to the reference. A moved object
 * counts only in the episodes in which it could be moved, as the notebook
 * counts them; the gripper must have closed for a dot to exist.
 */
export function dotsOf(episodes: GraspEpisode[], reference: Reference, disturbance: boolean): Dot[] {
  const dots: Dot[] = [];
  episodes.forEach((episode) => {
    if (!episode.tcp) return;
    if (disturbance && !episode.moved) return;
    const named = disturbance && episode.moved ? episode.moved.from : episode.objects[episode.target];
    if (!named) return;
    const nearest = episode.nearest ? episode.objects[episode.nearest] : undefined;
    const movedTo = episode.moved?.to ?? null;
    let origin: [number, number] | undefined;
    if (reference === "nearest") origin = nearest;
    else if (reference === "moved_to") origin = movedTo ?? undefined;
    else origin = named;
    if (!origin) return;
    const dx = (episode.tcp[0] - origin[0]) * 1000;
    const dy = (episode.tcp[1] - origin[1]) * 1000;
    dots.push({
      seed: episode.seed,
      target: episode.target,
      success: episode.success,
      nearest: episode.nearest,
      closes: episode.closes,
      dx,
      dy,
      distance: Math.hypot(dx, dy),
      tcp: episode.tcp,
      toNamed: mm(named, episode.tcp),
      toNearest: nearest ? mm(nearest, episode.tcp) : null,
      toMovedTo: movedTo ? mm(movedTo, episode.tcp) : null,
      origin,
      objects: episode.objects,
      moved: episode.moved,
    });
  });
  return dots;
}

// ---------------------------------------------------------------- the radial scale

/** The rings the notebook counts by (within 10, 20 and 30 mm): the part of the map drawn to scale. */
export const RINGS_MM = [10, 20, 30] as const;
/** Rings in the compressed part, and its edge: the table is about this wide. */
export const OUTER_RINGS_MM = [100, 300] as const;
export const EDGE_MM = 500;
const INNER_MM = RINGS_MM[RINGS_MM.length - 1];
/** Share of the radius given to the part drawn to scale. */
const INNER_SHARE = 0.58;

/**
 * Distance from the centre, 0 to 1, of a point `distance` mm away: linear up
 * to 30 mm, logarithmic from there to the edge, so a miss of a few
 * millimetres and one of half a metre are both on the map. Beyond the edge it
 * stays at 1.
 */
export function radial(distance: number): number {
  if (distance <= INNER_MM) return (INNER_SHARE * distance) / INNER_MM;
  const share = Math.log(distance / INNER_MM) / Math.log(EDGE_MM / INNER_MM);
  return Math.min(1, INNER_SHARE + (1 - INNER_SHARE) * share);
}

/**
 * Screen offset of a dot from the centre, for a map of radius `radius` px.
 * Seen from above with the robot at the bottom: away from the robot (+x) is
 * up, the robot's left (+y) is left.
 */
export function project(dot: Pick<Dot, "dx" | "dy" | "distance">, radius: number): { x: number; y: number } {
  if (dot.distance === 0) return { x: 0, y: 0 };
  const r = radial(dot.distance) * radius;
  return { x: (-dot.dy / dot.distance) * r, y: (-dot.dx / dot.distance) * r };
}
