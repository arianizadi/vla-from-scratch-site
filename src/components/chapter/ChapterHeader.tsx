import type { ChapterMeta } from "@/lib/content";

interface ChapterHeaderProps {
  chapter: ChapterMeta;
  /** The title the course gives the chapter. */
  title: string;
  /** Address of the chapter file's editor on GitHub; omitted for files that are not in the tutorial repository. */
  editUrl?: string;
}

/** "Technical details", the title, the chapter's goal as a lead, then its reading time and source. */
export function ChapterHeader({ chapter, title, editUrl }: ChapterHeaderProps) {
  return (
    <header className="max-w-[680px] pt-8 lg:pt-10">
      <p className="technical-kicker">Technical details</p>
      <h1 className="page-title mt-3">{title}</h1>
      {chapter.summary ? <p className="page-lead">{chapter.summary}</p> : null}
      <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-14 text-ink-muted">
        <li>{chapter.readingMinutes} min read</li>
        <li>Code and tables are folded: open the ones you need</li>
        {editUrl ? (
          <li>
            <a href={editUrl} className="text-link">
              Source on GitHub
            </a>
          </li>
        ) : null}
      </ul>
    </header>
  );
}
