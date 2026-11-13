import Link from "next/link";
import { ChapterSidebar, type SidebarPart } from "@/components/chapter/ChapterSidebar";
import { ReadingProgress } from "@/components/chapter/ReadingProgress";
import { FIGURES } from "@/figures/catalog";
import { FigureMount } from "@/figures/FigureMount";
import type { ChapterMeta } from "@/lib/content";
import type { CourseLesson, NeighbourRef } from "@/lib/course";
import type { Lesson, MathEntry } from "@/lessons/define";
import { AnimationSlot } from "@/lessons/AnimationSlot";
import { lessonMinutes } from "@/lessons/validate";
import { Inline } from "./Inline";
import { MathSection } from "./MathSection";

interface LessonViewProps {
  chapter: ChapterMeta;
  lesson: Lesson;
  /** The optional "The math, step by step" entries (src/lessons/<slug>/math.ts). */
  math?: MathEntry[];
  /** Where the lesson sits in the course; undefined outside the main path. */
  place?: CourseLesson;
  /** Total lessons in the course. */
  total: number;
  /** The title the course gives the chapter. */
  title: string;
  parts: SidebarPart[];
  previous?: NeighbourRef;
  next?: NeighbourRef;
  /** The related chapters, resolved. */
  related: { slug: string; title: string }[];
}

/** A warning sign: where the idea breaks. */
function EdgeGlyph() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false" className="lesson-list-glyph">
      <path d="M10 2.8 18 16.6H2z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 8v4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10" cy="14.4" r="1.1" fill="currentColor" />
    </svg>
  );
}

/** A tick in a circle: advice that works. */
function TipGlyph() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false" className="lesson-list-glyph">
      <circle cx="10" cy="10" r="7.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m6.6 10.2 2.3 2.3 4.6-4.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowGlyph() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false" className="up-next-arrow">
      <path d="M4 10h11M10.5 5.5 15 10l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The end of a lesson: how far along the course the reader is, and the next
 * lesson as one big, inviting card; the previous one as a quiet link. After
 * the last lesson, the way beyond the course.
 */
export function UpNext({ place, total, previous, next }: { place?: CourseLesson; total: number; previous?: NeighbourRef; next?: NeighbourRef }) {
  const done = place ? Math.round((place.number / total) * 100) : 0;
  return (
    <nav aria-labelledby="up-next-title" className="up-next">
      {place ? (
        <div className="up-next-progress">
          <p className="up-next-progress-text">
            {next ? `Lesson ${place.number} of ${total} done.` : `Lesson ${total} of ${total}: that is the whole course.`}
          </p>
          <span className="up-next-track" aria-hidden="true">
            <span className="up-next-fill" style={{ width: `${done}%` }} />
          </span>
        </div>
      ) : null}
      <h2 id="up-next-title" className="sr-only">
        {next ? "Next lesson" : "Where to go from here"}
      </h2>
      {next ? (
        <Link href={`/learn/${next.slug}`} prefetch rel="next" className="up-next-card">
          <span className="up-next-label">{next.number ? `Up next: lesson ${next.number}` : "Up next"}</span>
          <span className="up-next-title">{next.title}</span>
          {next.blurb ? <span className="up-next-blurb">{next.blurb}</span> : null}
          <span className="up-next-cta">
            {next.number ? `Start lesson ${next.number}` : "Read it next"}
            <ArrowGlyph />
          </span>
        </Link>
      ) : place ? (
        <Link href="/learn#extras" className="up-next-card">
          <span className="up-next-label">You finished the course</span>
          <span className="up-next-title">Beyond the course</span>
          <span className="up-next-blurb">Stories from the experiments, a glossary, and how to run it all yourself.</span>
          <span className="up-next-cta">
            See what else there is
            <ArrowGlyph />
          </span>
        </Link>
      ) : null}
      {previous ? (
        <p className="up-next-back">
          <Link href={`/learn/${previous.slug}`} rel="prev" className="text-link">
            {previous.number ? `Back to lesson ${previous.number}: ${previous.title}` : `Back to ${previous.title}`}
          </Link>
        </p>
      ) : null}
    </nav>
  );
}

/** The lesson's place in the course: module and lesson number, or "beyond the course". */
export function LessonKicker({ place, total }: { place?: CourseLesson; total: number }) {
  return (
    <p className="lesson-kicker">
      {place ? (
        <>
          <Link href={`/learn#${place.module.id}`} className="lesson-part">
            Module {place.module.number}: {place.module.title}
          </Link>
          <span className="lesson-number">
            Lesson {place.number} of {total}
          </span>
        </>
      ) : (
        <Link href="/learn#extras" className="lesson-part">
          Beyond the course
        </Link>
      )}
    </p>
  );
}

/**
 * A lesson: the idea, a few beats each with an animation, the optional maths,
 * what could go wrong and tips, the takeaway. The technical details sit
 * below as a quiet link.
 */
