/**
 * Finds every lesson: each folder src/lessons/<slug>/ with a lesson.ts, and
 * its optional math.ts. No list to edit; adding the file is enough. Server
 * only (build time).
 *
 * `import.meta.glob` is Turbopack's (node_modules/next/dist/docs, the
 * Turbopack reference): the values are thunks, so a page loads only its own
 * lesson and that lesson's animations.
 */

import { getAllChapters } from "@/lib/content";
import type { Lesson, MathEntry } from "./define";
import { lessonMinutes, validateLesson, validateMath } from "./validate";

// `?lesson-data` runs scripts/lesson-data-loader.cjs (next.config.ts): a lesson's animations arrive as
// markers, not as client components, so a page that reads lessons ships no animation it does not show.
const LOADERS = import.meta.glob<{ default: Lesson }>("./*/lesson.ts", { query: "?lesson-data" });
const MATH_LOADERS = import.meta.glob<{ default?: MathEntry[]; math?: MathEntry[] }>("./*/math.ts", { query: "?lesson-data" });

function folderOf(key: string): string {
  return key.split("/")[1] ?? key;
}

const FOLDERS = new Map(Object.entries(LOADERS).map(([key, load]) => [folderOf(key), load]));
const MATH_FOLDERS = new Map(Object.entries(MATH_LOADERS).map(([key, load]) => [folderOf(key), load]));

/** Slugs that have a lesson folder, in no particular order. */
export function lessonSlugs(): string[] {
  return [...FOLDERS.keys()];
}

export function hasLesson(slug: string): boolean {
  return FOLDERS.has(slug);
}

const warned = new Set<string>();

function report(warnings: string[]) {
  for (const warning of warnings) {
    if (!warned.has(warning)) {
      warned.add(warning);
      console.warn(`[lessons] ${warning}`);
    }
  }
}

/**
 * The lesson for a chapter, checked against the format; undefined when the
 * chapter has none. A lesson that breaks a rule fails the build with the list
 * of what to fix.
 */
export async function getLesson(slug: string): Promise<Lesson | undefined> {
  const load = FOLDERS.get(slug);
  if (!load) return undefined;
  const loaded = await load();
  // The module, or (depending on the bundler's interop) its default export directly.
  const lesson = ("default" in loaded && loaded.default ? loaded.default : loaded) as Lesson;
  const known = new Set(getAllChapters().map((chapter) => chapter.slug));
  const { errors, warnings } = validateLesson(lesson, slug, known);
  report(warnings);
  if (errors.length > 0) {
    throw new Error(`[lessons] The lesson "${slug}" does not follow the format (AUTHORING.md):\n- ${errors.join("\n- ")}`);
  }
  return lesson;
}

/**
 * The lesson's optional "The math, step by step" (src/lessons/<slug>/math.ts),
 * checked; undefined when there is none. A file that breaks a rule fails the build.
 */
export async function getMath(slug: string): Promise<MathEntry[] | undefined> {
  const load = MATH_FOLDERS.get(slug);
  if (!load) return undefined;
  const loaded = (await load()) as { default?: unknown; math?: unknown } | unknown[];
  const entries = Array.isArray(loaded) ? loaded : (loaded.default ?? loaded.math);
  const { errors, warnings } = validateMath(entries, `src/lessons/${slug}/math.ts`);
  report(warnings);
  if (errors.length > 0) {
    throw new Error(`[lessons] The math of "${slug}" does not follow the format (AUTHORING.md):\n- ${errors.join("\n- ")}`);
  }
  return entries as MathEntry[];
}

/**
 * The titles lessons set themselves (`title` in lesson.ts), by slug. Pass the map to the course
 * helpers of src/lib/course.ts (getCourse, courseTitle, courseSidebar, courseNeighbours) so a
 * lesson is named the same everywhere.
 */
export async function lessonTitles(): Promise<Map<string, string>> {
  const entries = await Promise.all(
    lessonSlugs()
      .sort()
      .map(async (slug) => {
        const lesson = await getLesson(slug);
        return lesson?.title ? ([slug, lesson.title] as const) : undefined;
      }),
  );
  return new Map(entries.filter((entry): entry is NonNullable<typeof entry> => entry !== undefined));
}

export interface LessonSummary {
  idea: string;
  takeaway: string;
  beats: number;
  minutes: number;
}

/** Every lesson's idea, takeaway, length and minutes by slug, for the indexes. */
export async function lessonIdeas(): Promise<Map<string, LessonSummary>> {
  const entries = await Promise.all(
    lessonSlugs().map(async (slug) => {
      const lesson = await getLesson(slug);
      return lesson
        ? ([slug, { idea: lesson.idea, takeaway: lesson.takeaway, beats: lesson.beats.length, minutes: lessonMinutes(lesson) }] as const)
        : undefined;
    }),
  );
  return new Map(entries.filter((entry): entry is NonNullable<typeof entry> => entry !== undefined));
}
