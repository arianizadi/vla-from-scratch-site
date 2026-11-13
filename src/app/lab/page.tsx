import type { Metadata } from "next";
import Link from "next/link";
import { BackbonesSection, DemonstrationsSection, OutsideSection, PositionFixSection } from "@/components/lab/AfterFix";
import { DependsOnSection, HeadlineSection, HistorySection, TaskSection, type ChapterFor } from "@/components/lab/BeforeFix";
import { FlowerSection, flowerRunsInProgress } from "@/components/lab/Flower";
import { LabGlance } from "@/components/lab/LabGlance";
import { LabContents, LabSidebar } from "@/components/lab/LabNav";
import { RecordsSection, SamplerSection, ToleranceSection } from "@/components/lab/Reference";
import { SECTIONS, SECTION_LIST } from "@/components/lab/sections";
import { laterMachinesSentence } from "@/components/lab/shared";
import styles from "@/components/lab/styles";
import "@/components/lab/lab.css";
import { conventions } from "@/data/lab";
import { MACHINES } from "@/data/labels";
import { evaluationDefaults, exportedAt, unfinishedRuns, awaitedRuns } from "@/data/runs";
import { Reveal } from "@/components/ui/Reveal";
import { getChapter } from "@/lib/content";
import { courseTitle } from "@/lib/course";
import { repoUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Experiments",
  description:
    "The experiments behind the lessons: what we tried while teaching a robot arm to pick up what it is asked for, what happened, and why it matters. Each finding in plain words, the numbers one click away.",
  alternates: { canonical: "/lab" },
};

/** A chapter link, when the chapter is on the site; resolved at build time. */
const chapter: ChapterFor = (slug) => {
  const found = getChapter(slug);
  return found && !found.isSample ? { href: `/learn/${found.slug}`, title: courseTitle(found) } : null;
};

/** The date of the data, written out in UTC so that it reads the same everywhere. */
function dataDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

export default function LabPage() {
  const running = unfinishedRuns().length + awaitedRuns().length;
  const seedStart = new Intl.NumberFormat("en-US").format(evaluationDefaults.seedStart);

  return (
    <main id="main" tabIndex={-1} className="page-frame pb-16 outline-none">
      <div className={`${styles.layout} pt-2`}>
        <LabSidebar sections={SECTION_LIST} />

        <div className="min-w-0">
          <header className="page-header max-w-[760px]">
            <h1 className="page-title">Experiments</h1>
            <p className="page-lead">
              The experiments behind the lessons: what we tried while teaching a robot arm to pick up what it is asked
              for, what happened, and why it matters. Optional reading; the lessons stand on their own.
            </p>
            <p className="mt-4 text-15 text-ink-muted">
              Each finding is in plain words first. Open &ldquo;Show the numbers&rdquo; under it for the measurements.
              Also see the{" "}
              <Link href="/notes" className="text-link">
                field notes
              </Link>
              : what worked and what did not.
            </p>
          </header>

          <LabGlance />

          <LabContents sections={SECTION_LIST} />

          <section aria-labelledby="conventions-title" className="mt-8 max-w-[760px]">
            <h2 id="conventions-title" className="sr-only">
              How these were measured
            </h2>
            <Reveal label="How these were measured" openLabel="Hide how these were measured" kind="text">
              <p className="text-14 text-ink-muted">
                Data exported <time dateTime={exportedAt}>{dataDate(exportedAt)}</time>.{" "}
                {running > 0
                  ? `${running} run${running === 1 ? " is" : "s are"} still in progress and shown without a value. `
                  : flowerRunsInProgress > 0
                    ? ""
                    : "No run is in progress. "}
                {flowerRunsInProgress > 0
                  ? `${flowerRunsInProgress} run${flowerRunsInProgress === 1 ? "" : "s"} toward flower trimming ${flowerRunsInProgress === 1 ? "is" : "are"} still in progress, marked in section ${SECTIONS.flower.number}. `
                  : null}
                Source:{" "}
                <a href={repoUrl("tutorial/lab-notebook.md")} className="text-link">
                  the lab notebook in the repository
                </a>
                .
              </p>
              <ul className="mt-3 grid list-disc gap-1.5 pl-5 font-serif text-16 leading-6 text-ink marker:text-ink-faint">
                <li>{conventions}</li>
                <li>
                  An evaluation is {evaluationDefaults.episodes} layouts the policy never saw (seeds from {seedStart}{" "}
                  on), closed loop at {evaluationDefaults.controlHz} Hz, unless a table says otherwise.
                </li>
                <li>
                  &ldquo;Trained / averaged&rdquo;: the trained weights and their running average, saved by the same
                  run and evaluated on the same layouts. A dash: not saved, not run, or not reported.
                </li>
                <li>
                  Hardware: {MACHINES.A.label} and {MACHINES.B.label}. {laterMachinesSentence()}
                </li>
                <li>
                  A run still training has no final value: its row is hatched and marked in progress, with what it has
                  reported so far where the notebook gives that.
                </li>
              </ul>
            </Reveal>
          </section>

          <TaskSection chapter={chapter} />
          <HeadlineSection chapter={chapter} />
          <HistorySection chapter={chapter} />
          <DependsOnSection chapter={chapter} />
          <PositionFixSection chapter={chapter} />
          <DemonstrationsSection chapter={chapter} />
          <OutsideSection chapter={chapter} />
          <BackbonesSection chapter={chapter} />
          <FlowerSection chapter={chapter} />
          <SamplerSection chapter={chapter} />
          <ToleranceSection chapter={chapter} />
          <RecordsSection chapter={chapter} />
        </div>
      </div>
    </main>
  );
}
