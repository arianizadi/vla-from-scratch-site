import type { Metadata } from "next";
import { ChapterRow } from "@/components/curriculum/ChapterRow";
import { PartFilter } from "@/components/curriculum/PartFilter";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { listChapters, listParts } from "@/lib/content";
import { lessonIdeas } from "@/lessons";

export const metadata: Metadata = {
  title: "Learn",
  description:
    "Every chapter in reading order: language models, vision, vision-language models, actions and policies, and how to train and debug them.",
  alternates: { canonical: "/learn" },
};

export default async function LearnPage() {
  const parts = listParts();
  const chapters = listChapters();
  const ideas = await lessonIdeas();
  // While every chapter has one status, the page says it once instead of badging every row.
  const statuses = [...new Set(chapters.map((chapter) => chapter.status))];
  const shared = statuses.length === 1 ? statuses[0] : undefined;
  const lessons = chapters.filter((chapter) => ideas.has(chapter.slug)).length;

  return (
    <main id="main" tabIndex={-1} className="page-frame pb-8 outline-none">
      <header className="learn-header">
        <h1 className="learn-title">Learn</h1>
        <p className="learn-lead">
          {chapters.length > 0 ? (
            <>
              {chapters.length} chapters in {parts.length} parts, in the order you would build the system yourself. Read
              them in order, or jump to the part you need.
            </>
          ) : (
            <>The chapters are being written. This page lists them as soon as the first one is in.</>
          )}
        </p>
        {chapters.length > 0 ? (
          <ul className="learn-facts">
            {lessons > 0 ? (
              <li>
                <span className="part-chapter-dot" aria-hidden="true" />
                {lessons} animated {lessons === 1 ? "lesson" : "lessons"}
              </li>
            ) : null}
            {shared && chapters.length > 1 ? (
              <li>
                <StatusBadge status={shared} />
                <span>every chapter, for now</span>
              </li>
            ) : null}
          </ul>
        ) : null}
      </header>

      {parts.length > 0 ? (
        <div className="mt-12 lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-x-12 xl:grid-cols-[256px_minmax(0,1fr)] xl:gap-x-16">
          <nav aria-label="Parts" className="sticky top-24 hidden self-start lg:block">
            <ol className="learn-parts-nav">
              {parts.map((part) => (
                <li key={part.id}>
                  <a href={`#${part.id}`}>
                    <span className="learn-parts-number" aria-hidden="true">
                      {part.number}
                    </span>
                    <span>{part.name}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <PartFilter parts={parts.map((part) => ({ id: part.id, number: part.number, name: part.name }))}>
            {parts.map((part) => (
              <section key={part.id} id={part.id} aria-labelledby={`${part.id}-title`}>
                <h2 id={`${part.id}-title`} className="learn-part-title">
                  <span className="learn-part-number" aria-hidden="true">
                    {part.number}
                  </span>
                  <span>{part.name}</span>
                </h2>
                <ol className="chapter-rows">
                  {part.chapters.map((chapter) => (
                    <ChapterRow key={chapter.slug} chapter={chapter} lesson={ideas.get(chapter.slug)} showStatus={!shared} />
                  ))}
                </ol>
              </section>
            ))}
          </PartFilter>
        </div>
      ) : null}
    </main>
  );
}