export function LessonView({ chapter, lesson, math, place, total, title, parts, previous, next, related }: LessonViewProps) {
  const minutes = lessonMinutes(lesson);
  const hasMath = math !== undefined && math.length > 0;
  const sections = [
    ...lesson.beats.map((beat, index) => ({ id: `beat-${index + 1}`, text: beat.title, section: String(index + 1) })),
    ...(hasMath ? [{ id: "math", text: "The math, step by step", section: "" }] : []),
    { id: "edge-cases", text: "What could go wrong", section: "" },
    { id: "takeaway", text: "Takeaway", section: "" },
  ];
  const fullHref = `/learn/${chapter.slug}/full`;

  return (
    <>
      <ReadingProgress targetId="lesson" />
      <div className="page-frame lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-x-12 xl:grid-cols-[256px_minmax(0,1fr)] xl:gap-x-16">
        <ChapterSidebar parts={parts} currentSlug={chapter.slug} currentTitle={title} sections={sections} />

        <main id="main" tabIndex={-1} className="min-w-0 pb-8 outline-none">
          <article id="lesson" className="lesson">
            <header className="lesson-hero">
              <LessonKicker place={place} total={total} />
              <h1 className="lesson-title">{title}</h1>
              <p className="lesson-idea">
                <Inline text={lesson.idea} />
              </p>
              <ul className="lesson-facts" aria-label="About this lesson">
                <li>{lesson.beats.length} short steps</li>
                <li>
                  About {minutes} {minutes === 1 ? "minute" : "minutes"}
                </li>
                {hasMath ? (
                  <li>
                    <a href="#math" className="lesson-fact-link lesson-fact-quiet">
                      Maths, step by step
                    </a>
                  </li>
                ) : null}
                <li>
                  <Link href={fullHref} className="lesson-fact-link lesson-fact-quiet">
                    Technical details
                  </Link>
                </li>
              </ul>
            </header>

            <ol className="lesson-beats">
              {lesson.beats.map((beat, index) => {
                const Animation = beat.animation;
                const id = `beat-${index + 1}`;
                return (
                  <li key={id} id={id} className={`beat ${Animation ? "" : "beat-plain"}`} aria-labelledby={`${id}-title`}>
                    <div className="beat-text">
                      <span className="beat-number" aria-hidden="true">
                        {index + 1}
                      </span>
                      <h2 id={`${id}-title`} className="beat-title">
                        {beat.title}
                      </h2>
                      <p className="beat-body">
                        <Inline text={beat.text} />
                      </p>
                    </div>
                    {Animation ? (
                      <div className="beat-visual">
                        <AnimationSlot animation={Animation} />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>

            {hasMath ? <MathSection entries={math} /> : null}

            <section id="edge-cases" aria-label="What could go wrong, and tips" className="lesson-lists">
              <div className="lesson-list lesson-list-edges">
                <h2 className="lesson-list-title">
                  <EdgeGlyph />
                  What could go wrong
                </h2>
                <ul>
                  {lesson.edgeCases.map((item, index) => (
                    <li key={index}>
                      <Inline text={item} />
                    </li>
                  ))}
                </ul>
              </div>
              <div className="lesson-list lesson-list-tips">
                <h2 className="lesson-list-title">
                  <TipGlyph />
                  Tips
                </h2>
                <ul>
                  {lesson.tips.map((item, index) => (
                    <li key={index}>
                      <Inline text={item} />
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section id="takeaway" aria-labelledby="takeaway-title" className="lesson-takeaway">
              <h2 id="takeaway-title" className="lesson-takeaway-label">
                Takeaway
              </h2>
              <p className="lesson-takeaway-text">
                <span className="lesson-takeaway-mark">
                  <Inline text={lesson.takeaway} />
                </span>
              </p>
            </section>

            {lesson.tryIt && lesson.tryIt.length > 0 ? (
              <section aria-labelledby="try-title" className="lesson-try">
                <h2 id="try-title" className="lesson-section-title">
                  Try it yourself
                </h2>
                <p className="lesson-section-lead">Open one, change what goes in and watch what moves.</p>
                <div className="lesson-try-figures">
                  {lesson.tryIt.map((id) => (
                    <details key={id} className="lesson-try-item">
                      <summary>
                        <span>{FIGURES[id].title}</span>
                        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
                          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </summary>
                      <FigureMount id={id} />
                    </details>
                  ))}
                </div>
              </section>
            ) : null}

            <UpNext place={place} total={total} previous={previous} next={next} />

            <section aria-labelledby="deeper-title" className="lesson-deeper">
              <h2 id="deeper-title" className="lesson-deeper-title">
                Want more?
              </h2>
              <ul className="deeper-links">
                <li>
                  <Link href={fullHref} className="deeper-link">
                    <span className="deeper-link-title">Technical details</span>
                    <span className="deeper-link-text">The code, the exact numbers and how they were measured.</span>
                  </Link>
                </li>
                {(lesson.lab ?? []).map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="deeper-link">
                      <span className="deeper-link-title">In the experiments</span>
                      <span className="deeper-link-text">{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {related.length > 0 ? (
                <p className="deeper-related">
                  <span className="deeper-related-label">Related lessons:</span>
                  {related.map((item) => (
                    <Link key={item.slug} href={`/learn/${item.slug}`} className="text-link">
                      {item.title}
                    </Link>
                  ))}
                </p>
              ) : null}
            </section>
          </article>
        </main>
      </div>
    </>
  );
}
