import type { Metadata } from "next";
import Link from "next/link";
import { Markdown } from "@/components/markdown/Markdown";
import { NotesNav, type NavGroup } from "@/components/notes/NotesNav";
import {
  Entry,
  EntryIndex,
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
  "What worked, what did not and what we got wrong while training robot policies from scratch: the record of trial and error behind the tutorial.";

export const metadata: Metadata = {
  title: "Field notes",
  description: DESCRIPTION,
  alternates: { canonical: "/notes" },
};

const INDEX_ID = "entries";

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
  if (entries.length > 0) before.push({ id: INDEX_ID, text: "The entries" });
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
        <h1 className="text-[2rem] leading-9 font-semibold stretch-90 sm:text-44 sm:leading-[3rem]">Field notes</h1>
        <p className="mt-4 font-serif text-20 leading-[1.875rem] text-ink-muted">
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
  const firstEntry = notes.sections.findIndex((section) => section.type === "entry");
  const hasQuestions = notes.sections.some((section) => section.type === "questions");

  const rendered = notes.sections.map((section, index) => {
    const key = section.id;
    const indexBefore = index === firstEntry ? <EntryIndex key={INDEX_ID} id={INDEX_ID} entries={entries} context={context} /> : null;
    let block: React.ReactNode;
    if (section.type === "summary") block = <SummaryLedger key={key} section={section} context={context} entries={byNumber} />;
    else if (section.type === "entry") block = <Entry key={key} entry={section} context={context} />;
    else
      block = (
        <TextBlock key={key} section={section} context={context}>
          {section.type === "questions" ? <StillRunning /> : null}
        </TextBlock>
      );
    return indexBefore ? [indexBefore, block] : [block];
  });

  return (
    <div className="page-frame lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-x-12 xl:grid-cols-[272px_minmax(0,960px)]">
      <NotesNav groups={navGroups(notes.sections)} title={notes.title || "Field notes"} />
      <main id="main" tabIndex={-1} className="min-w-0 pb-8 outline-none">
        <article className="notes">
          <header className="max-w-[680px] pt-8 lg:pt-12">
            <h1 className="text-[2rem] leading-9 font-semibold text-balance stretch-90 sm:text-44 sm:leading-[3rem]">
              {notes.title || "Field notes"}
            </h1>
            <p className="mt-4 font-serif text-20 leading-[1.875rem] text-ink-muted">
              What worked, what did not and what we got wrong while training robot policies from scratch. Read the
              three summaries and the short version first; each line links to the entry with the measurements behind it.
            </p>
            <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-14 text-ink-muted">
              <li>Updated as runs finish</li>
              <li>
                <Link href="/lab" className="text-link">
                  Lab notebook
                </Link>
              </li>
              <li>
                <a href={repoUrl(NOTES_REPO_PATH)} className="text-link">
                  View source on GitHub
                </a>
              </li>
            </ul>
          </header>

          {notes.intro.trim() ? (
            <aside aria-label="How to read these notes" className="notes-intro">
              <div className="prose notes-intro-text">
                <Markdown tree={renderBlock(notes.intro, context)} />
              </div>
              <Key />
            </aside>
          ) : (
            <aside aria-label="Key to the stamps" className="notes-intro">
              <Key />
            </aside>
          )}

          <div className="notes-sections">{rendered.flat()}</div>

          <section aria-labelledby="further" className="notes-further">
            <SectionHead id="further" text="Where to go next">
              Where to go next
            </SectionHead>
            <ul className="notes-further-links">
              <li>
                <Link href="/lab" className="text-link">
                  The lab notebook
                </Link>
                <span className="text-ink-muted">: every measurement behind these notes, with its conditions.</span>
              </li>
              <li>
                <Link href="/learn" className="text-link">
                  The chapters
                </Link>
                <span className="text-ink-muted">: each idea explained from the ground up, with the measurements in place.</span>
              </li>
            </ul>
            {!hasQuestions ? <StillRunning /> : null}
          </section>
        </article>
      </main>
    </div>
  );
}
