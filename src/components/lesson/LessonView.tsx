import Link from "next/link";
import { ChapterPager } from "@/components/chapter/ChapterPager";
import { ChapterSidebar, type SidebarPart } from "@/components/chapter/ChapterSidebar";
import { ReadingProgress } from "@/components/chapter/ReadingProgress";
import { FIGURES } from "@/figures/catalog";
import { FigureMount } from "@/figures/FigureMount";
import type { ChapterMeta } from "@/lib/content";
import type { Lesson } from "@/lessons/define";
import { countWords } from "@/lessons/validate";
import { Inline } from "./Inline";

interface LessonViewProps {
  chapter: ChapterMeta;
  lesson: Lesson;
  parts: SidebarPart[];
  previous?: ChapterMeta;
  next?: ChapterMeta;
  /** The related chapters, resolved. */
  related: ChapterMeta[];
}

/** Reading time of the lesson: its words, plus a few seconds to watch each animation. */
function lessonMinutes(lesson: Lesson): number {
  const words =
    countWords(lesson.idea) +
    lesson.beats.reduce((total, beat) => total + countWords(beat.text), 0) +
    [...lesson.edgeCases, ...lesson.tips].reduce((total, item) => total + countWords(item), 0) +
    countWords(lesson.takeaway);
  const seconds = (words / 200) * 60 + lesson.beats.filter((beat) => beat.animation).length * 15;
  return Math.max(1, Math.round(seconds / 60));
}

function EdgeGlyph() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false" className="lesson-list-glyph">
      <path d="M4 15.5h12M4 15.5V4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="4" cy="15.5" r="2.4" fill="currentColor" />
    </svg>
  );
}

function TipGlyph() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false" className="lesson-list-glyph">
      <path d="M10 2.5v4M10 13.5v4M2.5 10h4M13.5 10h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="10" cy="10" r="2" fill="currentColor" />
    </svg>
  );
}

/**
 * A chapter's short lesson: the idea, a few beats each with an animation,
 * edge cases and tips, the takeaway, then ways to go deeper.
 */
export function LessonView({ chapter, lesson, parts, previous, next, related }: LessonViewProps) {
  const minutes = lessonMinutes(lesson);
  const sections = [
    ...lesson.beats.map((beat, index) => ({ id: `beat-${index + 1}`, text: beat.title, section: String(index + 1) })),
    { id: "edge-cases", text: "Edge cases and tips", section: "" },
    { id: "takeaway", text: "Takeaway", section: "" },
  ];
  const fullHref = `/learn/${chapter.slug}/full`;

  return (
    <>
      <ReadingProgress targetId="lesson" />
      <div className="page-frame lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-x-12 xl:grid-cols-[256px_minmax(0,1fr)] xl:gap-x-16">
        <ChapterSidebar parts={parts} currentSlug={chapter.slug} currentTitle={chapter.title} sections={sections} />

        <main id="main" tabIndex={-1} className="min-w-0 pb-8 outline-none">
          <article id="lesson" className="lesson">
            <header className="lesson-hero">
              <p className="lesson-kicker">
                <Link href={`/learn#${chapter.part.id}`} className="lesson-part">
                  Part {chapter.part.number}, {chapter.part.name}
                </Link>
                <span className="lesson-number">Chapter {chapter.orderLabel}</span>
              </p>
              <h1 className="lesson-title">{chapter.title}</h1>
              <p className="lesson-idea">
                <Inline text={lesson.idea} />
              </p>
              <ul className="lesson-facts" aria-label="About this lesson">
                <li>{lesson.beats.length} steps</li>
                <li>About {minutes} {minutes === 1 ? "minute" : "minutes"}</li>
                <li>
                  <Link href={fullHref} className="lesson-fact-link">
                    Full chapter, {chapter.readingMinutes} min
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
                        <Animation />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>

            <section id="edge-cases" aria-label="Edge cases and tips" className="lesson-lists">
              <div className="lesson-list lesson-list-edges">
                <h2 className="lesson-list-title">
                  <EdgeGlyph />
                  Edge cases
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
                  Quick tips
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
                <p className="lesson-section-lead">Interactive figures from the full chapter: open one, change its inputs and watch what moves.</p>
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

            <section aria-labelledby="deeper-title" className="lesson-deeper">
              <h2 id="deeper-title" className="lesson-section-title">
                Go deeper
              </h2>
              <div className="lesson-deeper-grid">
                <Link href={fullHref} className="deeper-card deeper-card-main">
                  <span className="deeper-card-title">Read the full chapter</span>
                  <span className="deeper-card-text">
                    The code, the exact numbers, what was measured and how to check it yourself. About{" "}
                    {chapter.readingMinutes} minutes.
                  </span>
                  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" className="deeper-card-arrow">
                    <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                {lesson.lab && lesson.lab.length > 0 ? (
                  <div className="deeper-block">
                    <h3 className="deeper-block-title">Measured in the lab</h3>
                    <ul>
                      {lesson.lab.map((link) => (
                        <li key={link.href}>
                          <Link href={link.href} className="text-link">
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {related.length > 0 ? (
                  <div className="deeper-block">
                    <h3 className="deeper-block-title">Related chapters</h3>
                    <ul>
                      {related.map((item) => (
                        <li key={item.slug}>
                          <Link href={`/learn/${item.slug}`} className="text-link">
                            {item.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </section>
          </article>
          <ChapterPager previous={previous} next={next} />
        </main>
      </div>
    </>
  );
}
