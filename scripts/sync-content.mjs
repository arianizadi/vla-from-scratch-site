#!/usr/bin/env node
// Copies the tutorial's text into this repository, so the site builds without
// the tutorial repository next to it.
//
//   npm run sync                              from ../vla-from-scratch
//   TUTORIAL_REPO=/path/to/repo npm run sync  from another checkout
//   npm run sync -- /path/to/repo             the same, as an argument
//
// "npm run sync" (scripts/sync.mjs) runs this script and then sync-data.mjs, which builds the
// experiment data and checks it against the notebook copied here. "npm run sync:content" runs
// this script alone.
//
//   tutorial/chapters/*.md    ->  content/chapters/
//   tutorial/lab-notebook.md  ->  content/lab-notebook.md
//   tutorial/notes.md         ->  content/notes.md
//   tutorial/img/**           ->  public/tutorial/img/  (only the images a page links to)
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

// A file without a number is shown only as an appendix page (part: Appendix in its front matter),
// numbered after the other chapters (src/lib/content.ts).
const isAppendixName = (name) => /^[a-z][a-z0-9-]*\.md$/.test(name);
const isAppendix = (name) => /^part:\s*(?:\d+\s+)?appendix\b/im.test(readFileSync(path.join(target.chapters, name), "utf8"));
const unnamed = sourceChapters.filter((name) => !isChapterName(name));
const appendix = unnamed.filter((name) => isAppendixName(name) && isAppendix(name));
const ignored = unnamed.filter((name) => !appendix.includes(name));
if (appendix.length > 0) {
  console.log(`           Appendix pages without a number, shown after the numbered chapters: ${appendix.join(", ")}.`);
}
if (ignored.length > 0) {
  console.warn(`           Warning: not named <order>-<slug>.md and not an appendix page, so not shown: ${ignored.join(", ")}.`);
}
for (const name of [...sourceChapters.filter(isChapterName), ...appendix]) {
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

// ---------------------------------------------------------------- field notes

// The field notes are shown at /notes (src/app/notes). Their numbers are the notebook's: a number
// in the notes that the notebook does not print is listed here for a person to check, not removed.
const notesSource = path.join(tutorial, "notes.md");
const notesTarget = path.join(root, "content", "notes.md");
if (existsSync(notesSource)) {
  console.log(`Notes      ${here(notesTarget)}: ${copyFile(notesSource, notesTarget)}.`);
  const numbers = readFileSync(notesTarget, "utf8").match(/\d+(?:\.\d+)?(?:%|\/\d+| mm\b|M\b)?/g) ?? [];
  const unprinted = notebook === undefined ? [] : [...new Set(numbers)].filter((number) => !notebook.includes(number));
  if (unprinted.length > 0) {
    console.warn(`           ${unprinted.length} numbers in the notes are not in the notebook as written: ${unprinted.join(", ")}.`);
  }
} else {
  console.warn(`Notes      Warning: no field notes at ${notesSource}; ${here(notesTarget)} was left as it is.`);
}

// ---------------------------------------------------------------- images

// Only the images a page links to are published: a file in the tutorial's img folder that no
// chapter, the notebook or the notes link to (a screenshot of a tool, a drawing kept for later)
// is not copied, and a copy no page links to any more is removed.

/** The tutorial-relative paths ("img/x.svg") of the images a Markdown file links to. */
function linkedImages(file, folder) {
  if (!existsSync(file)) return [];
  const text = readFileSync(file, "utf8");
  const targets = [
    ...text.matchAll(/\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g),
    ...text.matchAll(/<img[^>]*\ssrc\s*=\s*["']([^"']+)["']/gi),
  ].map((match) => match[1].split(/[?#]/)[0]);
  return targets
    .filter((url) => !/^([a-z][a-z0-9+.-]*:|\/\/|\/|#)/i.test(url))
    .map((url) => {
      try {
        return decodeURI(url);
      } catch {
        return url;
      }
    })
    .map((url) => path.posix.normalize(path.posix.join(folder, url)))
    .filter((relative) => relative.startsWith("img/"));
}

if (existsSync(source.images) && statSync(source.images).isDirectory()) {
  const linked = new Set([
    ...readdirSync(target.chapters)
      .filter(isMarkdown)
      .flatMap((name) => linkedImages(path.join(target.chapters, name), "chapters")),
    ...linkedImages(target.notebook, "."),
    ...linkedImages(path.join(root, "content", "notes.md"), "."),
  ]);
  const available = walk(source.images);
  const files = available.filter((file) => linked.has(path.posix.join("img", file.split(path.sep).join("/"))));
  const isSvg = (file) => file.toLowerCase().endsWith(".svg");
  const copies = tally(
    files.map((file) =>
      copyFile(path.join(source.images, file), path.join(target.images, file), isSvg(file) ? withoutRemoteFonts : undefined),
    ),
  );
  console.log(
    `Images     ${files.length} of ${available.length} files are linked from a page, copied to ${here(target.images)}: ${summary(copies)}.`,
  );
  for (const file of files.filter(isSvg)) {
    if (loadsFromAnotherHost(readFileSync(path.join(target.images, file), "utf8"))) {
      console.warn(`           Warning: ${file} still loads a resource from another host; the site must not.`);
    }
  }
  for (const missing of [...linked].filter((relative) => !available.includes(relative.slice("img/".length)))) {
    console.warn(`           Warning: a page links to ${missing}, which the tutorial does not have.`);
  }
} else {
  console.log("Images     The tutorial has no img folder; nothing copied.");
}

// A published image no page links to is removed, whether or not the tutorial still has it.
if (existsSync(target.images)) {
  const kept = new Set([
    ...readdirSync(target.chapters)
      .filter(isMarkdown)
      .flatMap((name) => linkedImages(path.join(target.chapters, name), "chapters")),
    ...linkedImages(target.notebook, "."),
    ...linkedImages(path.join(root, "content", "notes.md"), "."),
  ]);
  const stale = walk(target.images).filter((file) => !kept.has(path.posix.join("img", file.split(path.sep).join("/"))));
  for (const file of stale) rmSync(path.join(target.images, file));
  if (stale.length > 0) console.log(`           Removed ${stale.length} that no page links to: ${stale.join(", ")}.`);
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
