import Link from "next/link";
import type { Part } from "@/lib/content";
import { Stages } from "./Stages";

/** What the course covers: the three models, then every part with its chapters. */
export function PartsOverview({ parts, lessons }: { parts: Part[]; lessons: ReadonlySet<string> }) {
  return (
    <section aria-labelledby="learn-title" className="page-frame landing-section">
      <div className="section-intro">
        <h2 id="learn-title" className="section-title">
          What you will build
        </h2>
        <p className="section-lead">
          Three models, each on top of the one before, in the order you would build them yourself. Each lesson explains
          one idea; each full chapter shows the code and what was measured.
        </p>
      </div>

      <Stages parts={parts} />

      {parts.length > 0 ? (
        <>
          <h3 className="parts-title">All {parts.length} parts</h3>
          <ol className="parts">
            {parts.map((part) => (
              <li key={part.id} className="part">
                <Link href={`/learn#${part.id}`} className="part-head">
                  <span className="part-number" aria-hidden="true">
                    {part.number}
                  </span>
                  <span className="part-name">{part.name}</span>
                  <span className="part-count">
                    {part.chapters.length} {part.chapters.length === 1 ? "chapter" : "chapters"}
                  </span>
                </Link>
                <ul className="part-chapters">
                  {part.chapters.map((chapter) => (
                    <li key={chapter.slug}>
                      <Link href={`/learn/${chapter.slug}`} className="part-chapter" data-lesson={lessons.has(chapter.slug) ? "" : undefined}>
                        {chapter.title}
                        {lessons.has(chapter.slug) ? <span className="sr-only"> (animated lesson)</span> : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          <p className="parts-key">
            <span className="part-chapter-dot" aria-hidden="true" /> Chapters with an animated lesson. The others open
            the full chapter for now.
          </p>
        </>
      ) : (
        <p className="section-lead">The chapters are being written. They are listed here as soon as the first one is in.</p>
      )}
    </section>
  );
}
