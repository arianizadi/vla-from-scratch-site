import Link from "next/link";
import { Markdown } from "@/components/markdown/Markdown";
import { Glyph, type GlyphName } from "@/components/ui/Glyph";
import { RUN_FAMILIES } from "@/data/labels";
import { awaitedRuns, exportedAt, unfinishedRuns } from "@/data/runs";
import type { EntrySection, StatusKind, SummarySection, SummaryTone, TextSection } from "./notes";
import { renderBlock, renderInline, type RenderContext } from "./render";
import { STATUS, STATUS_ORDER, StatusGlyph, StatusStamp } from "./StatusStamp";

// ---------------------------------------------------------------- shared

/** The permalink beside a heading: outside it, so the heading's name is its text alone. */
function Anchor({ id, label }: { id: string; label: string }) {
  return (
    <a href={`#${id}`} className="notes-anchor" aria-label={`Link to section: ${label}`}>
      #
    </a>
  );
}

interface SectionHeadProps {
  id: string;
  /** Plain text of the heading, for the anchor's name. */
  text: string;
  children: React.ReactNode;
  /** Shown in the gutter on wide screens, above the title on narrow ones. */
  number?: number;
  /** Stamps or notes beside the heading: in the margin column from 1344px. */
  aside?: React.ReactNode;
  /** 3 for the entries, which sit under "The entries"; 2 otherwise. */
  level?: 2 | 3;
}

/** An h2 under a hairline, like a chapter's section heading. */
export function SectionHead({ id, text, children, number, aside, level = 2 }: SectionHeadProps) {
  const Tag = level === 3 ? "h3" : "h2";
  return (
    <div className="notes-head">
      <div className="notes-headrow">
        <Tag id={id} className="notes-heading">
          {number !== undefined ? (
            <span className="notes-number">
              <span className="sr-only">Entry </span>
              {number}
              <span className="sr-only">: </span>
            </span>
          ) : null}
          {children}
        </Tag>
        <Anchor id={id} label={text} />
      </div>
      {aside ? <div className="notes-aside">{aside}</div> : null}
    </div>
  );
}

