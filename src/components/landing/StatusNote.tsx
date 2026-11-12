import { Glyph } from "@/components/ui/Glyph";
import { awaitedRuns, unfinishedRuns } from "@/data/runs";
import type { ChapterMeta } from "@/lib/content";
import { repoUrl } from "@/lib/site";

function draftSentence(chapters: ChapterMeta[]): string {
  const drafts = chapters.filter((chapter) => chapter.status === "draft").length;
  if (chapters.length === 0) return "The chapters are being written.";
  if (drafts === 0) return "The chapters are written; the figures and the results page are still being built.";
  const count =
    drafts === chapters.length
      ? chapters.length === 1
        ? "The one chapter so far is a draft"
        : `All ${chapters.length} chapters are drafts`
      : `${drafts} of the ${chapters.length} chapters are drafts`;
  return `${count}, and the text and the figures are still changing.`;
}

/** The runs the data lists as in progress, by their labels; empty once every run has a result. */
function runsSentence(): string {
  const labels = [...new Set([...unfinishedRuns(), ...awaitedRuns()].map((entry) => entry.label))];
  if (labels.length === 0) return "";
  const list = labels.length === 1 ? labels[0] : `${labels.slice(0, -1).join("; ")}; and ${labels[labels.length - 1]}`;
  const subject = labels.length === 1 ? "One run is" : `${labels.length} runs are`;
  return `${subject} still training, and shown without a result until the lab notebook reports ${labels.length === 1 ? "it" : "them"}: ${list}.`;
}

/** The state of the tutorial, said once and plainly, right under the hero. */
export function StatusNote({ chapters }: { chapters: ChapterMeta[] }) {
  const runs = runsSentence();
  return (
    <section aria-labelledby="status-title" className="page-frame mt-14">
      <div className="grid max-w-[960px] gap-x-6 gap-y-2 border-l-2 border-line-strong py-1 pl-4 sm:grid-cols-[auto_minmax(0,1fr)]">
        <h2 id="status-title" className="label inline-flex items-center gap-1.5 self-start pt-1 text-warning">
          <Glyph name="clock" />
          Work in progress
        </h2>
        <p className="font-serif text-16 leading-6 text-ink-muted">
          {draftSentence(chapters)} {runs ? `${runs} ` : ""}What comes next is in the{" "}
          <a href={repoUrl("tutorial/roadmap.md")} className="text-link">
            roadmap
          </a>
          .
        </p>
      </div>
    </section>
  );
}
