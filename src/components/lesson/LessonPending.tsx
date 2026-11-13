import Link from "next/link";
import { ChapterPager } from "@/components/chapter/ChapterPager";
import { ChapterSidebar, type SidebarPart } from "@/components/chapter/ChapterSidebar";
import type { ChapterMeta } from "@/lib/content";
import type { CourseLesson, NeighbourRef } from "@/lib/course";
import { LessonKicker } from "./LessonView";

interface LessonPendingProps {
  chapter: ChapterMeta;
  place: CourseLesson;
  total: number;
  parts: SidebarPart[];
  previous?: NeighbourRef;
  next?: NeighbourRef;
}

/** A pencil drawing a line: the lesson is being written. */
function PendingDrawing() {
  return (
    <svg viewBox="0 0 120 64" width="120" height="64" aria-hidden="true" focusable="false" className="pending-drawing">
      <path d="M8 46c14-18 26-18 36-6s22 12 32-4" fill="none" className="pending-line" strokeWidth="3" strokeLinecap="round" pathLength={120} />
      <g className="pending-pencil" transform="translate(76 36) rotate(-38)">
        <rect x="0" y="-5" width="34" height="10" rx="2" className="pending-pencil-body" />
        <path d="M0 -5L-9 0L0 5Z" className="pending-pencil-tip" />
      </g>
    </svg>
  );
}

/**
 * A lesson of the course that is not written yet: what it will teach, and a
 * quiet way to the technical version in the meantime. The long chapter is
 * never the main page of a lesson.
 */
export function LessonPending({ chapter, place, total, parts, previous, next }: LessonPendingProps) {
  return (
    <div className="page-frame lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-x-12 xl:grid-cols-[256px_minmax(0,1fr)] xl:gap-x-16">
      <ChapterSidebar parts={parts} currentSlug={chapter.slug} currentTitle={place.title} sections={[]} />
      <main id="main" tabIndex={-1} className="min-w-0 pb-8 outline-none">
        <article className="lesson">
          <header className="lesson-hero">
            <LessonKicker place={place} total={total} />
            <h1 className="lesson-title">{place.title}</h1>
            {place.blurb ? <p className="lesson-idea">{place.blurb}</p> : null}
          </header>

          <section className="pending-card" aria-labelledby="pending-title">
            <PendingDrawing />
            <div>
              <h2 id="pending-title" className="pending-title">
                This lesson is being written
              </h2>
              <p className="pending-text">
                It will explain this idea in a few short steps, each with an animation.
                {next ? " You can carry on with the next lesson and come back later." : null}
              </p>
              <p className="pending-actions">
                {next ? (
                  <Link href={`/learn/${next.slug}`} className="button button-primary">
                    Next: {next.title}
                  </Link>
                ) : (
                  <Link href="/learn" className="button button-primary">
                    Back to the course
                  </Link>
                )}
                <Link href={`/learn/${chapter.slug}/full`} className="button">
                  Technical details
                </Link>
              </p>
            </div>
          </section>
        </article>
        <ChapterPager previous={previous} next={next} />
      </main>
    </div>
  );
}
