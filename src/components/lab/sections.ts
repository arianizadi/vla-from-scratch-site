/** The sections of the lab page, in the notebook's order. The sidebar and the headings read this list. */

import type { SectionInfo } from "./shared";

export const SECTIONS = {
  task: { id: "task", number: 1, title: "The task and the scripted expert" },
  headline: { id: "before-the-fix", number: 2, title: "Before the position fix" },
  history: { id: "history", number: 3, title: "History against no history" },
  dependsOn: { id: "what-it-depends-on", number: 4, title: "What the policy that works depends on" },
  positionFix: { id: "position-fix", number: 5, title: "The position-table bug" },
  demonstrations: { id: "demonstrations", number: 6, title: "What the demonstrations contain" },
  outside: { id: "outside-the-training-conditions", number: 7, title: "Outside the conditions it was trained in" },
  backbones: { id: "backbones", number: 8, title: "Backbones and a second seed" },
  sampler: { id: "sampler", number: 9, title: "Sampler settings" },
  tolerance: { id: "grasp-tolerance", number: 10, title: "Grasp tolerance" },
  records: { id: "datasets-runs-bugs", number: 11, title: "Datasets, runs in progress, bugs" },
} as const satisfies Record<string, SectionInfo>;

export const SECTION_LIST: SectionInfo[] = Object.values(SECTIONS);
