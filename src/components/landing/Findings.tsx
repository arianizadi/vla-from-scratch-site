import Link from "next/link";
import { Glyph } from "@/components/ui/Glyph";
import type { ChapterMeta } from "@/lib/content";
import { resultsHref, sectionWords, smallerStatements, statements, withoutRecoveries } from "./statements";

/** "Chapter 52: History and the Shortcut It Opens", or nothing while the chapter is not in the site. */
function ChapterLink({ chapter }: { chapter?: ChapterMeta }) {
  if (!chapter) return null;
  return (
    <Link href={`/learn/${chapter.slug}`} className="text-link">
      Chapter {chapter.orderLabel}: {chapter.title}
    </Link>
  );
}

/** What the measurements showed, a statement each, with the chapter that explains it and the results behind it. */
export function Findings({ chapters }: { chapters: ChapterMeta[] }) {
  const bySlug = (slug: string) => chapters.find((chapter) => chapter.slug === slug);
  const extra: Record<string, string | undefined> = { "self-correction": withoutRecoveries() };

  return (
    <section aria-labelledby="findings-title" className="page-frame mt-24">
      <div className="max-w-[680px]">
        <h2 id="findings-title" className="text-28 font-semibold stretch-95">
          What the measurements showed
        </h2>
        <p className="mt-3 font-serif text-18 leading-[1.875rem] text-ink-muted">
          Most write-ups of robot learning show the run that worked. A policy can reach a low training loss and
          still never succeed, and nothing in the logs says why. These are the findings the runs here
          support, each with the chapter that explains it and the results it rests on. Success is closed-loop,
          on layouts the policy never saw, one training seed per run.
        </p>
      </div>

      <ol className="mt-8 grid border-t border-line lg:grid-cols-2 lg:gap-x-12">
        {statements.map((statement, index) => (
          <li key={statement.id} className="border-b border-line py-6">
            <article aria-labelledby={`finding-${statement.id}`}>
              <h3
                id={`finding-${statement.id}`}
                className="grid grid-cols-[28px_minmax(0,1fr)] text-20 leading-[1.625rem] font-semibold"
              >
                <span className="text-ink-faint tabular-nums" aria-hidden="true">
                  {index + 1}
                </span>
                <span>{statement.title}</span>
              </h3>
              <div className="mt-2 pl-7">
                <p className="max-w-[620px] font-serif text-16 leading-[1.625rem] text-ink-muted sm:text-18 sm:leading-[1.75rem]">
                  {statement.text}
                  {extra[statement.id] ? ` ${extra[statement.id]}` : null}
                </p>
                <ul className="mt-3 flex flex-col gap-1.5 text-14">
                  {bySlug(statement.chapter) ? (
                    <li>
                      <ChapterLink chapter={bySlug(statement.chapter)} />
                    </li>
                  ) : null}
                  <li className="flex items-center gap-1.5">
                    <Glyph name="square-filled" className="text-ink-faint" />
                    <span className="sr-only">Measured here:</span>
                    <Link href={resultsHref(statement.section)} className="text-link">
                      Results: {sectionWords(statement.section)}
                    </Link>
                  </li>
                </ul>
              </div>
            </article>
          </li>
        ))}
      </ol>

      {smallerStatements.length > 0 ? (
        <div className="mt-8 max-w-[960px]">
          <h3 className="text-18 font-semibold">Smaller results</h3>
          <ul className="mt-3 grid gap-3">
            {smallerStatements.map((statement) => (
              <li key={statement.id} className="font-serif text-16 leading-6 text-ink-muted">
                {statement.text}{" "}
                <span className="font-sans text-14">
                  {bySlug(statement.chapter) ? (
                    <>
                      <ChapterLink chapter={bySlug(statement.chapter)} />
                      {"; "}
                    </>
                  ) : null}
                  <Link href={resultsHref(statement.section)} className="text-link">
                    results
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
