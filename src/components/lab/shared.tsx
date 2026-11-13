/**
 * Pieces every section of the lab page uses: the section frame with its
 * reading sentence and links, the in-progress badge, the 0 to 100% track, the
 * scrolling table box, and the helpers that turn the data module's rows into
 * the notebook's cells. Nothing here states a number: every value is read
 * from src/data and printed with src/data/format.ts.
 */

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Glyph } from "@/components/ui/Glyph";
import { Reveal } from "@/components/ui/Reveal";
import { ScrollBox } from "@/components/ui/ScrollBox";
import type { CheckpointRow } from "@/data/checkpoints";
import { MISSING, formatBoth, formatMm, formatPercent, formatSamples, formatSlope } from "@/data/format";
import { MACHINES } from "@/data/labels";
import { finishedRuns, type Run } from "@/data/runs";
import type { Evaluation } from "@/data/types";
import { notebookAnchors } from "./anchors";
import { PLAIN } from "./plain";
import styles from "./styles";

/** A chapter the page links to, resolved at build time; null when the chapter is not on the site. */
export interface ChapterLink {
  href: string;
  title: string;
}

/**
 * The entry of the field notes that discusses a section. The notes page
 * numbers its entries as the tutorial's notes.md does; this is the one place
 * that knows how it anchors them.
 */
export function noteHref(entry: number): string {
  return `/notes#entry-${entry}`;
}

// ---------------------------------------------------------------- the section frame

export interface SectionInfo {
  id: string;
  number: number;
  title: string;
}

interface LabSectionProps extends SectionInfo {
  /** One sentence: what to read from the section. */
  read: ReactNode;
  chapters: (ChapterLink | null)[];
  notes: number[];
  children: ReactNode;
}

/**
 * One numbered section of the page: what was found, in plain words and in
 * big type; what it means; where the lessons explain it; then, folded behind
 * "Show the numbers", what to read from the tables and the tables themselves.
 */
export function LabSection({ id, number, title, read, chapters, notes, children }: LabSectionProps) {
  const shown = chapters.filter((chapter): chapter is ChapterLink => chapter !== null);
  const plain = PLAIN[id];
  const big = plain?.number?.();
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`${styles.section} lab-plain`}>
      {notebookAnchors(id).map((anchor) => (
        <span key={anchor} id={anchor} aria-hidden="true" />
      ))}
      <div className="lab-plain-kicker">
        <span className="lab-plain-number" aria-hidden="true">
          {number}
        </span>
        <span>{title}</span>
        <a href={`#${id}`} className={styles.rowLink} aria-label={`Link to section: ${title}`}>
          #
        </a>
      </div>
      <h2 id={`${id}-title`} className="lab-plain-headline">
        <span className="sr-only">{title}: </span>
        {plain?.headline ?? title}
      </h2>
      {plain || big ? (
        <div className="lab-plain-body">
          {plain ? <p className="lab-plain-meaning">{plain.meaning}</p> : null}
          {big ? (
            <p className="lab-plain-big">
              <span className="lab-plain-big-value">{big.value}</span>
              <span className="lab-plain-big-caption">{big.caption}</span>
            </p>
          ) : null}
        </div>
      ) : null}
      {shown.length > 0 || notes.length > 0 ? (
        <p className="lab-plain-related">
          {shown.length > 0 ? <span className="lab-plain-related-label">Learn more:</span> : null}
          {shown.map((chapter) => (
            <Link key={chapter.href} href={chapter.href} className="text-link">
              {chapter.title}
            </Link>
          ))}
          {notes.map((entry) => (
            <Link key={entry} href={noteHref(entry)} className="text-link">
              Field note {entry}
            </Link>
          ))}
        </p>
      ) : null}
      <Reveal label="Show the numbers" openLabel="Hide the numbers" kind="numbers" className="lab-plain-numbers">
        <p className={styles.read}>{read}</p>
        {children}
      </Reveal>
    </section>
  );
}

/** A heading inside a section, with an id to link to. */
export function SubHead({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3 id={id} className={styles.subhead}>
      {children}
    </h3>
  );
}

// ---------------------------------------------------------------- in progress

/** A run that is still training: a clock and a word, never colour alone. */
export function InProgressBadge({ label = "In progress" }: { label?: string }) {
  return (
    <span className={styles.badge}>
      <Glyph name="clock" />
      {label}
    </span>
  );
}

/** The cell of a run in progress: hatched, with no value. */
export function InProgressCell({ colSpan, children }: { colSpan?: number; children?: ReactNode }) {
  return (
    <td colSpan={colSpan} className={styles.hatched}>
      {children ?? <span className="sr-only">no value yet, in progress</span>}
    </td>
  );
}

// ---------------------------------------------------------------- the track

const at = (share: number) => `${Math.min(100, Math.max(0, 100 * share))}%`;

/**
 * A rate between 0 and 1 on a 0 to 100% line: a dot, the Wilson interval as a
 * whisker when there is one, and a dashed level (chance) when given.
 * Decorative: the number beside it carries the value.
 */
