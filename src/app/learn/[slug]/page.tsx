import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LongChapter } from "@/components/chapter/LongChapter";
import { LessonPending } from "@/components/lesson/LessonPending";
import { LessonView } from "@/components/lesson/LessonView";
import { getAllChapters, getChapter } from "@/lib/content";
import { courseBlurb, courseLesson, courseNeighbours, courseSidebar, courseTitle, getCourse } from "@/lib/course";
import { getLesson, getMath } from "@/lessons";
import { site } from "@/lib/site";
import "katex/dist/katex.min.css";

interface ChapterPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllChapters().map((chapter) => ({ slug: chapter.slug }));
}

export async function generateMetadata({ params }: ChapterPageProps): Promise<Metadata> {
  const { slug } = await params;
  const chapter = getChapter(slug);
  if (!chapter) return {};
  const lesson = await getLesson(slug);
  const inCourse = courseLesson(slug) !== undefined;
  const title = courseTitle(chapter);
  const description = lesson?.idea ?? (courseBlurb(chapter) || chapter.summary || undefined);
  // A chapter outside the course without a lesson shows its technical page here; that address is canonical.
  const canonical = lesson || inCourse ? `/learn/${chapter.slug}` : `/learn/${chapter.slug}/full`;
  return {
    title,
    description,
    alternates: { canonical },
    robots: chapter.isSample ? { index: false } : undefined,
    openGraph: { type: "article", siteName: site.name, title, description, url: canonical },
  };
}

/**
 * The chapter is rendered without a Suspense boundary around the read of the slug, so the static
 * HTML of a chapter page holds the chapter's text in place. With a boundary, React puts a
 * placeholder there and the text in a hidden block that an inline script moves in: the page then
 * shows nothing but the placeholder without JavaScript, and an unknown slug answers 200 instead of
 * 404.
 *
 * The cost: a link to a chapter has no shared shell to show at once, so a navigation waits for the
 * chapter's prerendered payload (a static file). `instant = false` tells Next.js that this wait is
 * intended; the pager's links load the payload ahead of the click with `prefetch`.
 */
export const instant = false;

/**
 * /learn/<slug>: the lesson when there is one; for a lesson of the course not written yet, a calm
 * "in progress" card (never the long chapter); for a chapter outside the course (run it yourself,
 * case studies, reference), its technical page.
 */
export default async function ChapterPage({ params }: ChapterPageProps) {
  const { slug } = await params;
  const chapter = getChapter(slug);
  if (!chapter) notFound();

  const lesson = await getLesson(slug);
  const place = courseLesson(slug);
  const total = getCourse().lessons.length;
  const parts = courseSidebar();
  const { previous, next } = courseNeighbours(slug);

  if (!lesson) {
    if (place) return <LessonPending chapter={chapter} place={place} total={total} parts={parts} previous={previous} next={next} />;
    return <LongChapter chapter={chapter} />;
  }

  const math = await getMath(slug);
  const related = (lesson.related ?? [])
    .map((relatedSlug) => getChapter(relatedSlug))
    .filter((entry): entry is NonNullable<typeof entry> => entry !== undefined)
    .map((entry) => ({ slug: entry.slug, title: courseTitle(entry) }));

  return (
    <LessonView
      chapter={chapter}
      lesson={lesson}
      math={math}
      place={place}
      total={total}
      title={courseTitle(chapter)}
      parts={parts}
      previous={previous}
      next={next}
      related={related}
    />
  );
}
