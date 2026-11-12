/**
 * Chapter loading. Everything here is synchronous file I/O and pure computation,
 * so pages that use it are prerendered at build time.
 *
 * Chapters are Markdown files in content/chapters, named <order>-<slug>.md, with
 * YAML front matter: title, part ("<number> <name>"), order, summary, status.
 *
 * The files are copied from the tutorial repository while its chapters are
 * still being written, so a file can be half-finished. A chapter that cannot
 * be used (empty, front matter missing or not closed, no title or part, no
 * text yet, or a body the pipeline cannot render) is left out of the site
 * with a warning; it never fails the build.
 */

import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { renderMarkdown } from "./markdown/pipeline";

const CHAPTER_DIR = path.join(process.cwd(), "content", "chapters");
const CHAPTER_FILE = /^(\d+)-([\w-]+)\.md$/;
const WORDS_PER_MINUTE = 220;

export interface PartRef {
  /** Number in front of the part name ("4 Actions and policies" gives 4). */
  number: number;
  name: string;
  /** Anchor id used on index pages. */
  id: string;
}

export interface ChapterMeta {
  /** File name without the extension; also the URL segment. */
  slug: string;
  /** Numeric prefix of the file name. */
  order: number;
  /** The prefix as written ("00", "41"). */
  orderLabel: string;
  title: string;
  part: PartRef;
  summary: string;
  /** "draft", "published", "sample", or whatever the front matter says. */
  status: string;
  words: number;
  readingMinutes: number;
  /** Number of interactive-figure placeholders in the chapter. */
  figureCount: number;
  /** Pipeline fixtures; hidden from indexes once real chapters exist. */
  isSample: boolean;
}

export interface Chapter extends ChapterMeta {
  /** Markdown without the front matter and without the leading h1. */
  body: string;
}

export interface Part extends PartRef {
  chapters: ChapterMeta[];
}

type FrontMatter = Partial<Record<"title" | "part" | "order" | "summary" | "status", string>>;

const FRONT_MATTER = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

/**
 * Front matter is read as YAML. Chapter authors write plain scalars, and a
 * summary with a colon in it is not valid YAML, so a failed parse falls back to
 * reading "key: rest of the line".
 */
