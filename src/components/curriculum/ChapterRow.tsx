import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ChapterMeta } from "@/lib/content";

/**
 * One line of the contents page: order number, title, the lesson's idea (or
 * the chapter's summary while it has no lesson), then the chapter's facts.
 * `showStatus` is off when the page says once that every chapter has the
 * same status.
 */
export function ChapterRow({
  chapter,
  lesson,
  showStatus = true,
}: {
  chapter: ChapterMeta;
  lesson?: { idea: string; beats: number };
  showStatus?: boolean;
}) {
  return (
    <li className="chapter-row" data-lesson={lesson ? "" : undefined}>
      <span className="chapter-row-number" aria-hidden="true">
        {chapter.orderLabel}
      </span>
      <div className="min-w-0">
        <h3 className="chapter-row-title">
          <Link href={`/learn/${chapter.slug}`} className="chapter-row-link">
            {chapter.title}
          </Link>
        </h3>
        <p className="chapter-row-text">{lesson ? lesson.idea.replace(/[*`]/g, "") : chapter.summary}</p>
      </div>
      <ul className="chapter-row-facts">
        {lesson ? <li className="chapter-row-lesson">Animated lesson, {lesson.beats} steps</li> : null}
        {showStatus ? (
          <li>
            <StatusBadge status={chapter.status} />
          </li>
        ) : null}
        <li className="tabular-nums">{lesson ? `Full chapter ${chapter.readingMinutes} min` : `${chapter.readingMinutes} min read`}</li>
      </ul>
    </li>
  );
}
