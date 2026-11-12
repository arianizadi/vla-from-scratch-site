"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import {
  ENTRY_BY_ID,
  STRAND_BY_ID,
  chapterHref,
  chapterNumber,
  chapterTitle,
  ledTo,
  type Entry,
} from "./entries";
import { StrandMarker } from "./StrandMarker";

export interface DetailsProps {
  entry: Entry;
  /** Entries shown on the timeline at the moment (the year control hides later ones). */
  visible: ReadonlySet<string>;
  /** Number of entries it builds on, directly or not, and how many strands they come from. */
  lineage: { count: number; strands: number; throughInferred: boolean };
  /** Select an entry from a link here; `keyboard` is true when the link was activated from the keyboard. */
  onSelect: (id: string, keyboard: boolean) => void;
  id?: string;
}

/** The focused entry: its line, what it builds on, what built on it, and the chapters that discuss it. */
export function Details({ entry, visible, lineage, onSelect, id }: DetailsProps) {
  const strand = STRAND_BY_ID.get(entry.strand);
  const earlier = entry.buildsOn.flatMap((relation) => {
    const target = ENTRY_BY_ID.get(relation.id);
    return target ? [{ entry: target, how: relation.how, inferred: relation.inferred === true }] : [];
  });
  const offChart = entry.offChart ?? [];
  // A click from the keyboard (Enter or Space) has no pointer position: detail is 0.
  const pick = (id: string) => (event: MouseEvent<HTMLButtonElement>) => onSelect(id, event.detail === 0);
  const inferredMark = <span className="tl-inferred">(inferred)</span>;
  const later = ledTo(entry.id).filter((item) => visible.has(item.entry.id));

  return (
    <div id={id} className="tl-details">
      <p className="tl-details-head">
        <StrandMarker strand={entry.strand} size={14} />
        <span className="tl-details-name">{entry.name}</span>
        <span className="tl-details-meta">
          {entry.who}, {entry.year}
        </span>
        {entry.kind ? <span className="tl-details-kind">{entry.kind}</span> : null}
        {strand ? <span className="tl-details-strand">{strand.label}</span> : null}
      </p>
      <p className="tl-details-line">{entry.line}</p>
      <dl className="tl-details-grid">
        <dt>Builds on</dt>
        <dd>
          {earlier.length === 0 && offChart.length === 0 ? (
            <span className="tl-details-none">No earlier entry, as chapters 2 and 3 tell it.</span>
          ) : (
            <ul>
              {earlier.map((item) => (
                <li key={item.entry.id}>
                  <button type="button" className="tl-ref" onClick={pick(item.entry.id)}>
                    {item.entry.name} ({item.entry.year})
                  </button>
                  : {item.how} {item.inferred ? inferredMark : null}
                </li>
              ))}
              {offChart.map((item) => (
                <li key={item.name}>
                  <span className="tl-offchart">{item.name}</span>, not on this timeline: {item.how}
                </li>
              ))}
            </ul>
          )}
          {lineage.count > earlier.length ? (
            <p className="tl-details-none">
              Through them, {lineage.count} earlier entries, from {lineage.strands}{" "}
              {lineage.strands === 1 ? "strand" : "strands"}
              {lineage.throughInferred ? ", counting inferred lines" : ""}.
            </p>
          ) : null}
        </dd>
        {later.length > 0 ? (
          <>
            <dt>Led to</dt>
            <dd>
              <ul>
                {later.map((item) => (
                  <li key={item.entry.id}>
                    <button type="button" className="tl-ref" onClick={pick(item.entry.id)}>
                      {item.entry.name} ({item.entry.year})
                    </button>
                    : {item.how} {item.inferred ? inferredMark : null}
                  </li>
                ))}
              </ul>
            </dd>
          </>
        ) : null}
        <dt>Discussed in</dt>
        <dd>
          <ul>
            {entry.chapters.map((ref) => (
              <li key={`${ref.slug}#${ref.section ?? ""}`}>
                <Link href={chapterHref(ref)} className="tl-chapter">
                  <span className="tl-chapter-number">{chapterNumber(ref)}</span> {chapterTitle(ref)}
                  {ref.sectionTitle ? <span className="tl-chapter-section">, section {ref.sectionTitle}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </dd>
      </dl>
    </div>
  );
}
