/**
 * The field notes are written as runs finish, so they quote results the data
 * module does not have yet: a run the notebook reports while the site's data
 * still lists it as in progress. The site shows no value for a run in
 * progress, so a passage of the notes that reports one is held back here
 * until the data module lists the run as finished.
 *
 * Which run a passage is about is read off the run's design in the data
 * module (its traits, its seed, its backbone), never off a list of names: a
 * passage is about the most specific run whose every feature it mentions.
 * When that run, or one as specific, is in progress, every numeric statement
 * of the passage is replaced by a sentence saying so. Passages without a
 * number stay as written. Build time only.
 */

import type { ListItem, Paragraph, Root, RootContent, TableRow } from "mdast";
import { toString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { awaitedRuns, runs, type Run } from "@/data/runs";

type Design = Run["design"];

/** The words a passage uses for each feature of a run's design. */
const TRAIT_WORDS: Record<string, RegExp> = {
  hold_frame: /hold[- ]frame|hold_steps|frame of the robot at rest/i,
  every_object_named: /every object|naming every|each object in turn/i,
  random_start: /random (?:start|gripper pose)/i,
  recoveries: /recover|moved once/i,
  early_windows: /early windows|frames repeated|repeated \d+ extra times/i,
};

function featuresOf(design: Design): RegExp[] {
  const features = (design.traits ?? []).map((trait) => TRAIT_WORDS[trait] ?? new RegExp(trait.replace(/_/g, "[ -]"), "i"));
  if (design.seed !== null && design.seed !== undefined) features.push(/\b(?:second|another|other|new) seed\b|\bseeds\b/i);
  if (design.backbone === "qwen") features.push(/qwen/i);
  if (design.backbone === "scratch") features.push(/pretrain/i);
  if (design.backbone === "scratch_random") features.push(/random(?:ly)?[- ]init|without pretraining/i);
  if (design.conditioning === "tokens") features.push(/every token|each token|all (?:the )?tokens/i);
  return features;
}

interface Candidate {
  label: string;
  inProgress: boolean;
  features: RegExp[];
}

let memo: Candidate[] | undefined;

function candidates(): Candidate[] {
  if (memo) return memo;
  const listed: Candidate[] = runs().map((entry) => ({
    label: entry.label,
    inProgress: entry.status !== "finished",
    features: featuresOf(entry.design),
  }));
  const awaited: Candidate[] = awaitedRuns().map((entry) => ({
    label: entry.label,
    inProgress: true,
    features: featuresOf(entry.design as Design),
  }));
  memo = [...listed, ...awaited].filter((candidate) => candidate.features.length > 0);
  return memo;
}

/** The runs in progress a passage reports on, by label; empty when it is about finished runs only. */
export function runsInProgressIn(text: string): string[] {
  const matched = candidates().filter((candidate) => candidate.features.every((feature) => feature.test(text)));
  if (matched.length === 0) return [];
  const most = Math.max(...matched.map((candidate) => candidate.features.length));
  return [...new Set(matched.filter((candidate) => candidate.features.length === most && candidate.inProgress).map((c) => c.label))];
}

const HAS_NUMBER = /\d/;

/** The sentence that stands in for a passage held back. */
export function heldBackSentence(labels: string[]): string {
  const which = labels.length > 0 ? ` (${labels.join("; ")})` : "";
  return `Not shown yet: this passage reports runs that are still training${which}. Its numbers appear here when the lab notebook's data reports the runs as finished.`;
}

interface Replacement {
  start: number;
  end: number;
  text: string;
}

function offsets(node: { position?: { start: { offset?: number }; end: { offset?: number } } }) {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  return start === undefined || end === undefined ? undefined : { start, end };
}

/**
 * The notes' Markdown with every numeric passage about a run in progress
 * replaced. `all` holds back every numeric passage (an entry whose own status
 * says it is in progress).
 */
export function holdBackInProgress(markdown: string, { all = false }: { all?: boolean } = {}): string {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as Root;
  const replacements: Replacement[] = [];

  const visitParagraph = (node: Paragraph) => {
    const text = toString(node);
    if (!HAS_NUMBER.test(text)) return;
    const labels = runsInProgressIn(text);
    if (!all && labels.length === 0) return;
    const range = offsets(node);
    if (range) replacements.push({ ...range, text: `*${heldBackSentence(labels)}*` });
  };

  // A row that begins "the same" continues the row above it.
  let previousRow = "";
  const visitRow = (row: TableRow) => {
    const own = toString(row);
    const text = /^\s*the same\b/i.test(own) ? `${previousRow} ${own}` : own;
    previousRow = text;
    if (!HAS_NUMBER.test(text)) return;
    if (!all && runsInProgressIn(text).length === 0) return;
    row.children.slice(1).forEach((cell) => {
      const range = offsets(cell);
      if (range && HAS_NUMBER.test(toString(cell))) {
        // The cell's range includes its pipe; keep it.
        const source = markdown.slice(range.start, range.end);
        const lead = /^\|?\s*/.exec(source)?.[0] ?? "";
        const tail = /\s*\|?$/.exec(source)?.[0] ?? "";
        replacements.push({ start: range.start, end: range.end, text: `${lead}in progress${tail}` });
      }
    });
  };

  const walk = (nodes: RootContent[]) => {
    for (const node of nodes) {
      if (node.type === "paragraph") visitParagraph(node);
      else if (node.type === "table") node.children.slice(1).forEach(visitRow);
      else if (node.type === "list") node.children.forEach((item: ListItem) => walk(item.children));
      else if (node.type === "blockquote") walk(node.children);
    }
  };
  walk(tree.children);

  let out = markdown;
  for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
    out = `${out.slice(0, replacement.start)}${replacement.text}${out.slice(replacement.end)}`;
  }
  return out;
}
