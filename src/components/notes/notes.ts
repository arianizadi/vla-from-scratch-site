/**
 * The field notes (content/notes.md, copied from tutorial/notes.md by
 * scripts/sync-content.mjs), read into the parts the /notes page lays out.
 *
 * Nothing about the file is assumed but its shape, so the page stays right
 * while the file is edited as runs finish:
 *
 *   # Title
 *   intro paragraphs; one starting "Status legend" is replaced by the page's own key
 *   ## A summary          a section that is one table whose last column is "Entry"
 *   ## The short version  any other section before the first entry
 *   ## N. Title  (status) an entry; the status may name several parts ("confirmed on x, open on y")
 *   ## Open questions...  a section whose title says "question"
 *
 * Runs at build time only (file I/O). A file that is missing or cannot be read
 * gives `undefined`; a file whose structure is unexpected still renders, every
 * section as plain Markdown.
 */

import fs from "node:fs";
import path from "node:path";
import GithubSlugger from "github-slugger";
import type { Heading as MdHeading, Root as MdRoot, RootContent, Table } from "mdast";
import { toString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { site } from "@/lib/site";
import { heldBackSentence, holdBackInProgress, runsInProgressIn } from "./progress";

const NOTES_FILE = path.join(process.cwd(), "content", "notes.md");
/** Where the notes live in the tutorial repository; their relative links are written from there. */
export const NOTES_REPO_PATH = `${path.posix.dirname(site.chapterDir)}/notes.md`;

export type StatusKind = "confirmed" | "open" | "progress" | "inconclusive" | "other";

export interface StatusPart {
  kind: StatusKind;
  /** The rest of the part as written ("on `pick_cube`"), Markdown; "" when there is none. */
  qualifier: string;
  /** The part as written, for a status the page does not know. */
  raw: string;
}

export type SummaryTone = "worked" | "failed" | "wrong" | "neutral";

export interface SummaryItem {
  /** Markdown of each cell but the entry column, in the table's order. */
  cells: string[];
  /** Entry numbers named in the entry column. */
  entries: number[];
  /** The entry column as written, for numbers that are not entries. */
  entryText: string;
  /** Set when the row reports a run still in progress: its evidence is held back, and this says why. */
  heldBack?: string;
}

interface SectionBase {
  id: string;
  /** Heading as Markdown (inline). */
  title: string;
  /** Heading as plain text, for navigation and labels. */
  text: string;
}

export interface SummarySection extends SectionBase {
  type: "summary";
  tone: SummaryTone;
  /** The table's column headings, without the entry column. */
  columns: string[];
  items: SummaryItem[];
}

export interface EntrySection extends SectionBase {
  type: "entry";
  number: number;
  statusText: string;
  status: StatusPart[];
  body: string;
}

export interface TextSection extends SectionBase {
  type: "text" | "questions";
  body: string;
}

export type NotesSection = SummarySection | EntrySection | TextSection;

export interface Notes {
  /** The file's h1 as plain text. */
  title: string;
  /** Intro paragraphs as Markdown, without the status legend. */
  intro: string;
  sections: NotesSection[];
}

// ---------------------------------------------------------------- links

const SCHEME = /^([a-z][a-z0-9+.-]*:|\/\/)/i;
const NOTES_DIR = path.posix.dirname(NOTES_REPO_PATH);

/**
 * The pipeline resolves relative links from the chapter folder; the notes sit
 * one level up. A relative link is rewritten so that it reaches the same file
 * from there: chapters/41-x.md becomes 41-x.md (-> /learn/41-x), lab-notebook.md
 * becomes ../lab-notebook.md (-> /lab).
 */
function rebase(url: string): string {
  if (!url || url.startsWith("#") || url.startsWith("/") || SCHEME.test(url)) return url;
  const hashAt = url.search(/[?#]/);
  const target = hashAt === -1 ? url : url.slice(0, hashAt);
  const rest = hashAt === -1 ? "" : url.slice(hashAt);
  const repoPath = path.posix.normalize(path.posix.join(NOTES_DIR, target));
  const relative = path.posix.relative(site.chapterDir, repoPath) || ".";
  return `${relative}${target.endsWith("/") ? "/" : ""}${rest}`;
}

const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const INLINE_LINK = /(\]\(\s*<?)([^)\s>]+)/g;
const DEFINITION = /^( {0,3}\[[^\]]+\]:\s*<?)(\S+?)(>?(?:\s|$))/;

/** Rewrites the destinations of inline links, images and link definitions outside fenced code. */
function rebaseLinks(markdown: string): string {
  let fence: string | undefined;
  return markdown
    .split("\n")
    .map((line) => {
      const opened = FENCE.exec(line);
      if (opened) {
        if (!fence) fence = opened[1];
        else if (opened[1][0] === fence[0] && opened[1].length >= fence.length) fence = undefined;
        return line;
      }
      if (fence) return line;
      return line
        .replace(DEFINITION, (_all, head: string, url: string, tail: string) => `${head}${rebase(url)}${tail}`)
        .replace(INLINE_LINK, (_all, head: string, url: string) => `${head}${rebase(url)}`);
    })
    .join("\n");
}

// ---------------------------------------------------------------- status

const STATUS_WORDS: [RegExp, StatusKind][] = [
  [/^(confirmed|measured(?: here)?)\b/i, "confirmed"],
  [/^(in progress|running|still training)\b/i, "progress"],
  [/^(inconclusive)\b/i, "inconclusive"],
  [/^(open)\b/i, "open"],
];

/** "confirmed on `pick_cube`, open on `pick_target`" -> two parts. Undefined when no part is a known status. */
export function parseStatus(text: string): StatusPart[] | undefined {
  const parts: StatusPart[] = [];
  for (const piece of text.split(/[,;]/).map((value) => value.trim()).filter(Boolean)) {
    const known = STATUS_WORDS.find(([pattern]) => pattern.test(piece));
    if (known) {
      const [pattern, kind] = known;
      parts.push({ kind, qualifier: piece.replace(pattern, "").trim(), raw: piece });
    } else if (parts.length > 0) {
      const last = parts[parts.length - 1];
      last.qualifier = [last.qualifier, piece].filter(Boolean).join(", ");
      last.raw = `${last.raw}, ${piece}`;
    } else {
      parts.push({ kind: "other", qualifier: "", raw: piece });
    }
  }
  return parts.some((part) => part.kind !== "other") ? parts : undefined;
}

// ---------------------------------------------------------------- sections

const ENTRY_HEADING = /^(\d+)\.\s+(.+)$/;
const TRAILING_PARENS = /^(.*?)\s*\(([^()]*)\)\s*$/;

function toneOf(title: string): SummaryTone {
  const text = title.toLowerCase();
  if (/did ?n[o']t work|not work|failed/.test(text)) return "failed";
  if (/wrong|mistake/.test(text)) return "wrong";
  if (/worked|works/.test(text)) return "worked";
  return "neutral";
}

function slice(source: string, node: { position?: { start: { offset?: number }; end: { offset?: number } } }): string {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  return start === undefined || end === undefined ? "" : source.slice(start, end);
}

/** The heading's inline Markdown, without the #s. */
function headingSource(source: string, heading: MdHeading): string {
  return slice(source, heading)
    .replace(/^ {0,3}#{1,6}[ \t]*/, "")
    .replace(/[ \t]+#+[ \t]*$/, "")
    .trim();
}

/** A section that is one table whose last column names entries becomes a summary list. */
function asSummary(source: string, base: SectionBase, nodes: RootContent[]): SummarySection | undefined {
  const content = nodes.filter((node) => node.type !== "html");
  if (content.length !== 1 || content[0].type !== "table") return undefined;
  const table = content[0] as Table;
  const [head, ...rows] = table.children;
  if (!head || rows.length === 0) return undefined;
  const headings = head.children.map((cell) => toString(cell).trim());
  const entryColumn = headings.length - 1;
  if (entryColumn < 1 || !/^entr(y|ies)$/i.test(headings[entryColumn])) return undefined;

  return {
    ...base,
    type: "summary",
    tone: toneOf(base.text),
    columns: headings.slice(0, entryColumn),
    items: rows.map((row) => {
      const cells = row.children.map((cell) => slice(source, cell).replace(/^\|/, "").replace(/\|$/, "").trim());
      const entryText = toString(row.children[entryColumn] ?? { type: "text", value: "" }).trim();
      return {
        cells: Array.from({ length: entryColumn }, (_unused, index) => cells[index] ?? ""),
        entries: (entryText.match(/\d+/g) ?? []).map(Number),
        entryText,
      };
    }),
  };
}

export function parseNotes(raw: string): Notes {
  const source = rebaseLinks(raw.replace(/\r\n?/g, "\n"));
  const tree = unified().use(remarkParse).use(remarkGfm).parse(source) as MdRoot;
  const slugger = new GithubSlugger();
  // Entry anchors are "entry-N"; a section titled the same way must not take one.
  const reserved = new Set<string>();

  let title = "";
  const intro: string[] = [];
  const groups: { heading: MdHeading; nodes: RootContent[] }[] = [];

  for (const node of tree.children) {
    if (node.type === "heading" && node.depth === 1 && !title && groups.length === 0) {
      // A typographic apostrophe in the title ("didn’t"); the body goes through the Markdown pipeline as written.
      title = toString(node).trim().replace(/(\w)'(\w)/g, "$1\u2019$2");
    } else if (node.type === "heading" && node.depth === 2) {
      groups.push({ heading: node, nodes: [] });
    } else if (groups.length > 0) {
      groups[groups.length - 1].nodes.push(node);
    } else if (!(node.type === "paragraph" && /^status legend\b/i.test(toString(node).trim()))) {
      intro.push(slice(source, node));
    }
  }

  const entryNumbers = groups.flatMap(({ heading }) => {
    const match = ENTRY_HEADING.exec(toString(heading).trim());
    return match ? [Number(match[1])] : [];
  });
  for (const number of entryNumbers) reserved.add(`entry-${number}`);

  const sections = groups.map(({ heading, nodes }): NotesSection => {
    const markdown = headingSource(source, heading);
    const text = toString(heading).trim();
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const body = first && last ? source.slice(first.position?.start.offset ?? 0, last.position?.end.offset ?? 0) : "";

    const entry = ENTRY_HEADING.exec(markdown);
    if (entry) {
      const number = Number(entry[1]);
      const withStatus = TRAILING_PARENS.exec(entry[2]);
      const status = withStatus ? parseStatus(withStatus[2]) : undefined;
      const entryTitle = status && withStatus ? withStatus[1] : entry[2];
      const plainMatch = TRAILING_PARENS.exec(ENTRY_HEADING.exec(text)?.[2] ?? text);
      return {
        type: "entry",
        id: `entry-${number}`,
        number,
        title: entryTitle,
        text: status && plainMatch ? plainMatch[1] : (ENTRY_HEADING.exec(text)?.[2] ?? text),
        statusText: status && withStatus ? withStatus[2] : "",
        status: status ?? [],
        body: holdBackInProgress(body, { all: (status ?? []).some((part) => part.kind === "progress") }),
      };
    }

    let id = slugger.slug(text);
    while (reserved.has(id)) id = slugger.slug(text);
    const base: SectionBase = { id, title: markdown, text };
    const summary = asSummary(source, base, nodes);
    if (summary) return summary;
    return { ...base, type: /question/i.test(text) ? "questions" : "text", body: holdBackInProgress(body) };
  });

  // A summary row that reports a run still in progress, or points only to entries in progress, keeps
  // its first column and says "in progress" where its evidence would be.
  const progressEntries = new Set(
    sections.flatMap((section) =>
      section.type === "entry" && section.status.some((part) => part.kind === "progress") ? [section.number] : [],
    ),
  );
  for (const section of sections) {
    if (section.type !== "summary") continue;
    for (const item of section.items) {
      const text = item.cells.join(" ");
      const labels = runsInProgressIn(text);
      const pointsToProgress = item.entries.length > 0 && item.entries.every((number) => progressEntries.has(number));
      if (/\d/.test(text) && (labels.length > 0 || pointsToProgress)) {
        item.heldBack = heldBackSentence(labels);
        item.cells = item.cells.map((cell, index) => (index === 0 || !/\d/.test(cell) ? cell : ""));
      }
    }
  }

  return { title, intro: holdBackInProgress(intro.join("\n\n")), sections };
}

// ---------------------------------------------------------------- loading

let memo: { stamp: string; notes: Notes } | undefined;

/** The notes as the page shows them, or undefined when the file is not there yet. */
export function loadNotes(): Notes | undefined {
  let source: string;
  let stamp: string;
  try {
    const stat = fs.statSync(NOTES_FILE);
    stamp = `${stat.mtimeMs}:${stat.size}`;
    if (memo?.stamp === stamp) return memo.notes;
    source = fs.readFileSync(NOTES_FILE, "utf8");
  } catch {
    return undefined;
  }
  if (source.trim() === "") return undefined;
  const notes = parseNotes(source);
  memo = { stamp, notes };
  return notes;
}
