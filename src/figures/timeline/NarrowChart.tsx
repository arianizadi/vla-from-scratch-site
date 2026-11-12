"use client";

import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { CHRONOLOGICAL, LINKS, STRANDS, type Entry, type StrandId } from "./entries";
import { MAX_GAP_YEARS, linkPathVertical } from "./layout";
import { MarkerShape } from "./StrandMarker";
import type { ChartProps } from "./WideChart";

const YEAR_COLUMN = 40;
const RAIL_STEP = 16;
const RAIL_LEFT = YEAR_COLUMN + 10;
/** Height of the header row that shows each strand's marker above its rail. */
const HEAD = 24;

const railX = (strand: StrandId) => RAIL_LEFT + STRANDS.findIndex((item) => item.id === strand) * RAIL_STEP;

type Row = { kind: "entry"; entry: Entry; firstOfYear: boolean } | { kind: "gap"; from: number; to: number; next: string };

/** Entries top to bottom in time order, with a row for each long stretch without one. */
const ROWS: Row[] = CHRONOLOGICAL.flatMap((entry, index): Row[] => {
  const previous = CHRONOLOGICAL[index - 1];
  const rows: Row[] = [];
  if (previous && entry.year - previous.year > MAX_GAP_YEARS) {
    rows.push({ kind: "gap", from: previous.year + 1, to: entry.year - 1, next: entry.id });
  }
  rows.push({ kind: "entry", entry, firstOfYear: !previous || previous.year !== entry.year });
  return rows;
});

interface Measure {
  height: number;
  centres: Record<string, number>;
  /** The open details, which the rails stop for. */
  details: { top: number; bottom: number } | null;
}

const sameMeasure = (a: Measure, b: Measure) =>
  a.height === b.height &&
  a.details?.top === b.details?.top &&
  a.details?.bottom === b.details?.bottom &&
  Object.keys(a.centres).length === Object.keys(b.centres).length &&
  Object.entries(a.centres).every(([key, value]) => b.centres[key] === value);

/**
 * The narrow form: one row per entry, time running down, and the five strands
 * as thin rails beside the names, each under its marker in a header row. Only
 * the focused entry's lineage is drawn as lines (all of them together would
 * run along the rails in bundles that cannot be traced). The focused entry
 * opens its details in place, across the full width, and the rails stop for
 * them. Rows after the year control's cutoff are left out, so while history
 * plays the newest entry is the last row, next to the controls.
 */
