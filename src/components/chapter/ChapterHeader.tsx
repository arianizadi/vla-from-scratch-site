import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ChapterMeta } from "@/lib/content";

interface ChapterHeaderProps {
  chapter: ChapterMeta;
  /** Address of the chapter file's editor on GitHub; omitted for files that are not in the tutorial repository. */
  editUrl?: string;
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/** Order number, part, title, the summary as a lead, then the chapter's facts. */
export function ChapterHeader({ chapter, editUrl }: ChapterHeaderProps) {
  return (
    <header className="max-w-[680px] pt-8 lg:pt-12">
      <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-display text-44 font-bold text-ink-faint tabular-nums" aria-hidden="true">
          {chapter.orderLabel}
        </span>
        <Link href={`/learn#${chapter.part.id}`} className="label text-ink-muted hover:text-ink">
          Part {chapter.part.number}: {chapter.part.name}
        </Link>
      </p>
      <h1 className="page-title mt-2">
        {chapter.title}
      </h1>
      {chapter.summary ? (
        <p className="page-lead">{chapter.summary}</p>
      ) : null}
      <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-14 text-ink-muted">
        <li>
          <StatusBadge status={chapter.status} />
        </li>
        <li>{chapter.readingMinutes} min read</li>
        {chapter.figureCount > 0 ? <li>{plural(chapter.figureCount, "figure")}</li> : null}
        {editUrl ? (
          <li>
            <a href={editUrl} className="text-link">
              View source on GitHub
            </a>
          </li>
        ) : null}
      </ul>
    </header>
  );
}
