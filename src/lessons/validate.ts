/**
 * Checks a lesson against the short format. Errors fail the build with a
 * message that says what to fix; warnings are printed and let it pass.
 * The rules are the ones in AUTHORING.md.
 */

import { isFigureId } from "@/figures/catalog";
import { splitMath, texError } from "@/lib/math";
import { isAnimationMarker, type Lesson } from "./define";

export const LIMITS = {
  beats: [3, 6],
  /** A beat should be at most about 50 words beside its animation (AUTHORING.md, section 3). */
  beatWords: 50,
  beatWordsHard: 70,
  ideaWords: 30,
  bullets: [3, 5],
  bulletWords: 35,
  takeawayWords: 40,
  titleWords: 8,
} as const;

/** Words as a reader counts them: inline marks and link targets do not count. */
export function countWords(text: string): number {
  return text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*]/g, "")
    .split(/\s+/)
    .filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

/** Minutes a lesson takes: its words, plus a few seconds to watch each animation. */
export function lessonMinutes(lesson: Lesson): number {
  const words =
    countWords(lesson.idea) +
    lesson.beats.reduce((total, beat) => total + countWords(beat.text), 0) +
    [...lesson.edgeCases, ...lesson.tips].reduce((total, item) => total + countWords(item), 0) +
    countWords(lesson.takeaway);
  const seconds = (words / 200) * 60 + lesson.beats.filter((beat) => beat.animation).length * 15;
  return Math.max(1, Math.round(seconds / 60));
}

/** Things the site never says about itself, and words that make text longer without saying more. */
const NEVER = [/attention span/i, /\bshort(?:ened| version)\b/i, /\btl;?dr\b/i, /\bsummar(?:y|ised|ized) version\b/i];
const FILLER = [/\bsimply\b/i, /\bjust\b/i, /\bobviously\b/i, /\bbasically\b/i, /\bin this (?:lesson|chapter|section),? we\b/i, /\blet'?s\b/i];
/** The site is public and generic. */
const PRIVATE = [/\/Users\//, /\/home\//, /[A-Z]:\\/, /\b(?:RTX|L40S|A100|H100)\b/, /@[a-z0-9-]+\.[a-z]/i];

/** What never goes in a lesson (AUTHORING.md, section 3): it belongs in the technical details. */
const TECHNICAL = [
  { pattern: /\b[\w-]+\.(?:py|ya?ml|sh|json|jsonl|pt|md|tsx?)\b/, what: "a file name" },
  { pattern: /(?:^|\s)--[a-z][\w-]*/, what: "a command-line flag" },
  { pattern: /\b[A-Z][A-Z0-9]*_[A-Z0-9_]+\b/, what: "an environment variable" },
  { pattern: /\b(?:pip|uv|npm|python|bash|git) [a-z]/, what: "a command" },
];

const LINK = /\[([^\]]*)\]\(([^)]*)\)/g;

export interface Report {
  errors: string[];
  warnings: string[];
}

