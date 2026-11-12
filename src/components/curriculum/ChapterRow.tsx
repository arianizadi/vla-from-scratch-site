import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ChapterMeta } from "@/lib/content";

/** One line of the contents page: order number, title, summary, then the chapter's facts. */
export function ChapterRow({ chapter }: { chapter: ChapterMeta }) {
  return (
    <li className="group relative grid grid-cols-[36px_minmax(0,1fr)] gap-x-3 border-t border-line py-4 sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:gap-x-4">
      <span className="pt-0.5 text-16 text-ink-faint tabular-nums" aria-hidden="true">
        {chapter.orderLabel}
      </span>
      <div className="min-w-0">
        <h3 className="text-18 leading-6 font-semibold">
          <Link
            href={`/learn/${chapter.slug}`}
            className="text-ink no-underline after:absolute after:inset-0 group-hover:text-accent"
          >
            {chapter.title}
          </Link>
        </h3>
        {chapter.summary ? (
          <p className="mt-1 max-w-[620px] font-serif text-16 leading-6 text-ink-muted">{chapter.summary}</p>
        ) : null}
      </div>
      <ul className="col-start-2 mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-14 text-ink-muted sm:col-start-3 sm:mt-0.5 sm:flex-col sm:items-end sm:gap-y-1.5">
        <li>
          <StatusBadge status={chapter.status} />
        </li>
        <li className="tabular-nums">{chapter.readingMinutes} min read</li>
        {chapter.figureCount > 0 ? (
          <li className="tabular-nums">
            {chapter.figureCount} {chapter.figureCount === 1 ? "figure" : "figures"}
          </li>
        ) : null}
      </ul>
    </li>
  );
}
