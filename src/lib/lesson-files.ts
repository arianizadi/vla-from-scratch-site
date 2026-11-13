/**
 * Whether a chapter has a lesson folder, read from the file system so that
 * modules below src/lessons (the Markdown pipeline, the chapter index) can ask
 * without importing the lessons themselves. Build time only.
 */

import fs from "node:fs";
import path from "node:path";

const LESSON_DIR = path.join(process.cwd(), "src", "lessons");

export function hasLessonFile(slug: string): boolean {
  try {
    return fs.statSync(path.join(LESSON_DIR, slug, "lesson.ts")).isFile();
  } catch {
    return false;
  }
}

/**
 * The address of a place in a chapter. Section anchors live in the technical
 * page, so a link with an anchor goes to /learn/<slug>/full#anchor (a chapter
 * without a lesson shows a "being written" card or its technical page at
 * /learn/<slug>, and the technical page is always at /full); a link to the
 * chapter itself goes to the lesson.
 */
export function chapterHref(slug: string, hash = ""): string {
  return hash ? `/learn/${slug}/full${hash}` : `/learn/${slug}`;
}