export function validateLesson(lesson: Lesson, folder: string, knownSlugs: ReadonlySet<string>): Report {
  const errors: string[] = [];
  const warnings: string[] = [];
  const where = `src/lessons/${folder}/lesson.ts`;
  const error = (message: string) => errors.push(`${where}: ${message}`);
  const warn = (message: string) => warnings.push(`${where}: ${message}`);

  if (lesson.slug !== folder) error(`slug is "${lesson.slug}" but the folder is "${folder}"; they must match.`);
  if (!knownSlugs.has(lesson.slug)) error(`there is no chapter content/chapters/${lesson.slug}.md for this lesson.`);

  const texts: { field: string; text: string }[] = [];

  if (lesson.title !== undefined) {
    const title = lesson.title;
    if (typeof title !== "string" || title.trim() === "") error("title, when set, must be a non-empty string.");
    else {
      if (countWords(title) > LIMITS.titleWords) error(`title has ${countWords(title)} words; keep it to ${LIMITS.titleWords} or fewer.`);
      if (/[.:;!]$/.test(title.trim()) || title.includes(":")) error("title: no colon and no full stop; a short phrase in sentence case.");
      if (title.trim() !== title) error("title has spaces at the start or the end.");
      if (/[*`[\]]/.test(title)) error("title: no inline marks (bold, code or links).");
      if (/^[a-z]/.test(title)) warn("title should start with a capital letter (sentence case).");
      if (title.split(/\s+/).slice(1).filter((word) => /^[A-Z][a-z]+$/.test(word)).length > 1) {
        warn("title looks like Title Case; use sentence case (only the first word capitalised).");
      }
      texts.push({ field: "title", text: title });
    }
  }

  const ideaWords = countWords(lesson.idea);
  if (ideaWords === 0) error("idea is empty.");
  if (ideaWords > LIMITS.ideaWords) error(`idea has ${ideaWords} words; keep it to one sentence of at most ${LIMITS.ideaWords}.`);
  if ((lesson.idea.match(/[.!?](\s|$)/g) ?? []).length > 1) warn("idea reads as more than one sentence.");
  texts.push({ field: "idea", text: lesson.idea });

  const [minBeats, maxBeats] = LIMITS.beats;
  if (lesson.beats.length < minBeats || lesson.beats.length > maxBeats) {
    error(`has ${lesson.beats.length} beats; write ${minBeats} to ${maxBeats}.`);
  }
  lesson.beats.forEach((beat, index) => {
    const label = `beat ${index + 1} ("${beat.title}")`;
    const words = countWords(beat.text);
    if (countWords(beat.title) > LIMITS.titleWords) warn(`${label}: the title is long; a few words read faster.`);
    if (/[.:]$/.test(beat.title.trim())) warn(`${label}: drop the full stop or colon at the end of the title.`);
    if (words > LIMITS.beatWordsHard) error(`${label} has ${words} words; the hard limit is ${LIMITS.beatWordsHard}, aim for ${LIMITS.beatWords}.`);
    else if (words > LIMITS.beatWords) warn(`${label} has ${words} words; aim for ${LIMITS.beatWords} or fewer.`);
    texts.push({ field: label, text: `${beat.title} ${beat.text}` });
  });
  const animated = lesson.beats.filter((beat) => beat.animation).length;
  if (animated * 2 < lesson.beats.length) error(`only ${animated} of ${lesson.beats.length} beats have an animation; most should.`);

  for (const [field, list] of [
    ["edgeCases", lesson.edgeCases],
    ["tips", lesson.tips],
  ] as const) {
    const [min, max] = LIMITS.bullets;
    if (list.length < min || list.length > max) error(`${field} has ${list.length} bullets; write ${min} to ${max}.`);
    list.forEach((bullet, index) => {
      const words = countWords(bullet);
      if (words > LIMITS.bulletWords) error(`${field}[${index}] has ${words} words; keep a bullet under ${LIMITS.bulletWords}.`);
      texts.push({ field: `${field}[${index}]`, text: bullet });
    });
  }

  const takeawayWords = countWords(lesson.takeaway);
  if (takeawayWords === 0) error("takeaway is empty.");
  if (takeawayWords > LIMITS.takeawayWords) error(`takeaway has ${takeawayWords} words; keep it under ${LIMITS.takeawayWords}.`);
  texts.push({ field: "takeaway", text: lesson.takeaway });

  for (const slug of lesson.related ?? []) {
    if (!knownSlugs.has(slug)) error(`related lists "${slug}", which is not a chapter.`);
    if (slug === lesson.slug) error("related lists the lesson itself.");
  }
  for (const link of lesson.lab ?? []) {
    if (!link.href.startsWith("/lab")) error(`lab link "${link.label}" must point into /lab.`);
  }
  for (const id of lesson.tryIt ?? []) {
    if (!isFigureId(id)) error(`tryIt lists "${id}", which is not a figure id in src/figures/catalog.ts.`);
  }

  for (const { field, text } of texts) {
    for (const pattern of NEVER) if (pattern.test(text)) error(`${field}: never describe the text itself (matched ${pattern}).`);
    for (const pattern of PRIVATE) if (pattern.test(text)) error(`${field}: private or hardware detail (matched ${pattern}); say "machine A" or "machine B".`);
    for (const pattern of FILLER) if (pattern.test(text)) warn(`${field}: filler word (matched ${pattern}).`);
    for (const { pattern, what } of TECHNICAL) {
      if (pattern.test(text)) warn(`${field}: looks like ${what}; keep it for the technical details.`);
    }
    for (const match of text.matchAll(LINK)) {
      const href = match[2];
      const chapter = /^\/learn\/([\w-]+)(?:\/full)?(?:#.*)?$/.exec(href);
      if (href.startsWith("/learn/") && (!chapter || !knownSlugs.has(chapter[1]))) error(`${field}: link "${href}" is not a chapter.`);
      if (!href.startsWith("/") && !href.startsWith("https://")) error(`${field}: link "${href}" must start with / or https://.`);
    }
    if ((text.match(/\*\*/g) ?? []).length % 2 === 1) error(`${field}: unclosed **bold**.`);
    if ((text.match(/`/g) ?? []).length % 2 === 1) error(`${field}: unclosed \`code\`.`);
  }

  return { errors, warnings };
}

export const MATH_LIMITS = {
  entries: 3,
  metaphorWords: 45,
  exampleWords: 110,
  meaningWords: 14,
} as const;

const MATH_TONES = new Set(["accent", "action", "vision", "language", "success", "ink"]);

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

/**
 * Checks src/lessons/<slug>/math.ts: shape, non-empty text, at most three
 * entries, every formula, symbol and inline $...$ renders with KaTeX.
 */
export function validateMath(entries: unknown, where: string): Report {
  const errors: string[] = [];
  const warnings: string[] = [];
  const error = (message: string) => errors.push(`${where}: ${message}`);
  const warn = (message: string) => warnings.push(`${where}: ${message}`);

  if (!Array.isArray(entries)) {
    error("export an array of entries: export default defineMath([ ... ]).");
    return { errors, warnings };
  }
  if (entries.length === 0) error("has no entries; delete the file or add one.");
  if (entries.length > MATH_LIMITS.entries) error(`has ${entries.length} entries; keep at most ${MATH_LIMITS.entries}, only the maths that teaches the idea.`);

  const inline = (label: string, text: string) => {
    if ((text.match(/\$/g) ?? []).length % 2 === 1) error(`${label}: unclosed $...$.`);
    for (const part of splitMath(text)) {
      if (!part.math) continue;
      const problem = texError(part.text);
      if (problem) error(`${label}: $${part.text}$ does not render (${problem}).`);
    }
  };

  entries.forEach((raw: unknown, index) => {
    const label = `entry ${index + 1}`;
    if (!raw || typeof raw !== "object") {
      error(`${label} is not an object.`);
      return;
    }
    const entry = raw as Record<string, unknown>;
    if (!nonEmptyString(entry.title)) error(`${label}: title must be a non-empty string.`);
    else if (countWords(entry.title) > LIMITS.titleWords) warn(`${label}: the title is long; a few words read faster.`);

    if (!nonEmptyString(entry.formula)) error(`${label}: formula must be a non-empty LaTeX string.`);
    else {
      const problem = texError(entry.formula);
      if (problem) error(`${label}: the formula does not render (${problem}).`);
    }

    if (!Array.isArray(entry.symbols) || entry.symbols.length === 0) {
      error(`${label}: symbols must list every symbol of the formula with its meaning.`);
    } else {
      entry.symbols.forEach((pair: unknown, at) => {
        const where = `${label}, symbols[${at}]`;
        if (!Array.isArray(pair) || pair.length < 2 || pair.length > 3) {
          error(`${where}: write ["symbol", "plain meaning"] (and optionally a tone).`);
          return;
        }
        const [symbol, meaning, tone] = pair as unknown[];
        if (!nonEmptyString(symbol)) error(`${where}: the symbol must be a non-empty LaTeX string.`);
        else {
          const problem = texError(symbol);
          if (problem) error(`${where}: "${symbol}" does not render (${problem}).`);
          if (nonEmptyString(entry.formula) && !entry.formula.replace(/\s+/g, "").includes(symbol.replace(/\s+/g, ""))) {
            warn(`${where}: "${symbol}" does not appear in the formula as written.`);
          }
        }
        if (!nonEmptyString(meaning)) error(`${where}: the meaning must be a non-empty string.`);
        else if (countWords(meaning) > MATH_LIMITS.meaningWords) warn(`${where}: the meaning is long; a few plain words.`);
        if (tone !== undefined && (typeof tone !== "string" || !MATH_TONES.has(tone))) {
          error(`${where}: tone "${String(tone)}" is not one of ${[...MATH_TONES].join(", ")}.`);
        }
      });
    }

    if (!nonEmptyString(entry.metaphor)) error(`${label}: metaphor must be a non-empty string.`);
    else {
      if (countWords(entry.metaphor) > MATH_LIMITS.metaphorWords) warn(`${label}: the metaphor is long; one picture, one or two sentences.`);
      inline(`${label}, metaphor`, entry.metaphor);
    }

    if (!nonEmptyString(entry.example)) error(`${label}: example must be a non-empty string.`);
    else {
      if (countWords(entry.example) > MATH_LIMITS.exampleWords) warn(`${label}: the worked example is long; use smaller numbers or fewer steps.`);
      inline(`${label}, example`, entry.example);
      for (const pattern of PRIVATE) if (pattern.test(entry.example)) error(`${label}, example: private or hardware detail (matched ${pattern}).`);
    }

    // A component, or the marker that src/lessons/index.ts reads in its place (scripts/lesson-data-loader.cjs).
    if (entry.animation !== undefined && typeof entry.animation !== "function" && !isAnimationMarker(entry.animation)) {
      error(`${label}: animation must be a component from ./animations.`);
    }
  });

  return { errors, warnings };
}
