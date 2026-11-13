/**
 * Finds every lesson: each folder src/lessons/<slug>/ with a lesson.ts. No
 * list to edit; adding the folder is enough. Server only (build time).
 *
 * `import.meta.glob` is Turbopack's (node_modules/next/dist/docs, the
 * Turbopack reference): the values are thunks, so a page loads only its own
 * lesson and that lesson's animations.
 */

import { getAllChapters } from "@/lib/content";
import type { Lesson } from "./define";
import { validateLesson } from "./validate";

const LOADERS = import.meta.glob<Lesson>("./*/lesson.ts", { import: "default" });

function folderOf(key: string): string {
  return key.split("/")[1] ?? key;
}

const FOLDERS = new Map(Object.entries(LOADERS).map(([key, load]) => [folderOf(key), load]));

/** Slugs that have a lesson folder, in no particular order. */
export function lessonSlugs(): string[] {
  return [...FOLDERS.keys()];
}

export function hasLesson(slug: string): boolean {
  return FOLDERS.has(slug);
}

const warned = new Set<string>();

/**
 * The lesson for a chapter, checked against the format; undefined when the
 * chapter has none. A lesson that breaks a rule fails the build with the list
 * of what to fix.
 */
export async function getLesson(slug: string): Promise<Lesson | undefined> {
  const load = FOLDERS.get(slug);
  if (!load) return undefined;
  const lesson = await load();
  const known = new Set(getAllChapters().map((chapter) => chapter.slug));
  const { errors, warnings } = validateLesson(lesson, slug, known);
  for (const warning of warnings) {
    if (!warned.has(warning)) {
      warned.add(warning);
      console.warn(`[lessons] ${warning}`);
    }
  }
  if (errors.length > 0) {
    throw new Error(`[lessons] The lesson "${slug}" does not follow the format (AUTHORING.md):\n- ${errors.join("\n- ")}`);
  }
  return lesson;
}

/** Every lesson's idea sentence by slug, for the indexes. */
export async function lessonIdeas(): Promise<Map<string, { idea: string; beats: number }>> {
  const entries = await Promise.all(
    lessonSlugs().map(async (slug) => {
      const lesson = await getLesson(slug);
      return lesson ? ([slug, { idea: lesson.idea, beats: lesson.beats.length }] as const) : undefined;
    }),
  );
  return new Map(entries.filter((entry): entry is NonNullable<typeof entry> => entry !== undefined));
}
