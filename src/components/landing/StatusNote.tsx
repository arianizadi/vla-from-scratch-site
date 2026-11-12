import { Glyph } from "@/components/ui/Glyph";
import { runsInProgress } from "@/data/lab";
import type { ChapterMeta } from "@/lib/content";
import { repoUrl } from "@/lib/site";

function draftSentence(chapters: ChapterMeta[]): string {
  const drafts = chapters.filter((chapter) => chapter.status === "draft").length;
  if (chapters.length === 0) return "The chapters are being written.";
  if (drafts === 0) return "The chapters are written; the figures and the lab page are still being built.";
  const count =
    drafts === chapters.length
      ? chapters.length === 1
        ? "The one chapter so far is a draft"
        : `All ${chapters.length} chapters are drafts`
      : `${drafts} of the ${chapters.length} chapters are drafts`;
  return `${count}, and the text and the figures are still changing.`;
}

/** The state of the tutorial, said once and plainly, right under the hero. */
export function StatusNote({ chapters }: { chapters: ChapterMeta[] }) {
  return (
    <section aria-labelledby="status-title" className="page-frame mt-14">
      <div className="grid max-w-[960px] gap-x-6 gap-y-2 border-l-2 border-line-strong py-1 pl-4 sm:grid-cols-[auto_minmax(0,1fr)]">
        <h2 id="status-title" className="label inline-flex items-center gap-1.5 self-start pt-1 text-warning">
          <Glyph name="clock" />
          Work in progress
        </h2>
        <p className="font-serif text-16 leading-6 text-ink-muted">
          {draftSentence(chapters)} {runsInProgress} What comes next is in the{" "}
          <a href={repoUrl("tutorial/roadmap.md")} className="text-link">
            roadmap
          </a>
          .
        </p>
      </div>
    </section>
  );
}