export function RateTrack({
  rate,
  ci,
  level,
  reference = false,
}: {
  rate: number;
  ci?: readonly [number, number] | null;
  level?: number | null;
  reference?: boolean;
}) {
  return (
    <div className={styles.track} aria-hidden="true">
      {level !== undefined && level !== null ? (
        <span className={styles.trackLevel} style={{ "--at": at(level) } as CSSProperties} />
      ) : null}
      {ci ? (
        <span className={styles.trackWhisker} style={{ "--low": at(ci[0]), "--high": at(ci[1]) } as CSSProperties} />
      ) : null}
      <span
        className={styles.trackDot}
        data-reference={reference ? "" : undefined}
        style={{ "--at": at(rate) } as CSSProperties}
      />
    </div>
  );
}

// ---------------------------------------------------------------- tables

/**
 * A table that scrolls inside its own box. The label is the table's caption
 * (read by screen readers); the box takes focus and a name only while it
 * actually scrolls (ScrollBox).
 */
export function TableBox({
  label,
  children,
  stickyFirst = true,
  className = "",
}: {
  label: string;
  children: ReactNode;
  stickyFirst?: boolean;
  className?: string;
}) {
  return (
    <ScrollBox label={label} className={styles.blockGap}>
      <table className={`${styles.table} ${stickyFirst ? "sticky-first" : ""} ${className}`}>
        <caption className="sr-only">{label}</caption>
        {children}
      </table>
    </ScrollBox>
  );
}

/** A small link to a table row, for its permalink. */
export function RowLink({ id, label }: { id: string; label: string }) {
  return (
    <a href={`#${id}`} className={styles.rowLink} aria-label={`Link to the row ${label}`}>
      #
    </a>
  );
}

/** Text from the notebook with `code` spans in backticks. */
export function CodeText({ text }: { text: string }) {
  const parts = text.split("`");
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <code key={index} className={styles.inlineCode}>
            {part}
          </code>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** A note under a table. */
export function TableNote({ children }: { children: ReactNode }) {
  return <p className={styles.tableNote}>{children}</p>;
}

// ---------------------------------------------------------------- cells

/** The checkpoint's training samples as the notebook writes them: "5.0M (final)". */
export function samplesText(row: Pick<CheckpointRow, "samples" | "final">): string {
  return `${formatSamples(row.samples)}${row.final ? " (final)" : ""}`;
}

type Measure = (evaluation: Evaluation) => number | null;

/** Trained / averaged values of one measure: "83% / 85%"; "93% / -" where the averaged weights are missing. */
export function both(row: Pick<CheckpointRow, "raw" | "ema">, measure: Measure, format: (value: number | null) => string): string {
  return formatBoth(measure(row.raw), row.ema ? measure(row.ema) : null, format);
}

export const successOf: Measure = (evaluation) => evaluation.rate;
export const namedOf: Measure = (evaluation) => evaluation.named;
export const slopeOf: Measure = (evaluation) => evaluation.slope;
export const missOf: Measure = (evaluation) => evaluation.missMm;

/** The four measures of a checkpoint row, as the notebook's checkpoint tables print them. */
export function checkpointCells(row: Pick<CheckpointRow, "raw" | "ema">) {
  return {
    success: both(row, successOf, formatPercent),
    named: both(row, namedOf, formatPercent),
    slope: both(row, slopeOf, formatSlope),
    miss: both(row, missOf, formatMm),
  };
}

/** The best checkpoint the notebook names: "86% (trained, 4.0M)". */
export function bestText(entry: Run | undefined, words: Record<"raw" | "ema", string>): string {
  if (!entry || entry.status !== "finished" || !entry.best) return MISSING;
  const { best } = entry;
  return `${formatPercent(best.rate)} (${words[best.weights]}, ${formatSamples(best.samples)})`;
}

/** The weights a share of the averaged ones may lack. */
export function hasAveraged(rows: CheckpointRow[]): boolean {
  return rows.some((row) => row.ema !== null);
}

/**
 * Which machine the results after the first round come from, read off the
 * finished runs: one sentence while they all ran on one machine, the
 * exceptions named otherwise, nothing when no run says.
 */
export function laterMachinesSentence(): string | null {
  const later = finishedRuns().filter((entry) => entry.group.family !== "first_round" && entry.machine !== null);
  const machines = [...new Set(later.map((entry) => entry.machine!))];
  if (machines.length === 0) return null;
  if (machines.length === 1) return `Every result after the first round comes from ${MACHINES[machines[0]].name}.`;
  const counts = machines.map((machine) => {
    const count = later.filter((entry) => entry.machine === machine).length;
    return `${count} ${count === 1 ? "run" : "runs"} on ${MACHINES[machine].name}`;
  });
  return `The results after the first round come from ${counts.slice(0, -1).join(", ")} and ${counts[counts.length - 1]}; each table names its machine.`;
}
