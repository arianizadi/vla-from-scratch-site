import type { Metadata } from "next";
import { ChapterRow } from "@/components/curriculum/ChapterRow";
import { listChapters, listParts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Curriculum",
  description:
    "Every chapter of the tutorial in reading order: language models, vision, vision-language models, actions and policies, and how to train and debug them.",
  alternates: { canonical: "/learn" },
};

function readingTime(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.round(minutes / 30) / 2;
  return `${hours} ${hours === 1 ? "hour" : "hours"}`;
}

export default function LearnPage() {
  const parts = listParts();
  const chapters = listChapters();
  const minutes = chapters.reduce((total, chapter) => total + chapter.readingMinutes, 0);

  return (
    <main id="main" tabIndex={-1} className="page-frame pb-8 outline-none">
      <header className="max-w-[680px] pt-10 lg:pt-14">
        <h1 className="text-[2rem] leading-9 font-semibold stretch-90 sm:text-44 sm:leading-[3rem]">Curriculum</h1>
        <p className="mt-4 font-serif text-20 leading-[1.875rem] text-ink-muted">
          {chapters.length > 0 ? (
            <>
              {chapters.length} {chapters.length === 1 ? "chapter" : "chapters"} in {parts.length}{" "}
              {parts.length === 1 ? "part" : "parts"}, about {readingTime(minutes)} of reading. Each chapter
              explains one idea from zero, shows where it lives in the code, and reports what was measured. Read
              them in order, or start at the part you need.
            </>
          ) : (
            <>The chapters are being written. This page lists them as soon as the first one is in.</>
          )}
        </p>
      </header>

      {parts.length > 0 ? (
        <div className="mt-12 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-x-12">
          <nav aria-label="Parts" className="sticky top-20 hidden self-start lg:block">
            <p className="label text-ink-faint">Parts</p>
            <ol className="mt-2 grid gap-0.5">
              {parts.map((part) => (
                <li key={part.id}>
                  <a
                    href={`#${part.id}`}
                    className="flex gap-2 rounded-control py-1.5 text-14 text-ink-muted no-underline hover:text-ink"
                  >
                    <span className="w-4 shrink-0 text-ink-faint tabular-nums">{part.number}</span>
                    <span>{part.name}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="grid max-w-[960px] gap-14">
            {parts.map((part) => (
              <section key={part.id} id={part.id} aria-labelledby={`${part.id}-title`}>
                <h2 id={`${part.id}-title`} className="flex items-baseline gap-3 pb-3 text-28 font-semibold stretch-95">
                  <span className="text-ink-faint tabular-nums">{part.number}</span>
                  <span>{part.name}</span>
                </h2>
                <ol className="border-b border-line">
                  {part.chapters.map((chapter) => (
                    <ChapterRow key={chapter.slug} chapter={chapter} />
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </div>
      ) : null}
    </main>
  );
}