function parseFrontMatter(source: string): { data: FrontMatter; body: string; found: boolean } {
  const match = FRONT_MATTER.exec(source);
  if (!match) return { data: {}, body: source, found: false };

  const body = source.slice(match[0].length);
  const data: FrontMatter = {};
  const assign = (key: string, value: unknown) => {
    if (value === null || value === undefined) return;
    if (key === "title" || key === "part" || key === "order" || key === "summary" || key === "status") {
      data[key] = String(value).trim();
    }
  };

  try {
    const parsed: unknown = parseYaml(match[1]);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value !== "object") assign(key, value);
      }
      return { data, body, found: true };
    }
  } catch {
    // fall through to the line reader
  }

  for (const line of match[1].split(/\r?\n/)) {
    const pair = /^([A-Za-z_]+):\s*(.*)$/.exec(line);
    if (pair) assign(pair[1], pair[2].replace(/^(["'])(.*)\1$/, "$2"));
  }
  return { data, body, found: true };
}

function parsePart(raw: string | undefined): PartRef {
  const match = /^(\d+)\s+(.+)$/.exec(raw ?? "");
  if (!match) {
    const name = raw?.trim() || "Other chapters";
    return { number: Number.MAX_SAFE_INTEGER, name, id: "part-other" };
  }
  return { number: Number(match[1]), name: match[2].trim(), id: `part-${match[1]}` };
}

/** Removes the first-level heading that opens the body; the page header prints the title. */
function stripLeadingTitle(body: string): { body: string } {
  const match = /^\s*#[ \t]+(.+?)[ \t]*#*[ \t]*(?:\r?\n|$)/.exec(body);
  return { body: match ? body.slice(match[0].length) : body };
}

function countWords(markdown: string): number {
  const prose = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/[#>*_`|\-\[\]()]/g, " ");
  return prose.split(/\s+/).filter(Boolean).length;
}

/** An interactive-figure placeholder in a chapter body. */
interface FigureMark {
  id: string;
  /** The caption paragraph as plain text; "" when the chapter gives none. */
  caption: string;
}

const INTERACTIVE = /^<!--\s*interactive:\s*([\w-]+)\s*-->$/;
const FENCE = /^\s*(```+|~~~+)/;
const CAPTION = /^\*\s*Figure:\s*([\s\S]*?)\*$/i;

function plainText(markdown: string): string {
  const text = markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * The figure placeholders of a chapter body, in document order: a comment on
 * its own line, optionally followed by one italic "Figure: ..." paragraph.
 * Placeholders shown inside a fenced code block are examples, not figures.
 */
function findFigures(body: string): FigureMark[] {
  const lines = body.split(/\r?\n/);
  const figures: FigureMark[] = [];
  let fence: string | undefined;

  for (let index = 0; index < lines.length; index += 1) {
    const opened = FENCE.exec(lines[index]);
    if (opened) {
      const marker = opened[1];
      if (!fence) fence = marker;
      else if (marker[0] === fence[0] && marker.length >= fence.length) fence = undefined;
      continue;
    }
    if (fence) continue;

    const match = INTERACTIVE.exec(lines[index].trim());
    if (!match) continue;

    const paragraph: string[] = [];
    for (let next = index + 1; next < lines.length && lines[next].trim() !== ""; next += 1) {
      paragraph.push(lines[next].trim());
    }
    const caption = CAPTION.exec(paragraph.join(" "));
    figures.push({ id: match[1], caption: caption ? plainText(caption[1]) : "" });
  }
  return figures;
}

type Parsed = { chapter: Chapter } | { problem: string };

function describe(error: unknown): string {
  return error instanceof Error ? error.message.split("\n")[0] : String(error);
}

/** Turns a chapter file into a Chapter, or says why it cannot be used yet. */
function parseChapter(file: string, order: string, source: string): Parsed {
  if (source.trim() === "") return { problem: "the file is empty" };

  const { data, body: rawBody, found } = parseFrontMatter(source);
  if (!found) {
    return { problem: /^\s*---/.test(source) ? "its front matter is not closed" : "it has no front matter" };
  }
  if (!data.title) return { problem: "its front matter has no title" };
  if (!data.part) return { problem: "its front matter has no part" };

  const { body } = stripLeadingTitle(rawBody);
  if (body.trim() === "") return { problem: "it has no text after the title yet" };

  try {
    renderMarkdown(body, { chapterNumber: String(Number(order)), chapterTitle: () => undefined });
  } catch (error) {
    return { problem: `the Markdown pipeline could not render it (${describe(error)})` };
  }

  const slug = file.replace(/\.md$/, "");
  const words = countWords(body);
  const status = (data.status ?? "draft").toLowerCase();

  return {
    chapter: {
      slug,
      order: Number(order),
      orderLabel: order,
      title: data.title,
      part: parsePart(data.part),
      summary: data.summary ?? "",
      status,
      words,
      readingMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
      figureCount: findFigures(body).length,
      isSample: status === "sample" || /^\d+-sample-/.test(file),
      body,
    },
  };
}

/** Parsed files by name, valid for as long as the file's size and modification time stay the same. */
const parsed = new Map<string, { stamp: string; chapter?: Chapter }>();
const warned = new Set<string>();

function skip(file: string, problem: string): undefined {
  const message = `[content] Skipping ${file}: ${problem}.`;
  if (!warned.has(message)) {
    warned.add(message);
    console.warn(message);
  }
  return undefined;
}

function readChapter(file: string): Chapter | undefined {
  const name = CHAPTER_FILE.exec(file);
  if (!name) return undefined;

  let stamp: string;
  let source: string;
  try {
    const full = path.join(CHAPTER_DIR, file);
    const stat = fs.statSync(full);
    stamp = `${stat.mtimeMs}:${stat.size}`;
    const known = parsed.get(file);
    if (known?.stamp === stamp) return known.chapter;
    source = fs.readFileSync(full, "utf8");
  } catch (error) {
    return skip(file, `it could not be read (${describe(error)})`);
  }

  const result = parseChapter(file, name[1], source);
  const chapter = "chapter" in result ? result.chapter : skip(file, result.problem);
  parsed.set(file, { stamp, chapter });
  return chapter;
}

let memo: Chapter[] | undefined;

function loadAll(): Chapter[] {
  if (memo && process.env.NODE_ENV === "production") return memo;
  let files: string[] = [];
  try {
    files = fs.readdirSync(CHAPTER_DIR);
  } catch {
    // No content folder yet: the site has no chapters.
  }
  const chapters = files
    .map(readChapter)
    .filter((chapter): chapter is Chapter => chapter !== undefined)
    .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
  memo = chapters;
  return chapters;
}

function toMeta(chapter: Chapter): ChapterMeta {
  const { body: _body, ...meta } = chapter;
  void _body;
  return meta;
}

/** Every chapter file, samples included. Used to generate the routes. */
export function getAllChapters(): ChapterMeta[] {
  return loadAll().map(toMeta);
}

/**
 * The chapters shown in indexes and navigation, in reading order. The pipeline
 * samples are listed only while no real chapter exists.
 */
export function listChapters(): ChapterMeta[] {
  const all = getAllChapters();
  const real = all.filter((chapter) => !chapter.isSample);
  return real.length > 0 ? real : all;
}

/** The listed chapters grouped by part, parts in numeric order. */
export function listParts(): Part[] {
  const parts = new Map<string, Part>();
  for (const chapter of listChapters()) {
    const existing = parts.get(chapter.part.id);
    if (existing) existing.chapters.push(chapter);
    else parts.set(chapter.part.id, { ...chapter.part, chapters: [chapter] });
  }
  return [...parts.values()].sort((a, b) => a.number - b.number);
}

/** One chapter with its Markdown body, or undefined when there is no such file. */
export function getChapter(slug: string): Chapter | undefined {
  return loadAll().find((chapter) => chapter.slug === slug);
}

/** Previous and next chapter in reading order, within the same listing as the chapter. */
export function getNeighbours(slug: string): { previous?: ChapterMeta; next?: ChapterMeta } {
  const all = getAllChapters();
  const current = all.find((chapter) => chapter.slug === slug);
  if (!current) return {};
  const siblings = all.filter((chapter) => chapter.isSample === current.isSample);
  const index = siblings.findIndex((chapter) => chapter.slug === slug);
  return { previous: siblings[index - 1], next: siblings[index + 1] };
}

/** The parts a chapter page shows in its sidebar. */
export function getSidebarParts(slug: string): Part[] {
  const current = getChapter(slug);
  if (!current?.isSample) return listParts();
  const samples = getAllChapters().filter((chapter) => chapter.isSample);
  return [{ ...current.part, chapters: samples }];
}

/** One place where a chapter embeds an interactive figure. */
export interface FigureUse {
  /** The id as the chapter writes it. */
  id: string;
  /** Figure number within the chapter ("41.2"). */
  number: string;
  /** The chapter's description of the figure as plain text; "" when it gives none. */
  caption: string;
  /** Address of the figure on its chapter page. */
  href: string;
  chapter: ChapterMeta;
}

/** Every interactive figure embedded in the listed chapters, in reading order. */
export function listFigureUses(): FigureUse[] {
  const listed = new Set(listChapters().map((chapter) => chapter.slug));
  return loadAll()
    .filter((chapter) => listed.has(chapter.slug))
    .flatMap((chapter) =>
      findFigures(chapter.body).map((figure, index) => {
        const number = `${chapter.order}.${index + 1}`;
        return {
          id: figure.id,
          number,
          caption: figure.caption,
          href: `/learn/${chapter.slug}#fig-${number.replace(".", "-")}`,
          chapter: toMeta(chapter),
        };
      }),
    );
}
