import Link from "next/link";
import { ChapterHeader } from "@/components/chapter/ChapterHeader";
import { ChapterPager } from "@/components/chapter/ChapterPager";
import { ChapterSidebar } from "@/components/chapter/ChapterSidebar";
import { ReadingProgress } from "@/components/chapter/ReadingProgress";
import { Markdown } from "@/components/markdown/Markdown";
import { getChapter, getNeighbours, getSidebarParts, type Chapter } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown/pipeline";
import { repoUrl, site } from "@/lib/site";

/**
 * The full chapter as written in the tutorial: every section, the code, the
 * measurements. With a lesson, it is the "go deeper" page at /learn/<slug>/full
 * and links back to the lesson; without one, it is the chapter page itself.
 */
export function LongChapter({ chapter, lessonHref }: { chapter: Chapter; lessonHref?: string }) {
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
      <div className="page-frame lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-x-12 xl:grid-cols-[256px_minmax(0,960px)] xl:gap-x-16">
        <ChapterSidebar parts={parts} currentSlug={chapter.slug} currentTitle={chapter.title} sections={sections} />
        <main id="main" tabIndex={-1} className="min-w-0 pb-8 outline-none">
          <article id="chapter">
            {lessonHref ? (
              <p className="full-banner">
                <Link href={lessonHref} className="full-banner-link">
                  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
                    <path d="M13 8H3M7 4L3 8l4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Back to the lesson
                </Link>
                <span>The full chapter: every detail, the code and the measurements.</span>
              </p>
            ) : null}
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
