/**
 * The findings the landing page states below the hero. Their words and
 * numbers are in src/data/findings.json ("statements"), each with the
 * notebook passages it was copied from; `npm run sync` checks the passages.
 *
 * One sentence is built here from the data module instead, because it is
 * about every policy of a table that grows as runs finish: how the policies
 * trained without recoveries did when the object was moved as the gripper
 * closed.
 */

import { slug } from "github-slugger";
import data from "@/data/findings.json";
import { formatCount } from "@/data/format";
import { batteryCell, batteryRuns } from "@/data/probes";
import { run } from "@/data/runs";
import type { Count } from "@/data/types";

export interface Statement {
  id: string;
  title: string;
  text: string;
  /** The chapter that explains it: its file name without .md. */
  chapter: string;
  /** The notebook heading its numbers are under. */
  section: string;
}

export interface SmallerStatement {
  id: string;
  text: string;
  chapter: string;
  section: string;
}

export const statements: Statement[] = data.statements.items;
export const smallerStatements: SmallerStatement[] = data.statements.smaller;

/** The results page's anchor for a notebook heading, as GitHub makes it for the notebook itself. */
export function resultsHref(section: string): string {
  return `/lab#${slug(section)}`;
}

/**
 * The notebook heading in plain words: without a run's or config's name in
 * parentheses ("(`dp_vit_lang_reactive_pt4k`)") and without the code marks.
 */
export function sectionWords(section: string): string {
  return section
    .replace(/\s*\(`[^`]*`\)/g, "")
    .replace(/`/g, "")
    .trim();
}

/** The conditions the sentence below reads: the object is moved as the gripper first closes. */
const MOVED_AT_GRASP = "disturb_grasp";

/**
 * "Of the 5 policies in that table trained without recoveries, the best
 * succeeded in 1/99 ...": built from the battery, so it stays true as rows are
 * added. Undefined when the table has no such policy or no such column.
 */
export function withoutRecoveries(): string | undefined {
  const cells = batteryRuns()
    .filter((row) => {
      const entry = run(row.run);
      return entry !== undefined && !entry.design.traits.includes("recoveries");
    })
    .map((row) => batteryCell(row.run, MOVED_AT_GRASP))
    .filter((cell): cell is NonNullable<typeof cell> => cell !== undefined && cell.episodes > 0);
  if (cells.length === 0) return undefined;
  const best = cells.reduce<Count>(
    (top, cell) => (cell.successes / cell.episodes > top.successes / top.episodes ? cell : top),
    cells[0],
  );
  const who =
    cells.length === 1
      ? "the one policy in that table trained on demonstrations without recoveries"
      : `the best of the ${cells.length} policies in that table trained on demonstrations without recoveries`;
  return `Under the same move, ${who} succeeded in ${formatCount(best.successes, best.episodes)}.`;
}
