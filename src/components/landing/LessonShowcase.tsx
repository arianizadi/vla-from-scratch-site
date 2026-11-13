import Link from "next/link";
import type { ChapterMeta } from "@/lib/content";

export interface ShowcaseItem {
  chapter: ChapterMeta;
  idea: string;
  beats: number;
}

/** A few animated lessons to start with, in reading order. */
export function LessonShowcase({ items }: { items: ShowcaseItem[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="lessons-title" className="page-frame landing-section">
      <div className="section-intro">
        <h2 id="lessons-title" className="section-title">
          Start with a lesson
        </h2>
        <p className="section-lead">A few minutes each: one idea, a handful of steps, an animation for every step.</p>
      </div>
      <ul className="showcase">
        {items.map(({ chapter, idea, beats }) => (
          <li key={chapter.slug}>
            <Link href={`/learn/${chapter.slug}`} className="showcase-card">
              <span className="showcase-part">
                Part {chapter.part.number}, {chapter.part.name}
              </span>
              <span className="showcase-title">{chapter.title}</span>
              <span className="showcase-idea">{idea.replace(/[*`]/g, "")}</span>
              <span className="showcase-meta">{beats} steps</span>
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" className="showcase-arrow">
                <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
