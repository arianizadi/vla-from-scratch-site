import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LongChapter } from "@/components/chapter/LongChapter";
import { getAllChapters, getChapter } from "@/lib/content";
import { hasLesson } from "@/lessons";
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
  // Without a lesson, /learn/<slug> shows this same text: that address is the canonical one.
  const canonical = hasLesson(slug) ? `/learn/${slug}/full` : `/learn/${slug}`;
  return {
    title: `${chapter.title}, full chapter`,
    description: chapter.summary || undefined,
    alternates: { canonical },
    robots: chapter.isSample ? { index: false } : undefined,
    openGraph: {
      type: "article",
      siteName: site.name,
      title: chapter.title,
      description: chapter.summary || undefined,
      url: canonical,
    },
  };
}

/** See the note on `instant` in ../page.tsx. */
export const instant = false;

/** The full chapter, synced from the tutorial: the "go deeper" page of a lesson. */
export default async function FullChapterPage({ params }: FullChapterProps) {
  const { slug } = await params;
  const chapter = getChapter(slug);
  if (!chapter) notFound();
  return <LongChapter chapter={chapter} lessonHref={hasLesson(slug) ? `/learn/${slug}` : undefined} />;
}
