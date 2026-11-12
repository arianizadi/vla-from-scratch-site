/**
 * What the hero plate draws, read on the server from the data module so the
 * page's client code carries only these few strings and the addresses of the
 * per-episode files. Nothing here is a typed number: the evaluations, their
 * training samples and the number of episodes come from src/data.
 */

import { slug } from "github-slugger";
import { checkpointRows } from "@/data/checkpoints";
import { evaluationOfGraspFile } from "@/data/evaluations";
import { graspFiles, graspUrl, type GraspFileInfo } from "@/data/files";
import { MISSING, formatCount, formatMm, formatPercent, formatSamples, formatSlope, formatSuccess } from "@/data/format";
import { MACHINES, OBJECTS, OBJECT_IDS, WEIGHTS, WEIGHT_IDS } from "@/data/labels";
import { expert } from "@/data/probes";
import { isFinished, run } from "@/data/runs";
import type { ObjectId, Weights } from "@/data/types";
import type { MarkerShape } from "@/figures/kit/chart/Marker";
import { OBJECT_SERIES } from "@/figures/kit/chart/series";

/** The policy the hero follows through training: the recipe that works, before the position fix. */
export const HERO_RUN = "dp_vit_lang_reactive_pt4k";

export interface HeroCells {
  success: string;
  named: string;
  slope: string;
  miss: string;
}

export interface HeroStage {
  /** Unique among the stages; also the value of its segment. */
  key: string;
  /** Address of its per-episode file on this site. */
  url: string;
  /** Segment and table label: "1.0M", or "Scripted expert". */
  short: string;
  /** In a sentence: "after 1.0M training samples". */
  long: string;
  isExpert: boolean;
  cells: HeroCells;
  /** The stage's numbers in one sentence, for the status line and the text alternative. */
  summary: string;
}

export interface HeroObject {
  id: ObjectId;
  label: string;
  short: string;
  color: string;
  shape: MarkerShape;
}

export interface HeroData {
  /** The run in words: "4000 demonstrations, no history". */
  runLabel: string;
  /** Weights with published files, averaged first when they exist. */
  weights: { value: Weights; label: string }[];
  stages: Partial<Record<Weights, HeroStage[]>>;
  expert: HeroStage | null;
  /** Episodes per evaluation, when every file has the same number. */
  episodes: number | null;
  objects: HeroObject[];
  /** Where the run's and the expert's numbers are on the results page. */
  runHref: string;
  expertHref: string | null;
  /** "machine B (L40S GPUs)", when the run says. */
  machine: string | null;
}

const labHref = (section: string | undefined) => (section ? `/lab#${slug(section)}` : "/lab");

const capitalised = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function policyStage(file: GraspFileInfo, finalCheckpoint: number | undefined): HeroStage | null {
  const evaluation = evaluationOfGraspFile(file);
  if (!evaluation || file.samples === undefined || file.weights === undefined) return null;
  const samples = formatSamples(file.samples);
  const isFinal = file.checkpoint !== undefined && file.checkpoint === finalCheckpoint;
  const cells: HeroCells = {
    // One format for the column, policies and expert alike: "36/100 = 36%".
    success: formatSuccess(evaluation),
    named: formatPercent(evaluation.named),
    slope: formatSlope(evaluation.slope),
    miss: formatMm(evaluation.missMm),
  };
  const long = `after ${samples} training samples${isFinal ? ", the final checkpoint" : ""}`;
  return {
    key: file.id,
    url: graspUrl(file.id),
    short: samples,
    long,
    isExpert: false,
    cells,
    summary:
      `${capitalised(long)} (${WEIGHTS[file.weights].label}): ${formatCount(evaluation.successes, evaluation.episodes)} succeeded. ` +
      `The gripper first closed nearest the named object in ${cells.named} of episodes, a median ${cells.miss} from it; ` +
      `the slope of where it closed against where the object was is ${cells.slope}.`,
  };
}

function expertStage(): HeroStage | null {
  const file = graspFiles({ run: "expert", variant: "plain" })[0];
  const evaluation = expert();
  if (!file || !evaluation) return null;
  // The notebook reports the expert's success and median miss, not the other two.
  const cells: HeroCells = {
    success: formatSuccess(evaluation),
    named: MISSING,
    slope: MISSING,
    miss: formatMm(evaluation.missMm),
  };
  return {
    key: file.id,
    url: graspUrl(file.id),
    short: "Scripted expert",
    long: "the scripted expert",
    isExpert: true,
    cells,
    summary: `The scripted expert, the reference: ${cells.success} succeeded, and the gripper closed a median ${cells.miss} from the named object.`,
  };
}

export function heroData(): HeroData {
  const entry = run(HERO_RUN);
  const rows = checkpointRows(HERO_RUN);
  const finalCheckpoint = rows.find((row) => row.final)?.checkpoint;

  const stages: Partial<Record<Weights, HeroStage[]>> = {};
  for (const weights of WEIGHT_IDS) {
    const list = graspFiles({ run: HERO_RUN, variant: "plain", weights })
      .filter((file) => file.samples !== undefined)
      .sort((a, b) => (a.samples ?? 0) - (b.samples ?? 0))
      .map((file) => policyStage(file, finalCheckpoint))
      .filter((stage): stage is HeroStage => stage !== null);
    if (list.length > 0) stages[weights] = list;
  }
  const weights = [...WEIGHT_IDS]
    .reverse()
    .filter((id) => stages[id])
    .map((id) => ({ value: id, label: capitalised(WEIGHTS[id].label) }));

  const files = [
    ...graspFiles({ run: HERO_RUN, variant: "plain" }),
    ...graspFiles({ run: "expert", variant: "plain" }),
  ];
  const counts = new Set(files.map((file) => file.episodes));
  const expertRow = expert();
  const sections = isFinished(entry) ? entry.sections : [];

  return {
    runLabel: entry?.label ?? HERO_RUN,
    weights,
    stages,
    expert: expertStage(),
    episodes: counts.size === 1 ? [...counts][0] : null,
    objects: OBJECT_IDS.map((id) => {
      const series = OBJECT_SERIES[OBJECTS[id].series];
      return { id, label: OBJECTS[id].label, short: OBJECTS[id].short, color: series.color, shape: series.shape };
    }),
    runHref: labHref(sections.find((section) => section.includes(HERO_RUN)) ?? sections[0]),
    expertHref: expertRow ? labHref(expertRow.sections[0]) : null,
    machine: isFinished(entry) && entry.machine ? MACHINES[entry.machine].label : null,
  };
}
