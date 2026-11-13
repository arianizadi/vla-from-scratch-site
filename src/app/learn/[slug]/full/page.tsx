import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LongChapter } from "@/components/chapter/LongChapter";
import { getAllChapters, getChapter } from "@/lib/content";
import { courseLesson, courseTitle } from "@/lib/course";
import { getLesson, hasLesson, lessonTitles } from "@/lessons";
import { site } from "@/lib/site";
import "katex/dist/katex.min.css";

interface FullChapterProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllChapters().map((chapter) => ({ slug: chapter.slug }));
}

export async function generateMetadata({ params }: FullChapterProps): Promise<Metadata> {
  const { slug } = await params;
  const chapter = getChapter(slug);
  if (!chapter) return {};
  // A chapter outside the course without a lesson shows this same text at /learn/<slug>: that address is canonical.
  const canonical = hasLesson(slug) || courseLesson(slug) ? `/learn/${slug}/full` : `/learn/${slug}`;
  const title = `${courseTitle(chapter, await lessonTitles())}, technical details`;
  return {
    title,
    description: chapter.summary || undefined,
    alternates: { canonical },
    robots: chapter.isSample ? { index: false } : undefined,
    openGraph: { type: "article", siteName: site.name, title, description: chapter.summary || undefined, url: canonical },
  };
}

/** See the note on `instant` in ../page.tsx. */
export const instant = false;

/** The technical details of a chapter, synced from the tutorial: code, exact numbers and measurements. */
export default async function FullChapterPage({ params }: FullChapterProps) {
  const { slug } = await params;
  const chapter = getChapter(slug);
  if (!chapter) notFound();
  const lesson = await getLesson(slug);
  const inCourse = courseLesson(slug) !== undefined;
  return (
    <LongChapter
      chapter={chapter}
      lessonHref={lesson || inCourse ? `/learn/${slug}` : undefined}
      summary={lesson ? { idea: lesson.idea, takeaway: lesson.takeaway } : undefined}
      technical
      titles={await lessonTitles()}
    />
  );
}
