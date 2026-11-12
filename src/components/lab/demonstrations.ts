/**
 * The runs of section 6, "What the demonstrations contain": the comparison
 * table's finished runs and every run of the family still in progress or not
 * in the data yet, in the notebook's order. Shared by the table (a client
 * component) and the section (a server component).
 */

import { comparisonRows } from "@/data/comparisons";
import { awaitedRuns, run, runsByGroup } from "@/data/runs";

export interface Row {
  name: string;
  words: string;
  order: number;
  inProgress: boolean;
}

/** The runs of the section, in the notebook's order. */
export function demonstrationRows(): Row[] {
  const table = comparisonRows("demonstrations");
  const byName = new Map<string, Row>();
  for (const entry of table?.rows ?? []) {
    const found = run(entry.run);
    byName.set(entry.run, {
      name: entry.run,
      words: entry.words,
      order: found?.group.order ?? Number.POSITIVE_INFINITY,
      inProgress: found?.status === "in_progress",
    });
  }
  for (const entry of runsByGroup({ fix: "after", family: "demonstrations" })) {
    if (!byName.has(entry.name)) {
      byName.set(entry.name, {
        name: entry.name,
        words: entry.label,
        order: entry.group.order ?? Number.POSITIVE_INFINITY,
        inProgress: entry.status === "in_progress",
      });
    }
  }
  for (const entry of awaitedRuns()) {
    if (entry.group.fix === "after" && entry.group.family === "demonstrations" && !byName.has(entry.name)) {
      byName.set(entry.name, { name: entry.name, words: entry.label, order: Number.POSITIVE_INFINITY, inProgress: true });
    }
  }
  return [...byName.values()].sort((a, b) => a.order - b.order);
}
