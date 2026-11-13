import Link from "next/link";
import { ChapterHeader } from "@/components/chapter/ChapterHeader";
import { ChapterPager } from "@/components/chapter/ChapterPager";
import { ChapterSidebar } from "@/components/chapter/ChapterSidebar";
import { ReadingProgress } from "@/components/chapter/ReadingProgress";
import { Inline } from "@/components/lesson/Inline";
import { Markdown } from "@/components/markdown/Markdown";
import { getChapter, type Chapter } from "@/lib/content";
import { courseBlurb, courseExtra, courseNeighbours, courseSidebar, courseTitle, type TitleOverrides } from "@/lib/course";
import { renderMarkdown } from "@/lib/markdown/pipeline";
import { repoUrl, site } from "@/lib/site";

interface LongChapterProps {
  chapter: Chapter;
  /** The lesson page of this chapter, when it is part of the course or has a lesson. */
  lessonHref?: string;
  /** The lesson's idea and takeaway, for the "In one minute" box. */
  summary?: { idea: string; takeaway: string };
  /** At /learn/<slug>/full: the pager stays among technical pages. */
  technical?: boolean;
  /** Titles lessons set themselves (`lessonTitles()`), so every lesson is named as in the course. */
  titles?: TitleOverrides;
}

function BackGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M13 8H3M7 4L3 8l4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The technical details of a chapter as written in the tutorial: every
 * section, the code (folded), the tables (folded) and the measurements. It
 * opens with a note that this is the reference version and a plain "In one
 * minute" summary; the lesson is where the idea is taught.
 */
export function LongChapter({ chapter, lessonHref, summary, technical = false, titles }: LongChapterProps) {
  const { tree, headings } = renderMarkdown(chapter.body, {
    chapterNumber: String(chapter.order),
    chapterTitle: (target) => {
      const found = getChapter(target);
      return found ? courseTitle(found, titles) : undefined;
    },
  });
  const { previous, next } = courseNeighbours(chapter.slug, titles);
  const sections = headings
    .filter((heading) => heading.depth === 2)
    .map(({ id, text, section }) => ({ id, text, section }));

  // The pipeline samples exist only in this repository, so they have no source link.
  const editUrl = chapter.isSample ? undefined : repoUrl(`${site.chapterDir}/${chapter.slug}.md`, "edit");
  const extra = courseExtra(chapter.slug);
  const blurb = courseBlurb(chapter);
  const hasLesson = summary !== undefined;

  return (
    <>
      <ReadingProgress targetId="chapter" />
      <div className="page-frame lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-x-12 xl:grid-cols-[256px_minmax(0,960px)] xl:gap-x-16">
        <ChapterSidebar parts={courseSidebar(titles)} currentSlug={chapter.slug} currentTitle={courseTitle(chapter, titles)} sections={sections} />
        <main id="main" tabIndex={-1} className="min-w-0 pb-8 outline-none">
          <article id="chapter">
            <p className="full-banner">
              <Link href={hasLesson && lessonHref ? lessonHref : "/learn"} className="full-banner-link">
                <BackGlyph />
                {hasLesson ? "Go to the lesson" : "Back to the course"}
              </Link>
              <span>
                {extra?.id === "run"
                  ? "A hands-on guide for running the code yourself. Optional: the course teaches the ideas without it."
                  : extra?.id === "reference"
                    ? "Reference material, to look things up while you learn."
                    : hasLesson
                      ? "The reference version, with code and exact numbers. The lesson is the place to learn the idea."
                      : "The reference version, with code and exact numbers. Its lesson is being written."}
              </span>
            </p>
            <ChapterHeader chapter={chapter} title={courseTitle(chapter, titles)} editUrl={editUrl} />

            {summary || blurb ? (
              <aside className="one-minute" aria-labelledby="one-minute-title">
                <h2 id="one-minute-title" className="one-minute-title">
                  In one minute
                </h2>
                {summary ? (
                  <>
                    <p className="one-minute-idea">
                      <Inline text={summary.idea} />
                    </p>
                    <p className="one-minute-takeaway">
                      <span className="one-minute-label">Remember</span> <Inline text={summary.takeaway} />
                    </p>
                  </>
                ) : (
                  <p className="one-minute-idea">You will understand: {blurb.charAt(0).toLowerCase() + blurb.slice(1)}</p>
                )}
              </aside>
            ) : null}

            <div className="prose prose-technical mt-10">
              <Markdown tree={tree} />
            </div>
          </article>
          <ChapterPager previous={previous} next={next} suffix={technical ? "/full" : ""} />
        </main>
      </div>
    </>
  );
}
