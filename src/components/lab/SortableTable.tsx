"use client";

/**
 * A notebook table whose columns sort through buttons in their heads
 * (aria-sort on the head). Rows and cells arrive as plain data, built from the
 * data module by the section that shows the table; the cell text is printed
 * as given and the sort uses each cell's `sort` value.
 */

import { useState } from "react";
import { ScrollBox } from "@/components/ui/ScrollBox";
import { RateTrack, RowLink } from "./shared";
import styles from "./styles";

export interface SortColumn {
  key: string;
  label: string;
  /** Right-aligned, tabular. */
  numeric?: boolean;
  sortable?: boolean;
  /** Read by screen readers in place of an empty or short head. */
  srLabel?: string;
}

export interface SortCell {
  text: string;
  /** What the column sorts by; null sorts last. */
  sort?: number | null;
  /** A second line in faint ink. */
  detail?: string;
  /** Draw the value on a 0 to 100% track instead of text. */
  track?: { rate: number; ci?: [number, number] | null; level?: number | null };
}

export interface SortRow {
  id: string;
  /** The row header. */
  label: string;
  /** Under the label: the inputs, the run's name. */
  detail?: string;
  code?: string;
  cells: Record<string, SortCell>;
}

type Sort = { key: string; direction: "ascending" | "descending" } | null;

export function SortableTable({
  label,
  rowHead,
  columns,
  rows,
  note,
}: {
  label: string;
  /** The head of the column of row labels. */
  rowHead: string;
  columns: SortColumn[];
  rows: SortRow[];
  note?: string;
}) {
  const [sort, setSort] = useState<Sort>(null);

  const shown = [...rows];
  if (sort) {
    shown.sort((a, b) => {
      const left = a.cells[sort.key]?.sort ?? null;
      const right = b.cells[sort.key]?.sort ?? null;
      if (left === null) return right === null ? 0 : 1;
      if (right === null) return -1;
      return sort.direction === "ascending" ? left - right : right - left;
    });
  }

  const toggle = (key: string) =>
    setSort((previous) => {
      if (!previous || previous.key !== key) return { key, direction: "descending" };
      if (previous.direction === "descending") return { key, direction: "ascending" };
      return null;
    });

  const sortedBy = sort ? columns.find((column) => column.key === sort.key) : undefined;

  return (
    <>
      <ScrollBox label={label} className={styles.blockGap}>
        <table className={`${styles.table} sticky-first`}>
          <caption className="sr-only">
            {label}. {sortedBy && sort ? `Sorted by ${sortedBy.label}, ${sort.direction}.` : "In the notebook's order."}
          </caption>
          <thead>
            <tr>
              <th scope="col">{rowHead}</th>
              {columns.map((column) => {
                const state = sort?.key === column.key ? sort.direction : undefined;
                const head = (
                  <>
                    <span aria-hidden={column.srLabel && !column.label ? true : undefined}>{column.label}</span>
                    {column.srLabel ? <span className="sr-only">{column.srLabel}</span> : null}
                  </>
                );
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={column.sortable ? (state ?? "none") : undefined}
                    className={`${column.numeric ? "num" : ""} ${styles.wrap}`}
                  >
                    {column.sortable ? (
                      <button type="button" className={styles.sortButton} onClick={() => toggle(column.key)}>
                        {head}
                        <svg className={styles.sortIcon} viewBox="0 0 10 12" aria-hidden="true" focusable="false">
                          {state !== "ascending" ? <path d="M2 7l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.4" /> : null}
                          {state !== "descending" ? <path d="M2 5l3-3 3 3" fill="none" stroke="currentColor" strokeWidth="1.4" /> : null}
                        </svg>
                      </button>
                    ) : (
                      head
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => (
              <tr key={row.id} id={row.id}>
                <th scope="row" className={styles.wrap}>
                  {row.label}
                  <RowLink id={row.id} label={row.label} />
                  {row.detail || row.code ? (
                    <span className={styles.cellDetail}>
                      {row.detail}
                      {row.detail && row.code ? ", " : null}
                      {row.code ? <code className={styles.inlineCode}>{row.code}</code> : null}
                    </span>
                  ) : null}
                </th>
                {columns.map((column) => {
                  const cell = row.cells[column.key];
                  return (
                    <td key={column.key} className={column.numeric ? "num" : styles.wrap}>
                      {cell?.track ? (
                        <RateTrack rate={cell.track.rate} ci={cell.track.ci} level={cell.track.level} />
                      ) : (
                        (cell?.text ?? "")
                      )}
                      {cell?.detail ? <span className={styles.cellDetail}>{cell.detail}</span> : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollBox>
      {note ? <p className={styles.tableNote}>{note}</p> : null}
    </>
  );
}
