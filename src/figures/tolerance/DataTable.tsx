"use client";

import { useId } from "react";
import { formatCount } from "@/data/format";
import type { Machine, ObjectId } from "@/data/types";
import { Marker, REFERENCE } from "@/figures/kit";
import { OBJECT_LINES, machineName, table } from "./model";

type Column = ObjectId | "all";

/** The figure's order: the objects as the legend, the plan views and the status line give them, then all four. */
const COLUMNS: { id: Column; label: string; marker?: (typeof OBJECT_LINES)[number]["style"] }[] = [
  ...OBJECT_LINES.map((object) => ({ id: object.id, label: object.short, marker: object.style })),
  { id: "all", label: "All four" },
];

/**
 * The figure as a table: one row per offset, success per object and for all
 * four, with the counts where the data has them. The values are the
 * notebook's; the columns are in the order the rest of the figure uses. The
 * row of the slider's offset carries the highlighter.
 */
export function DataTable({ machine, offsetMm }: { machine: Machine; offsetMm: number }) {
  const data = table(machine);
  const rows = [...data.rows].sort((a, b) => a.offsetMm - b.offsetMm);
  const hasCounts = rows.some((row) => row.counts);
  const captionId = useId();

  return (
    <div className="mt-4">
      {/* Outside the scroller, so it wraps in the visible width at 320 px. */}
      <p id={captionId} className="m-0 mb-2 text-13 text-ink-muted stretch-88">
        {machineName(machine)}, {data.simulator}: success of the scripted expert with its grasp point offset sideways,{" "}
        {data.episodesPerOffset} episodes per offset{hasCounts ? ", with successes out of the episodes that named each object" : ""}.
        The values are the lab notebook&apos;s.
      </p>
      <div
        className="table-scroll"
        role="group"
        aria-label={`Grasp success by offset, ${machineName(machine)}`}
        aria-describedby={captionId}
        tabIndex={0}
      >
        <table className="sticky-first">
          <thead>
            <tr>
              <th scope="col">Offset</th>
              {COLUMNS.map((column) => (
                <th key={column.id} scope="col" className="num whitespace-nowrap">
                  <svg
                    width={12}
                    height={12}
                    viewBox="0 0 12 12"
                    aria-hidden="true"
                    focusable="false"
                    className="mr-1 inline-block align-[-1px]"
                  >
                    {column.marker ? (
                      <Marker shape={column.marker.shape} x={6} y={6} size={9} color={column.marker.color} ring={false} />
                    ) : (
                      <line x1={0} x2={12} y1={6} y2={6} stroke={REFERENCE.color} strokeWidth={1.5} strokeDasharray={REFERENCE.dash} />
                    )}
                  </svg>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const isCurrent = row.offsetMm === offsetMm;
              const offset = `${row.offsetMm} mm`;
              return (
                <tr key={row.offsetMm} aria-current={isCurrent ? "true" : undefined}>
                  <th
                    scope="row"
                    className={`border-b-0 bg-surface text-15 font-medium whitespace-nowrap ${index > 0 ? "border-t border-line" : ""}`}
                  >
                    {isCurrent ? <mark>{offset}</mark> : offset}
                  </th>
                  {COLUMNS.map((column) => {
                    const count = row.counts?.[column.id];
                    return (
                      <td key={column.id} className="num">
                        {row.percent[column.id]}%
                        {count ? (
                          <span className="block text-13 text-ink-faint">{formatCount(count.successes, count.episodes)}</span>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
