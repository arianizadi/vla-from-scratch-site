import Link from "next/link";
import type { Part } from "@/lib/content";
import { Stages } from "./Stages";

function partFacts(part: Part): string {
  const minutes = part.chapters.reduce((total, chapter) => total + chapter.readingMinutes, 0);
  const count = part.chapters.length;
  return `${count} ${count === 1 ? "chapter" : "chapters"}, ${minutes} min`;
}

/** What the tutorial covers, built from the chapter files: one row per part. */
export function PartsOverview({ parts }: { parts: Part[] }) {
  return (
    <section aria-labelledby="learn-title" className="page-frame mt-24">
      <div className="max-w-[680px]">
        <h2 id="learn-title" className="text-28 font-semibold stretch-95">
          What you will learn
        </h2>
        <p className="mt-3 font-serif text-18 leading-[1.875rem] text-ink-muted">
          How to build a language model, a vision-language model and a vision-language-action policy, each
          trained from random weights on a single GPU, next to a pretrained VLA for comparison. The chapters
          build the system in the order you would build it yourself, from the first token to a measured success
          rate. Each one explains an idea from zero, points at the code that implements it, and reports what was
          measured.
        </p>
      </div>

      <Stages parts={parts} />

      <h3 className="mt-12 text-20 font-semibold">
        {parts.length > 0 ? `The ${parts.length === 1 ? "part" : `${parts.length} parts`}, in reading order` : "The parts"}
      </h3>
      {parts.length > 0 ? (
        <ol className="mt-4 border-b border-line">
          {parts.map((part) => (
            <li
              key={part.id}
              className="grid gap-x-8 gap-y-3 border-t border-line py-5 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
            >
              <div className="grid grid-cols-[28px_minmax(0,1fr)] content-start gap-x-3">
                <span className="text-20 font-semibold text-ink-faint tabular-nums" aria-hidden="true">
                  {part.number}
                </span>
                <h4 className="text-20 font-semibold">
                  <Link href={`/learn#${part.id}`} className="touch-target text-ink no-underline hover:text-accent">
                    {part.name}
                  </Link>
                </h4>
                <p className="col-start-2 mt-1 text-14 text-ink-muted tabular-nums">{partFacts(part)}</p>
              </div>
              <ul className="grid content-start gap-1.5 pl-10 md:pl-0">
                {part.chapters.map((chapter) => (
                  <li key={chapter.slug} className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-2 text-16">
                    <span className="text-ink-faint tabular-nums" aria-hidden="true">
                      {chapter.orderLabel}
                    </span>
                    <Link href={`/learn/${chapter.slug}`} className="text-link touch-target">
                      {chapter.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 border-y border-line py-5 text-ink-muted">
          The chapters are being written. They are listed here as soon as the first one is in.
        </p>
      )}

      <p className="mt-6">
        <Link href="/learn" className="button">
          Open the curriculum
        </Link>
      </p>
    </section>
  );
}
