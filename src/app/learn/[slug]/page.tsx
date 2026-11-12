import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChapterHeader } from "@/components/chapter/ChapterHeader";
import { ChapterPager } from "@/components/chapter/ChapterPager";
import { ChapterSidebar } from "@/components/chapter/ChapterSidebar";
import { ReadingProgress } from "@/components/chapter/ReadingProgress";
import { Markdown } from "@/components/markdown/Markdown";
import { getAllChapters, getChapter, getNeighbours, getSidebarParts } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown/pipeline";
import { repoUrl, site } from "@/lib/site";
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
  return {
    title: chapter.title,
    description: chapter.summary || undefined,
    alternates: { canonical: `/learn/${chapter.slug}` },
    robots: chapter.isSample ? { index: false } : undefined,
    openGraph: {
      type: "article",
      siteName: site.name,
      title: chapter.title,
      description: chapter.summary || undefined,
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

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { slug } = await params;
  const chapter = getChapter(slug);
  if (!chapter) notFound();

  const { tree, headings } = renderMarkdown(chapter.body, {
    chapterNumber: String(chapter.order),
    chapterTitle: (target) => getChapter(target)?.title,
  });
  const { previous, next } = getNeighbours(chapter.slug);

  const parts = getSidebarParts(chapter.slug).map((part) => ({
    id: part.id,
    number: part.number,
    name: part.name,
    chapters: part.chapters.map(({ slug: chapterSlug, orderLabel, title }) => ({
      slug: chapterSlug,
      orderLabel,
      title,
    })),
  }));
  const sections = headings
    .filter((heading) => heading.depth === 2)
    .map(({ id, text, section }) => ({ id, text, section }));

  // The pipeline samples exist only in this repository, so they have no source link.
  const editUrl = chapter.isSample ? undefined : repoUrl(`${site.chapterDir}/${chapter.slug}.md`, "edit");

  return (
    <>
      <ReadingProgress targetId="chapter" />
      <div className="page-frame lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-x-12 xl:grid-cols-[272px_minmax(0,960px)]">
        <ChapterSidebar
          parts={parts}
          currentSlug={chapter.slug}
          currentTitle={chapter.title}
          sections={sections}
        />
        <main id="main" tabIndex={-1} className="min-w-0 pb-8 outline-none">
          <article id="chapter">
            <ChapterHeader chapter={chapter} editUrl={editUrl} />
            <div className="prose mt-10">
              <Markdown tree={tree} />
            </div>
          </article>
          <ChapterPager previous={previous} next={next} />
        </main>
      </div>
    </>
  );
}
