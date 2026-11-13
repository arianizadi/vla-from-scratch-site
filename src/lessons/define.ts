/**
 * The short format of a chapter: the lesson a reader sees first at
 * /learn/<slug>. The long chapter (synced from the tutorial) stays at
 * /learn/<slug>/full.
 *
 * One lesson = one folder, src/lessons/<slug>/, with
 *   lesson.ts          export default defineLesson({ ... })
 *   animations/*.tsx   one client component per animated beat
 *   math.ts            optional: export default defineMath([ ... ]), "The math, step by step"
 * The folder is found automatically (src/lessons/index.ts); nothing else needs
 * to change. AUTHORING.md at the repository root is the full guide.
 *
 * Text fields accept three inline marks: **bold**, `code` and
 * [a link](/learn/12-positions). Nothing else is parsed.
 */

import type { ComponentType } from "react";
import type { FigureId } from "@/figures/catalog";

export interface Beat {
  /** The beat's heading: a few words, sentence case, no full stop. */
  title: string;
  /** The explanation: plain language, short sentences, at most 60 words. */
  text: string;
  /**
   * The animation that shows this beat: a client component from ./animations
   * that renders an <AnimationFrame>. Most beats have one.
   */
  animation?: ComponentType;
}

export interface LabLink {
  /** What the reader will find, in a few words: "Success at 1, 2, 4, 10 and 20 flow steps". */
  label: string;
  /** A link into the results page: "/lab#sampler" or a row's anchor. */
  href: `/lab${string}`;
}

export interface Lesson {
  /** The chapter's file name without .md; must equal the folder name. */
  slug: string;
  /**
   * Optional: the lesson's title, if it should differ from the one in src/lib/course.ts.
   * Used everywhere the lesson is named (its page, the course outline, the sidebar, the pager,
   * the page title). Short and concrete, sentence case, no colon or full stop, at most 8 words:
   * "How a robot learns from examples".
   */
  title?: string;
  /** The idea of the chapter in one plain sentence (at most 30 words). */
  idea: string;
  /** 3 to 6 beats, in reading order. */
  beats: Beat[];
  /** 3 to 5 bullets: where the idea breaks, surprises or needs care. */
  edgeCases: string[];
  /** 3 to 5 bullets: practical advice a reader can act on. */
  tips: string[];
  /** One or two lines to remember (at most 40 words). */
  takeaway: string;
  /** Slugs of chapters worth reading next or alongside. */
  related?: string[];
  /** Links to measured results on the lab page. */
  lab?: LabLink[];
  /** Interactive figures (ids from src/figures/catalog.ts) offered as "Try it". */
  tryIt?: FigureId[];
}

/**
 * What `animation` is at run time when a lesson is read through src/lessons/index.ts: authors
 * write a component, and scripts/lesson-data-loader.cjs swaps it for this marker, so that a page
 * loads only the animations it shows (src/lessons/AnimationSlot.tsx draws either).
 */
export interface AnimationMarker {
  __animation: string;
}

export function isAnimationMarker(value: unknown): value is AnimationMarker {
  return typeof value === "object" && value !== null && typeof (value as AnimationMarker).__animation === "string";
}

/** Identity function that gives a lesson file its type. */
export function defineLesson(lesson: Lesson): Lesson {
  return lesson;
}

/**
 * The colour a symbol wears in "The math, step by step": the kit's meaning
 * colours (a word is `language`, an image `vision`, an action `action`),
 * `accent` for the one quantity to follow, `ink` for the rest. Optional:
 * without it, symbols take accent, action, vision, language in turn.
 */
export type MathTone = "accent" | "action" | "vision" | "language" | "success" | "ink";

/**
 * One formula of the optional math section, in src/lessons/<slug>/math.ts
 * (export default defineMath([...]) or export const math = ...). At most 3.
 */
export interface MathEntry {
  /** What the formula does, in a few words: "Score a guess". */
  title: string;
  /** LaTeX for KaTeX, without $ signs: "\\mathcal{L} = \\lVert v_\\theta - (x_1 - x_0) \\rVert^2". */
  formula: string;
  /**
   * Every symbol of the formula with its plain meaning: ["x_0", "where the noise starts"].
   * Each symbol is coloured the same in the formula and in this list. An optional third
   * item picks its colour.
   */
  symbols: (readonly [symbol: string, meaning: string] | readonly [symbol: string, meaning: string, tone: MathTone])[];
  /** One everyday picture of what the formula does, one or two sentences. May use $...$ for a symbol. */
  metaphor: string;
  /**
   * A worked example with small, concrete numbers. One step per line ("\n"); a single
   * paragraph is split into sentences. May use $...$ for inline maths.
   */
  example: string;
  /** Optional: an animation from ./animations that shows the formula at work. */
  animation?: ComponentType;
}

/** Identity function that gives a math.ts file its type. */
export function defineMath(entries: MathEntry[]): MathEntry[] {
  return entries;
}
