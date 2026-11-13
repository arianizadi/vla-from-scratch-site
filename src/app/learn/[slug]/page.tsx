import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LongChapter } from "@/components/chapter/LongChapter";
import { LessonView } from "@/components/lesson/LessonView";
import { getAllChapters, getChapter, getNeighbours, getSidebarParts, type ChapterMeta } from "@/lib/content";
import { getLesson } from "@/lessons";
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
  const description = lesson?.idea ?? (chapter.summary || undefined);
  return {
    title: chapter.title,
    description,
    alternates: { canonical: `/learn/${chapter.slug}` },
    robots: chapter.isSample ? { index: false } : undefined,
    openGraph: {
      type: "article",
      siteName: site.name,
      title: chapter.title,
      description,
      url: `/learn/${chapter.slug}`,
    },
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
 * A chapter with a lesson (src/lessons/<slug>) shows the lesson; the full chapter is one click
 * away at /learn/<slug>/full. A chapter without one shows the full chapter here.
 */
export default async function ChapterPage({ params }: ChapterPageProps) {
  const { slug } = await params;
  const chapter = getChapter(slug);
  if (!chapter) notFound();

  const lesson = await getLesson(slug);
  if (!lesson) return <LongChapter chapter={chapter} />;

  const { previous, next } = getNeighbours(chapter.slug);
  const parts = getSidebarParts(chapter.slug).map((part) => ({
    id: part.id,
    number: part.number,
    name: part.name,
    chapters: part.chapters.map(({ slug: chapterSlug, orderLabel, title }) => ({ slug: chapterSlug, orderLabel, title })),
  }));
  const related = (lesson.related ?? [])
    .map((relatedSlug) => getChapter(relatedSlug))
    .filter((entry): entry is NonNullable<typeof entry> => entry !== undefined)
    .map(({ body: _body, ...meta }): ChapterMeta => {
      void _body;
      return meta;
    });

  return <LessonView chapter={chapter} lesson={lesson} parts={parts} previous={previous} next={next} related={related} />;
}