/** The entries an item points to, each linked when the page has it. */
function EntryRefs({
  numbers,
  fallback,
  entries,
}: {
  numbers: number[];
  fallback: string;
  entries: ReadonlyMap<number, EntrySection>;
}) {
  if (numbers.length === 0) return fallback ? <>{fallback}</> : null;
  return (
    <>
      {numbers.map((number, index) => {
        const entry = entries.get(number);
        const others = (entry?.status ?? []).map((part) => part.kind).filter((kind) => kind !== "confirmed");
        return (
          <span key={`${number}-${index}`} className="whitespace-nowrap">
            {index > 0 ? ", " : null}
            {entry ? (
              <a href={`#${entry.id}`} className="text-link" aria-label={`Entry ${number}: ${entry.text}`}>
                {number}
              </a>
            ) : (
              number
            )}
            {[...new Set(others)].map((kind) => (
              <span key={kind} className={`ml-1 inline-flex align-[-1px] ${STATUS[kind].tone}`}>
                <StatusGlyph kind={kind} />
                <span className="sr-only"> ({STATUS[kind].label.toLowerCase()})</span>
              </span>
            ))}
          </span>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------- summary

const TONE: Record<SummaryTone, { glyph?: GlyphName; tone: string }> = {
  worked: { glyph: "check", tone: "text-success" },
  failed: { glyph: "cross", tone: "text-failure" },
  wrong: { glyph: "replay", tone: "text-ink-muted" },
  neutral: { tone: "text-ink-muted" },
};

/** A summary table as a ledger: one row per item, what and evidence side by side, then its entries. */
export function SummaryLedger({
  section,
  context,
  entries,
}: {
  section: SummarySection;
  context: RenderContext;
  entries: ReadonlyMap<number, EntrySection>;
}) {
  const tone = TONE[section.tone];
  const [whatColumn, ...otherColumns] = section.columns;
  return (
    <section aria-labelledby={section.id} className="notes-summary">
      <SectionHead id={section.id} text={section.text}>
        {tone.glyph ? (
          <span className={`notes-tone ${tone.tone}`}>
            <Glyph name={tone.glyph} size={18} />
          </span>
        ) : null}
        <Markdown tree={renderInline(section.title, context)} />
      </SectionHead>

      <div className="notes-ledger" style={{ "--columns": otherColumns.length } as React.CSSProperties}>
        <div className="notes-ledger-head" aria-hidden="true">
          {section.columns.map((column) => (
            <span key={column}>{column}</span>
          ))}
          <span className="notes-ledger-refs">Entry</span>
        </div>
        <ul className="notes-ledger-rows">
          {section.items.map((item, index) => (
            <li key={index} className="notes-ledger-row">
              <p className="notes-ledger-what">
                <span className="sr-only">{whatColumn}: </span>
                <Markdown tree={renderInline(item.cells[0] ?? "", context)} />
              </p>
              {otherColumns.map((column, columnIndex) => (
                <p key={column} className="notes-ledger-text">
                  <span className="sr-only">{column}: </span>
                  {item.heldBack && !item.cells[columnIndex + 1] ? (
                    <span className="inline-flex items-start gap-1.5 text-ink-muted">
                      <span className="mt-[3px] text-warning">
                        <StatusGlyph kind="progress" />
                      </span>
                      <span>{item.heldBack}</span>
                    </span>
                  ) : (
                    <Markdown tree={renderInline(item.cells[columnIndex + 1] ?? "", context)} />
                  )}
                </p>
              ))}
              <p className="notes-ledger-refs">
                <span className="notes-ledger-refs-label">{item.entries.length > 1 ? "Entries" : "Entry"} </span>
                <EntryRefs numbers={item.entries} fallback={item.entryText} entries={entries} />
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- index of entries

function countSentence(entries: EntrySection[]): string {
  const has = (kind: StatusKind) => entries.filter((entry) => entry.status.some((part) => part.kind === kind)).length;
  const phrases: Record<StatusKind, (count: number) => string> = {
    confirmed: (count) => `${count} ${count === 1 ? "reports" : "report"} what was measured here`,
    open: (count) => `${count} ${count === 1 ? "has a question" : "have questions"} still open`,
    progress: (count) => `${count} ${count === 1 ? "is" : "are"} in progress`,
    inconclusive: (count) => `${count} ${count === 1 ? "is" : "are"} inconclusive`,
    other: () => "",
  };
  const parts = STATUS_ORDER.map((kind) => [kind, has(kind)] as const)
    .filter(([, count]) => count > 0)
    .map(([kind, count]) => phrases[kind](count));
  const total = `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`;
  if (parts.length === 0) return `${total}.`;
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
  return `${total}: ${list}.`;
}

export function EntryIndex({ id, entries, context }: { id: string; entries: EntrySection[]; context: RenderContext }) {
  return (
    <section aria-labelledby={id}>
      <SectionHead id={id} text="The entries">
        The entries
      </SectionHead>
      <p className="mt-3 max-w-[680px] font-serif text-16 leading-6 text-ink-muted">{countSentence(entries)}</p>
      <ol className="notes-index">
        {entries.map((entry) => (
          <li key={entry.id} className="notes-index-row">
            <span className="notes-index-number" aria-hidden="true">
              {entry.number}
            </span>
            <a href={`#${entry.id}`} className="notes-index-title">
              <span className="sr-only">Entry {entry.number}: </span>
              <Markdown tree={renderInline(entry.title, context)} />
            </a>
            <span className="notes-index-status">
              {entry.status.length > 0 ? (
                entry.status.map((part, index) => (
                  <StatusStamp
                    key={index}
                    kind={part.kind}
                    raw={part.raw}
                    qualifier={part.qualifier ? <Markdown tree={renderInline(part.qualifier, context)} /> : undefined}
                  />
                ))
              ) : (
                <span className="notes-stamp text-ink-faint">No status given</span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ---------------------------------------------------------------- entries and other sections

export function Entry({ entry, context }: { entry: EntrySection; context: RenderContext }) {
  const stamps =
    entry.status.length > 0 ? (
      <ul className="notes-stamps" aria-label="Status">
        {entry.status.map((part, index) => (
          <li key={index}>
            <StatusStamp
              kind={part.kind}
              raw={part.raw}
              qualifier={part.qualifier ? <Markdown tree={renderInline(part.qualifier, context)} /> : undefined}
            />
          </li>
        ))}
      </ul>
    ) : undefined;
  return (
    <section aria-labelledby={entry.id} className="notes-entry">
      <SectionHead
        id={entry.id}
        text={`entry ${entry.number}, ${entry.text}`}
        number={entry.number}
        aside={stamps}
        level={3}
      >
        <Markdown tree={renderInline(entry.title, context)} />
      </SectionHead>
      {entry.body.trim() ? (
        <div className="prose notes-body">
          <Markdown tree={renderBlock(entry.body, { ...context, idPrefix: entry.id })} />
        </div>
      ) : null}
    </section>
  );
}

export function TextBlock({
  section,
  context,
  children,
}: {
  section: TextSection;
  context: RenderContext;
  children?: React.ReactNode;
}) {
  return (
    <section aria-labelledby={section.id}>
      <SectionHead id={section.id} text={section.text}>
        <Markdown tree={renderInline(section.title, context)} />
      </SectionHead>
      {section.body.trim() ? (
        <div className="prose notes-body">
          <Markdown tree={renderBlock(section.body, { ...context, idPrefix: section.id })} />
        </div>
      ) : null}
      {children}
    </section>
  );
}

// ---------------------------------------------------------------- what is still running

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/**
 * The runs the data module lists as in progress: a name each, never a value. When
 * they finish they leave this list by themselves.
 */
export function StillRunning() {
  const running = [
    ...unfinishedRuns().map((entry) => ({ name: entry.name, label: entry.label, family: entry.group.family })),
    ...awaitedRuns().map((entry) => ({ name: entry.name, label: entry.label, family: entry.group.family })),
  ];
  const date = DATE.format(new Date(exportedAt));
  return (
    <div className="notes-running">
      <h3 className="flex items-center gap-2 text-16 font-semibold">
        <span className="text-warning">
          <Glyph name="clock" size={14} />
        </span>
        {running.length > 0 ? "Still training" : "Nothing is training"}
      </h3>
      {running.length > 0 ? (
        <>
          <p className="mt-1 text-14 text-ink-muted">
            The runs the site&rsquo;s data lists as in progress on {date}. Their results appear on the{" "}
            <Link href="/lab" className="text-link">
              lab page
            </Link>{" "}
            once they are final.
          </p>
          <ul className="notes-running-list">
            {running.map((entry) => (
              <li key={entry.name}>
                <StatusStamp kind="progress" />
                <span className="text-ink">{entry.label}</span>
                <span className="text-ink-faint">{entry.family ? RUN_FAMILIES[entry.family]?.label : null}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-1 text-14 text-ink-muted">
          Every run in the data of {date} has finished; their results are on the{" "}
          <Link href="/lab" className="text-link">
            lab page
          </Link>
          .
        </p>
      )}
    </div>
  );
}
