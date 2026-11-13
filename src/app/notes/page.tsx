import type { Metadata } from "next";
import Link from "next/link";
import { Markdown } from "@/components/markdown/Markdown";
import { NotesNav, type NavGroup } from "@/components/notes/NotesNav";
import { Reveal } from "@/components/ui/Reveal";
import {
  Entry,
  SectionHead,
  StillRunning,
  SummaryLedger,
  TextBlock,
} from "@/components/notes/NotesSections";
import { loadNotes, NOTES_REPO_PATH, type EntrySection, type NotesSection } from "@/components/notes/notes";
import { renderBlock, type RenderContext } from "@/components/notes/render";
import { STATUS, STATUS_ORDER, StatusGlyph } from "@/components/notes/StatusStamp";
import { repoUrl } from "@/lib/site";
import "@/components/notes/notes.css";

const DESCRIPTION =
  "What worked, what did not and what we got wrong while teaching a robot arm to pick things up: each lesson learned in one plain line, the full story one click away.";

export const metadata: Metadata = {
  title: "Field notes",
  description: DESCRIPTION,
  alternates: { canonical: "/notes" },
};

function navGroups(sections: NotesSection[]): NavGroup[] {
  const before: NavGroup["items"] = [];
  const entries: NavGroup["items"] = [];
  const after: NavGroup["items"] = [];
  for (const section of sections) {
    if (section.type === "entry") {
      entries.push({ id: section.id, text: section.text, number: section.number, status: section.status.map((part) => part.kind) });
    } else {
      (entries.length === 0 ? before : after).push({ id: section.id, text: section.text });
    }
  }
  return [
    { label: "Overview", items: before },
    { label: "Entries", items: entries },
    { label: "Then", items: after },
  ].filter((group) => group.items.length > 0);
}

function Key() {
  return (
    <dl className="notes-key">
      {STATUS_ORDER.map((kind) => (
        <div key={kind}>
          <dt className={`notes-stamp ${STATUS[kind].tone}`}>
            <StatusGlyph kind={kind} />
            <span className="notes-stamp-word">{STATUS[kind].label}</span>
          </dt>
          <dd>{STATUS[kind].meaning}</dd>
        </div>
      ))}
    </dl>
  );
}

function Missing() {
  return (
    <main id="main" tabIndex={-1} className="page-frame pb-8 outline-none">
      <div className="max-w-[680px] pt-10 lg:pt-14">
        <h1 className="page-title">Field notes</h1>
        <p className="page-lead">
          The notes have not been copied into the site yet. Run <code>npm run sync:content</code> to copy them from
          the tutorial, or read them{" "}
          <a href={repoUrl(NOTES_REPO_PATH)} className="text-link">
            in the repository
          </a>
          .
        </p>
      </div>
    </main>
  );
}

export default function NotesPage() {
  const notes = loadNotes();
  if (!notes) return <Missing />;

  const entries = notes.sections.filter((section): section is EntrySection => section.type === "entry");
  const byNumber = new Map(entries.map((entry) => [entry.number, entry]));
  const context: RenderContext = { entries: new Set(byNumber.keys()) };
  const hasQuestions = notes.sections.some((section) => section.type === "questions");

  const rendered = notes.sections.map((section) => {
    const key = section.id;
    let block: React.ReactNode;
    if (section.type === "summary") block = <SummaryLedger key={key} section={section} context={context} entries={byNumber} />;
    else if (section.type === "entry") block = <Entry key={key} entry={section} context={context} />;
    else
      block = (
        <TextBlock key={key} section={section} context={context}>
          {section.type === "questions" ? <StillRunning /> : null}
        </TextBlock>
      );
    return [block];
  });

  return (
    <div className="page-frame lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-x-12 xl:grid-cols-[272px_minmax(0,960px)]">
      <NotesNav groups={navGroups(notes.sections)} title={notes.title || "Field notes"} />
      <main id="main" tabIndex={-1} className="min-w-0 pb-8 outline-none">
        <article className="notes">
          <header className="max-w-[680px] pt-8 lg:pt-12">
            <h1 className="page-title">
              {notes.title || "Field notes"}
            </h1>
            <p className="page-lead">
              What worked, what did not and what we got wrong while teaching a robot arm to pick things up. Each note
              in one plain line; open it for the full story and the measurements.
            </p>
            <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-14 text-ink-muted">
              <li>Part of the experiments behind the lessons</li>
              <li>
                <Link href="/lab" className="text-link">
                  Experiments
                </Link>
              </li>
              <li>
                <a href={repoUrl(NOTES_REPO_PATH)} className="text-link">
                  View source on GitHub
                </a>
              </li>
            </ul>
          </header>

          <aside aria-label="How to read these notes" className="notes-intro notes-intro-folded">
            <Reveal label="How to read these notes" openLabel="Hide how to read these notes" kind="text">
              {notes.intro.trim() ? (
                <div className="prose notes-intro-text">
                  <Markdown tree={renderBlock(notes.intro, context)} />
                </div>
              ) : null}
              <Key />
            </Reveal>
          </aside>

          <div className="notes-sections">{rendered.flat()}</div>

          <section aria-labelledby="further" className="notes-further">
            <SectionHead id="further" text="Where to go next">
              Where to go next
            </SectionHead>
            <ul className="notes-further-links">
              <li>
                <Link href="/lab" className="text-link">
                  The experiments
                </Link>
                <span className="text-ink-muted">: every finding behind these notes, in plain words, with its numbers.</span>
              </li>
              <li>
                <Link href="/learn" className="text-link">
                  The course
                </Link>
                <span className="text-ink-muted">: each idea explained in a short lesson with an animation.</span>
              </li>
            </ul>
            {!hasQuestions ? <StillRunning /> : null}
          </section>
        </article>
      </main>
    </div>
  );
}
