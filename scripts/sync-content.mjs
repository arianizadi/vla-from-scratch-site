#!/usr/bin/env node
// Copies the tutorial's text into this repository, so the site builds without
// the tutorial repository next to it.
//
//   npm run sync                              from ../vla-from-scratch
//   TUTORIAL_REPO=/path/to/repo npm run sync  from another checkout
//   npm run sync -- /path/to/repo             the same, as an argument
//
//   tutorial/chapters/*.md    ->  content/chapters/
//   tutorial/lab-notebook.md  ->  content/lab-notebook.md
//   tutorial/img/**           ->  public/tutorial/img/
//
// The copy is one-way. A chapter file that is gone from the tutorial is
// removed here. The pipeline samples (98-*.md, 99-*.md) live only in this
// repository; they stay while the tutorial has no chapters and are removed
// once it has at least one.
//
// The chapters are still being written, so a file may be half-finished. This
// script copies it as it is and says so; the site leaves such a chapter out
// with a warning when it builds (src/lib/content.ts).
//
// Last, the numbers the landing page shows (src/data/findings.json) are
// checked against the notebook that was just copied: every quoted passage
// must still be in it, word for word.

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const here = (file) => path.relative(root, file) || ".";

// ---------------------------------------------------------------- source

const given = process.argv[2] ?? process.env.TUTORIAL_REPO ?? "../vla-from-scratch";
const repo = path.resolve(root, given);
// The tutorial folder itself is accepted as well as the repository that holds it.
const tutorial = existsSync(path.join(repo, "tutorial", "chapters")) ? path.join(repo, "tutorial") : repo;

const source = {
  chapters: path.join(tutorial, "chapters"),
  notebook: path.join(tutorial, "lab-notebook.md"),
  images: path.join(tutorial, "img"),
};
const target = {
  chapters: path.join(root, "content", "chapters"),
  notebook: path.join(root, "content", "lab-notebook.md"),
  images: path.join(root, "public", "tutorial", "img"),
};

if (!existsSync(source.chapters)) {
  console.error(`No tutorial chapters at ${source.chapters}.`);
  console.error("Set TUTORIAL_REPO to a checkout of the tutorial repository, or pass its path as an argument.");
  process.exit(1);
}

// ---------------------------------------------------------------- helpers

const isMarkdown = (name) => name.endsWith(".md") && !name.startsWith(".");
const isChapterName = (name) => /^\d+-[\w-]+\.md$/.test(name);
const isSample = (name) => /^9[89]-/.test(name);

/**
 * Copies a file when its content differs. Returns "added", "updated" or "unchanged".
 * `transform` may rewrite the content on the way (see withoutRemoteFonts).
 */
function copyFile(from, to, transform = (data) => data) {
  const data = transform(readFileSync(from));
  if (existsSync(to)) {
    if (readFileSync(to).equals(data)) return "unchanged";
    writeFileSync(to, data);
    return "updated";
  }
  mkdirSync(path.dirname(to), { recursive: true });
  writeFileSync(to, data);
  return "added";
}

/** Every file under a folder, as paths relative to it. Dot files are skipped. */
function walk(folder, prefix = "") {
  return readdirSync(path.join(folder, prefix), { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith(".")) return [];
    const relative = path.join(prefix, entry.name);
    return entry.isDirectory() ? walk(folder, relative) : [relative];
  });
}

/**
 * The site loads nothing from other hosts. An SVG exported from a terminal
 * names a web font by URL next to a local() source; the URL sources are
 * dropped, so the drawing falls back to the local font or to monospace.
 */
