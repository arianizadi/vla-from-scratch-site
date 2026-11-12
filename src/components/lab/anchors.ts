/**
 * Anchors for the lab notebook's own headings. Other pages link to a result
 * as `/lab#<heading>`, with the heading slugged as GitHub slugs it in the
 * notebook ("#how-each-policy-copes-outside-the-conditions-it-was-trained-in").
 * Each heading the data module names is given to the section of this page
 * that shows its numbers, once; the section renders an empty target with
 * that id at its top.
 *
 * The headings come from the data (a run's `sections`, each notebook entry's
 * `section`), so a run that is reported later brings its headings with it.
 * The few headings that only group others are written out.
 */

import { slug } from "github-slugger";
import { comparisonRows, beforeAfterPairs } from "@/data/comparisons";
import {
  disturbanceNotes,
  expertElsewhere,
  firstRound,
  flowerSteps,
  flowerTrimming,
  inferenceNotes,
  notebookOnly,
  pickCube,
  positionTable,
  remainingFailures,
  setup,
  stageResults,
} from "@/data/notebook";
import { batterySection, probedRuns, probes } from "@/data/probes";
import { run, runs, type Run } from "@/data/runs";
import { tolerance } from "@/data/tolerance";
import { SECTIONS } from "./sections";

type SectionId = (typeof SECTIONS)[keyof typeof SECTIONS]["id"];

/** Ids the page already gives to its own headings; a notebook heading with the same slug lands there. */
const TAKEN = new Set<string>([
  ...Object.values(SECTIONS).map((section) => section.id),
  "the-scripted-expert",
  "final-checkpoints",
  "datasets",
  // The flower steps' subheadings take the notebook's slugs as their own ids.
  ...flowerSteps.map((heading) => slug(heading)),
]);

const sectionsOf = (predicate: (entry: Run) => boolean) =>
  runs()
    .filter(predicate)
    .flatMap((entry) => (entry.status === "finished" ? entry.sections : []));

function build(): Map<SectionId, string[]> {
  // In order of priority: a heading goes to the first section that claims it.
  const claims: [SectionId, (string | null | undefined)[]][] = [
    [SECTIONS.task.id, [setup.section, expertElsewhere.section]],
    [SECTIONS.sampler.id, [inferenceNotes.section]],
    [SECTIONS.outside.id, [batterySection]],
    [
      SECTIONS.dependsOn.id,
      [
        disturbanceNotes.section,
        ...probedRuns()
          .filter((name) => run(name)?.group.family === "reference" && run(name)?.group.fix === "before")
          .flatMap((name) => probes(name).flatMap((row) => row.sections)),
      ],
    ],
    [SECTIONS.positionFix.id, [...beforeAfterPairs().slice(0, 1).map((pair) => pair.section), remainingFailures.section, "After the position fix (machine B)"]],
    [
      SECTIONS.demonstrations.id,
      [comparisonRows("demonstrations")?.section, ...sectionsOf((entry) => entry.group.family === "demonstrations")],
    ],
    [SECTIONS.tolerance.id, [tolerance("B").section, tolerance("A").section]],
    [SECTIONS.flower.id, [flowerTrimming.section]],
    [SECTIONS.records.id, [notebookOnly.datasets.section, positionTable.section, "Runs in progress when this was written"]],
    [
      SECTIONS.history.id,
      sectionsOf((entry) => entry.group.family === "history"),
    ],
    [
      SECTIONS.headline.id,
      [
        "`pick_target`, second round (machine B)",
        "Does the closing position depend on the scene?",
        ...sectionsOf((entry) => entry.group.fix === "before" && (entry.group.family === "reference" || entry.group.family === "first_round")),
      ],
    ],
    [SECTIONS.positionFix.id, sectionsOf((entry) => entry.group.family === "single_cube")],
    [
      SECTIONS.backbones.id,
      [
        pickCube.section,
        firstRound.section,
        stageResults.section,
        stageResults.machineB.section,
        ...beforeAfterPairs().slice(1).map((pair) => pair.section),
        ...sectionsOf((entry) => entry.group.family === "backbones" || (entry.design.seed !== null && entry.design.seed !== undefined)),
      ],
    ],
  ];

  const seen = new Set(TAKEN);
  const result = new Map<SectionId, string[]>();
  for (const [section, headings] of claims) {
    for (const heading of headings) {
      if (!heading) continue;
      const id = slug(heading);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      result.set(section, [...(result.get(section) ?? []), id]);
    }
  }
  return result;
}

let built: Map<SectionId, string[]> | undefined;

/** The notebook headings whose numbers a section of this page shows, as anchor ids. */
export function notebookAnchors(section: string): string[] {
  built ??= build();
  return built.get(section as SectionId) ?? [];
}
