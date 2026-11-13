/**
 * Checks a lesson against the short format. Errors fail the build with a
 * message that says what to fix; warnings are printed and let it pass.
 * The rules are the ones in AUTHORING.md.
 */

import { isFigureId } from "@/figures/catalog";
import type { Lesson } from "./define";

export const LIMITS = {
  beats: [3, 6],
  beatWords: 60,
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

/** Things the site never says about itself, and words that make text longer without saying more. */
const NEVER = [/attention span/i, /\bshort(?:ened| version)\b/i, /\btl;?dr\b/i, /\bsummar(?:y|ised|ized) version\b/i];
const FILLER = [/\bsimply\b/i, /\bjust\b/i, /\bobviously\b/i, /\bbasically\b/i, /\bin this (?:lesson|chapter|section),? we\b/i, /\blet'?s\b/i];
/** The site is public and generic. */
const PRIVATE = [/\/Users\//, /\/home\//, /[A-Z]:\\/, /\b(?:RTX|L40S|A100|H100)\b/, /@[a-z0-9-]+\.[a-z]/i];

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
    if (words > LIMITS.beatWordsHard) error(`${label} has ${words} words; the limit is ${LIMITS.beatWords}.`);
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