export function NarrowChart({ details, ...props }: ChartProps & { details: ReactNode }) {
  const { visible, focusId, tabId, entryState, linkState, onSelect, onKeyDown, registerEntry, entryLabel, detailsId } = props;
  const root = useRef<HTMLDivElement>(null);
  const clipId = `${useId()}-clip`;
  const [measure, setMeasure] = useState<Measure>({ height: 0, centres: {}, details: null });

  // The rails are drawn from the rows' real positions, which change when the details open, rows are
  // added or left out, or the width changes.
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const read = () => {
      const box = element.getBoundingClientRect();
      const centres: Record<string, number> = {};
      element.querySelectorAll<HTMLElement>("[data-entry]").forEach((button) => {
        const rect = button.getBoundingClientRect();
        if (rect.height > 0) centres[button.dataset.entry as string] = Math.round(rect.top - box.top + rect.height / 2);
      });
      const panel = element.querySelector<HTMLElement>("[data-details]")?.getBoundingClientRect();
      const next: Measure = {
        height: Math.round(box.height),
        centres,
        details: panel && panel.height > 0 ? { top: Math.round(panel.top - box.top), bottom: Math.round(panel.bottom - box.top) } : null,
      };
      setMeasure((previous) => (sameMeasure(previous, next) ? previous : next));
    };
    read();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(read);
    observer.observe(element);
    return () => observer.disconnect();
  }, [focusId, visible]);

  const { centres, height, details: detailsBox } = measure;
  const measured = Object.keys(centres).length > 0;
  const svgWidth = RAIL_LEFT + STRANDS.length * RAIL_STEP;

  return (
    <div className="tl-narrow" ref={root}>
      <svg className="tl-svg" width={svgWidth} height={Math.max(height, HEAD)} aria-hidden="true" focusable="false">
        {STRANDS.map((strand) => (
          <g key={strand.id} transform={`translate(${railX(strand.id)},${HEAD / 2})`}>
            <MarkerShape strand={strand.id} r={5.5} />
          </g>
        ))}
        {measured ? (
          <>
            <clipPath id={clipId}>
              {detailsBox ? (
                <>
                  <rect x={0} y={0} width={svgWidth} height={Math.max(0, detailsBox.top)} />
                  <rect x={0} y={detailsBox.bottom} width={svgWidth} height={Math.max(0, height - detailsBox.bottom)} />
                </>
              ) : (
                <rect x={0} y={0} width={svgWidth} height={height} />
              )}
            </clipPath>
            <g clipPath={`url(#${clipId})`}>
              {STRANDS.map((strand) => {
                const ys = CHRONOLOGICAL.filter((entry) => entry.strand === strand.id && visible.has(entry.id))
                  .map((entry) => centres[entry.id])
                  .filter((y) => y !== undefined);
                if (ys.length < 2) return null;
                const x = railX(strand.id);
                return <line key={strand.id} x1={x} x2={x} y1={Math.min(...ys)} y2={Math.max(...ys)} className="tl-rail" />;
              })}
              {LINKS.map((link) => {
                const a = CHRONOLOGICAL.find((entry) => entry.id === link.from);
                const b = CHRONOLOGICAL.find((entry) => entry.id === link.to);
                if (!a || !b || centres[a.id] === undefined || centres[b.id] === undefined) return null;
                if (!visible.has(a.id) || !visible.has(b.id) || linkState(link.from, link.to) !== "lineage") return null;
                return (
                  <path
                    key={`${link.from}-${link.to}`}
                    d={linkPathVertical(railX(a.strand), centres[a.id], railX(b.strand), centres[b.id])}
                    className="tl-link"
                    data-state="lineage"
                    data-inferred={link.inferred ? "true" : undefined}
                  />
                );
              })}
            </g>
            {CHRONOLOGICAL.map((entry) =>
              centres[entry.id] === undefined || !visible.has(entry.id) ? null : (
                <g
                  key={entry.id}
                  transform={`translate(${railX(entry.strand)},${centres[entry.id]})`}
                  className="tl-dot"
                  data-state={entryState(entry.id)}
                >
                  <MarkerShape strand={entry.strand} r={entry.id === focusId ? 6 : 5} />
                </g>
              ),
            )}
          </>
        ) : null}
      </svg>

      <ol className="tl-list">
        {ROWS.map((row) => {
          if (row.kind === "gap") {
            return (
              <li key={`gap-${row.from}`} className="tl-gap" data-hidden={visible.has(row.next) ? undefined : "true"}>
                No entries from {row.from} to {row.to}
              </li>
            );
          }
          const { entry } = row;
          const shown = visible.has(entry.id);
          const pressed = entry.id === focusId;
          return (
            <li key={entry.id} className="tl-row" data-hidden={shown ? undefined : "true"}>
              <span className="tl-row-year" aria-hidden="true">
                {row.firstOfYear ? entry.year : ""}
              </span>
              <button
                ref={(element) => registerEntry(entry.id, element)}
                type="button"
                data-entry={entry.id}
                className="tl-entry tl-entry-row"
                data-state={entryState(entry.id)}
                tabIndex={shown && entry.id === tabId ? 0 : -1}
                aria-pressed={pressed}
                aria-controls={pressed ? detailsId : undefined}
                aria-label={entryLabel(entry)}
                disabled={!shown}
                onClick={() => onSelect(entry.id)}
                onFocus={() => {
                  if (!pressed) onSelect(entry.id);
                }}
                onKeyDown={(event) => onKeyDown(event, entry.id)}
              >
                <span className="tl-entry-name">{entry.name}</span>
                <span className="tl-entry-who">{entry.who}</span>
              </button>
              {pressed && shown ? (
                <div className="tl-row-details" data-details="true">
                  {details}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
