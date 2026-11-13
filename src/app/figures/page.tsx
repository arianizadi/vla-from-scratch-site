import type { Metadata } from "next";
import Link from "next/link";
import {
  FIGURES,
  FIGURE_IDS,
  STAMP_LABEL,
  STAMP_MEANING,
  isFigureId,
  showsSentence,
  type FigureId,
  type Stamp,
} from "@/figures/catalog";
import { FigureMount } from "@/figures/FigureMount";
import { KitSpecimen, StampMark } from "@/figures/kit";
import { listFigureUses, type FigureUse } from "@/lib/content";
import { courseTitle } from "@/lib/course";

export const metadata: Metadata = {
  title: "Interactive figures",
  description: "Every interactive figure of the tutorial on one page, with the captions the chapters give it.",
  alternates: { canonical: "/figures" },
  // A review page: reachable from the footer, not offered to search engines.
  robots: { index: false },
};

const STAMPS: Stamp[] = ["measured", "computed", "schematic"];

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function FigureSection({ id, uses }: { id: FigureId; uses: FigureUse[] }) {
  const info = FIGURES[id];
  // The figure is shown with a caption a chapter really gives it, when there is one.
  const caption = uses.find((use) => use.caption)?.caption ?? showsSentence(id);

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="border-t border-line pt-6">
      <header className="mb-5 max-w-[680px]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 id={`${id}-title`} className="text-24 font-semibold stretch-95">
            {info.title}
          </h2>
          <code className="rounded-plate bg-surface-2 px-1.5 py-0.5 font-mono text-13">{id}</code>
          <StampMark stamp={info.stamp} />
        </div>
        <p className="mt-2 font-serif text-16 leading-6 text-ink-muted">{showsSentence(id)}</p>
      </header>

      <FigureMount id={id} caption={caption} />

      <div className="mt-4 text-14 text-ink-muted">
        {uses.length > 0 ? (
          <>
            <h3 className="label text-ink-faint">Embedded {uses.length === 1 ? "once" : `${uses.length} times`} in the chapters</h3>
            <ul className="mt-2 grid gap-2">
              {uses.map((use) => (
                <li key={use.href} className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-3">
                  <span className="text-ink-faint tabular-nums">Fig. {use.number}</span>
                  <span>
                    <Link href={use.href} className="text-link">
                      {courseTitle(use.chapter)}
                    </Link>
                    {use.caption ? <span className="mt-0.5 block max-w-[680px]">{use.caption}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>No chapter embeds this figure yet. The caption above is the figure&rsquo;s description.</p>
        )}
      </div>
    </section>
  );
}

export default function FiguresPage() {
  const uses = listFigureUses();
  const byId = new Map<FigureId, FigureUse[]>(FIGURE_IDS.map((id) => [id, []]));
  const unknown: FigureUse[] = [];
  for (const use of uses) {
    if (isFigureId(use.id)) byId.get(use.id)?.push(use);
    else unknown.push(use);
  }
  const embedded = FIGURE_IDS.filter((id) => (byId.get(id)?.length ?? 0) > 0).length;

  return (
    <main id="main" tabIndex={-1} className="page-frame pb-8 outline-none">
      <header className="page-header max-w-[760px]">
        <h1 className="page-title">Interactive figures</h1>
        <p className="page-lead">
          Every interactive figure, on one page. Each one is a small tool: change its inputs and watch what moves.
          The full chapters embed them where they explain something.
        </p>
        <p className="mt-4 text-14 text-ink-muted tabular-nums">
          {plural(FIGURE_IDS.length, "figure")}, {embedded} of them embedded in the chapters, {plural(uses.length, "use")}{" "}
          in all.
        </p>
        <dl className="mt-4 grid gap-1.5 text-14 text-ink-muted">
          {STAMPS.map((stamp) => (
            <div key={stamp} className="flex flex-wrap items-baseline gap-x-2">
              <dt className="min-w-[96px]">
                <StampMark stamp={stamp} className="text-ink" />
              </dt>
              <dd>
                <span className="sr-only">{STAMP_LABEL[stamp]}: </span>
                {STAMP_MEANING[stamp]}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="mt-10 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-x-12">
        <nav aria-label="Figures" className="mb-8 self-start lg:sticky lg:top-20 lg:mb-0">
          <p className="label text-ink-faint">Figures</p>
          <ol className="mt-2 flex flex-wrap gap-x-4 gap-y-1 lg:grid lg:gap-0.5">
            {FIGURE_IDS.map((id) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="touch-target inline-flex rounded-control py-1 font-mono text-13 text-ink-muted no-underline hover:text-ink"
                >
                  {id}
                </a>
              </li>
            ))}
            <li className="lg:mt-3 lg:border-t lg:border-line lg:pt-3">
              <a href="#kit" className="touch-target inline-flex rounded-control py-1 text-14 text-ink-muted no-underline hover:text-ink">
                Kit specimen
              </a>
            </li>
          </ol>
        </nav>

        <div className="grid min-w-0 max-w-[960px] grid-cols-[minmax(0,1fr)] gap-12">
          {FIGURE_IDS.map((id) => (
            <FigureSection key={id} id={id} uses={byId.get(id) ?? []} />
          ))}

          <section id="kit" aria-labelledby="kit-title" className="border-t border-line pt-6">
            <header className="mb-5 max-w-[680px]">
              <h2 id="kit-title" className="text-24 font-semibold stretch-95">
                Kit specimen
              </h2>
              <p className="mt-2 font-serif text-16 leading-6 text-ink-muted">
                Not a figure of the tutorial: one frame holding every part of the figure kit, so the controls and
                the chart primitives can be reviewed with the figures. Its source,{" "}
                <code className="rounded-plate bg-surface-2 px-1.5 py-0.5 font-mono text-13">src/figures/kit/Specimen.tsx</code>,
                is the starting point for a new figure.
              </p>
            </header>
            <KitSpecimen caption="Play, step, drag the slider, switch the line and the gridlines. Everything works from the keyboard, and with reduced motion the Play button is gone while the rest still responds at once." />
          </section>

          {unknown.length > 0 ? (
            <section aria-labelledby="unknown-title" className="border-t border-line pt-6">
              <h2 id="unknown-title" className="text-24 font-semibold stretch-95">
                Ids that are not in the list
              </h2>
              <p className="mt-2 max-w-[680px] font-serif text-16 leading-6 text-ink-muted">
                These chapters ask for a figure id that the style guide does not define. Each is shown as an empty
                frame with the chapter&rsquo;s description.
              </p>
              <ul className="mt-3 grid gap-2 text-14 text-ink-muted">
                {unknown.map((use) => (
                  <li key={use.href}>
                    <code className="rounded-plate bg-surface-2 px-1.5 py-0.5 font-mono text-13">{use.id}</code>{" "}
                    <Link href={use.href} className="text-link">
                      Fig. {use.number}, {courseTitle(use.chapter)}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