function withoutRemoteFonts(data) {
  const text = data.toString("utf8");
  const cleaned = text
    .replace(/,\s*url\(\s*(["']?)https?:\/\/[^)]*\1\s*\)(\s*format\([^)]*\))?/g, "")
    .replace(/url\(\s*(["']?)https?:\/\/[^)]*\1\s*\)(\s*format\([^)]*\))?\s*,\s*/g, "");
  return cleaned === text ? data : Buffer.from(cleaned, "utf8");
}

/** True when an SVG would still ask another host for a font, an image or a style sheet. */
const loadsFromAnotherHost = (text) =>
  /url\(\s*["']?https?:\/\//.test(text) || /\s(?:xlink:)?href\s*=\s*["']https?:\/\/[^"']+\.(?:png|jpe?g|gif|webp|svg|css|woff2?|ttf|otf)\b/i.test(text);

function tally(results) {
  const count = { added: 0, updated: 0, unchanged: 0 };
  for (const result of results) count[result] += 1;
  return count;
}

const summary = ({ added, updated, unchanged }) =>
  [added && `${added} new`, updated && `${updated} updated`, unchanged && `${unchanged} unchanged`]
    .filter(Boolean)
    .join(", ") || "none";

/** Why the site will not show a chapter file yet, or undefined when it looks complete. */
function chapterProblem(text) {
  if (text.trim() === "") return "the file is empty";
  const frontMatter = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(text);
  if (!frontMatter) return text.trimStart().startsWith("---") ? "front matter is not closed" : "no front matter";
  if (!/^title:\s*\S/m.test(frontMatter[1])) return "front matter has no title";
  if (!/^part:\s*\S/m.test(frontMatter[1])) return "front matter has no part";
  const body = text.slice(frontMatter[0].length).replace(/^\s*#[^\n]*\n?/, "");
  if (body.trim() === "") return "no text after the title yet";
  return undefined;
}

// ---------------------------------------------------------------- chapters

mkdirSync(target.chapters, { recursive: true });

const sourceChapters = readdirSync(source.chapters).filter(isMarkdown).sort();
const realChapters = sourceChapters.filter((name) => isChapterName(name) && !isSample(name));
const chapterCopies = tally(
  sourceChapters.map((name) => copyFile(path.join(source.chapters, name), path.join(target.chapters, name))),
);

const removed = [];
const keptSamples = [];
for (const name of readdirSync(target.chapters).filter(isMarkdown)) {
  if (sourceChapters.includes(name)) continue;
  if (isSample(name) && realChapters.length === 0) {
    keptSamples.push(name);
    continue;
  }
  rmSync(path.join(target.chapters, name));
  removed.push(name);
}

console.log(`Chapters   ${sourceChapters.length} files from ${source.chapters}: ${summary(chapterCopies)}.`);
if (removed.length > 0) console.log(`           Removed ${removed.length} no longer in the tutorial: ${removed.join(", ")}.`);
if (keptSamples.length > 0) console.log(`           Kept the pipeline samples (the tutorial has no chapters yet): ${keptSamples.join(", ")}.`);

const unnamed = sourceChapters.filter((name) => !isChapterName(name));
if (unnamed.length > 0) {
  console.log(`           Not named <order>-<slug>.md, so copied but not shown as chapters: ${unnamed.join(", ")}.`);
}
for (const name of sourceChapters.filter(isChapterName)) {
  const problem = chapterProblem(readFileSync(path.join(target.chapters, name), "utf8"));
  if (problem) console.warn(`           Warning: ${name} is not finished (${problem}); the site will leave it out.`);
}

// ---------------------------------------------------------------- lab notebook

let notebook;
if (existsSync(source.notebook)) {
  const result = copyFile(source.notebook, target.notebook);
  notebook = readFileSync(target.notebook, "utf8");
  console.log(`Notebook   ${here(target.notebook)}: ${result}.`);
} else {
  console.warn(`Notebook   Warning: no lab notebook at ${source.notebook}; ${here(target.notebook)} was left as it is.`);
  if (existsSync(target.notebook)) notebook = readFileSync(target.notebook, "utf8");
}

// ---------------------------------------------------------------- images

if (existsSync(source.images) && statSync(source.images).isDirectory()) {
  const files = walk(source.images);
  const isSvg = (file) => file.toLowerCase().endsWith(".svg");
  const copies = tally(
    files.map((file) =>
      copyFile(path.join(source.images, file), path.join(target.images, file), isSvg(file) ? withoutRemoteFonts : undefined),
    ),
  );
  console.log(`Images     ${files.length} files to ${here(target.images)}: ${summary(copies)}.`);
  for (const file of files.filter(isSvg)) {
    if (loadsFromAnotherHost(readFileSync(path.join(target.images, file), "utf8"))) {
      console.warn(`           Warning: ${file} still loads a resource from another host; the site must not.`);
    }
  }
} else {
  console.log("Images     The tutorial has no img folder; nothing copied.");
}

// ---------------------------------------------------------------- quoted numbers

/** Every string under a "quotes" key, anywhere in a JSON value. */
function collectQuotes(value, found = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectQuotes(item, found);
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (key === "quotes" && Array.isArray(item)) found.push(...item.filter((quote) => typeof quote === "string"));
      else collectQuotes(item, found);
    }
  }
  return found;
}

const findingsFile = path.join(root, "src", "data", "findings.json");
if (notebook !== undefined && existsSync(findingsFile)) {
  const flat = (text) => text.replace(/\s+/g, " ");
  const haystack = flat(notebook);
  const quotes = [...new Set(collectQuotes(JSON.parse(readFileSync(findingsFile, "utf8"))))];
  const missing = quotes.filter((quote) => !haystack.includes(flat(quote)));
  if (missing.length === 0) {
    console.log(`Numbers    All ${quotes.length} passages quoted in ${here(findingsFile)} are in the notebook.`);
  } else {
    console.warn(`Numbers    Warning: ${missing.length} of ${quotes.length} passages quoted in ${here(findingsFile)} are no longer in the notebook.`);
    console.warn("           The notebook changed. Update these entries from it before publishing:");
    for (const quote of missing) console.warn(`             "${quote}"`);
    process.exitCode = 2;
  }
}
