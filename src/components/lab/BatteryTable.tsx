"use client";

/**
 * Section 7: each policy's final checkpoint under the conditions of the
 * notebook's table "How each policy copes outside the conditions it was
 * trained in", with the scripted expert, with one plan and planning again,
 * below as the reference. Rows, columns and cells all come from the data
 * module (batteryRuns, batteryConditions, battery, expertBattery); a run in
 * progress gets a hatched row and no value.
 */

import { useState, type CSSProperties } from "react";
import { Toggle } from "@/figures/kit";
import { ScrollBox } from "@/components/ui/ScrollBox";
import { formatCount, formatPercent } from "@/data/format";
import { WEIGHTS, expertLabel, runLabel } from "@/data/labels";
import { battery, batteryConditions, batteryRuns, expertBattery, type BatteryCell } from "@/data/probes";
import { awaitedRuns, runsByGroup } from "@/data/runs";
import type { Settings } from "@/data/types";
import { InProgressBadge, RowLink } from "./shared";
import styles from "./styles";

const capital = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

/** The group a column belongs to, read off the conditions of its cells. */
function groupOf(settings: Settings | undefined): string {
  if (!settings) return "Other conditions";
  if (settings.disturb !== "none" && settings.randomStart) return "From a random start, object moved";
  if (settings.disturb === "reach") return "Object moved during the reach";
  if (settings.disturb === "grasp") return "Object moved as the gripper closes";
  if (settings.randomStart) return "Start pose";
  return "Conditions it was trained in";
}

type CellLike = Pick<BatteryCell, "successes" | "episodes" | "retried" | "kind" | "words">;

function Cell({ cell, showRetried, groupStart }: { cell: CellLike | undefined; showRetried: boolean; groupStart: boolean }) {
  const edge = groupStart ? styles.groupStart : "";
  if (!cell) {
    return (
      <td className={`${styles.batteryEmpty} ${edge}`}>
        <span aria-hidden="true">-</span>
        <span className="sr-only">not run</span>
      </td>
    );
  }
  const rate = cell.episodes > 0 ? cell.successes / cell.episodes : 0;
  const retried = showRetried && cell.retried !== null && cell.kind === "disturbance";
  return (
    <td className={edge}>
      <span className={styles.batteryCount}>
        {formatCount(cell.successes, cell.episodes)}
        <span className="sr-only"> succeeded, {formatPercent(rate)}</span>
      </span>
      <span className={styles.batteryBar} aria-hidden="true">
        <span style={{ "--at": `${100 * rate}%` } as CSSProperties} />
      </span>
      {retried ? (
        <span className={styles.batteryRetried}>
          {cell.retried}
          <span className="sr-only"> episodes with a second grasp attempt</span>
          <span aria-hidden="true"> retried</span>
        </span>
      ) : null}
    </td>
  );
}

type Sort = { variant: string; direction: "ascending" | "descending" } | null;

export function BatteryTable() {
  const [showRetried, setShowRetried] = useState(true);
  const [sort, setSort] = useState<Sort>(null);

  const columns = batteryConditions("outside");
  const policyRows = batteryRuns().map((entry) => ({ ...entry, cells: battery(entry.run) }));
  const expertRows = expertBattery();

  // A column's conditions, from the first cell that has them.
  const settingsOf = (variant: string): Settings | undefined =>
    policyRows.flatMap((row) => row.cells).find((cell) => cell.variant === variant)?.settings ??
    expertRows.flatMap((row) => row.cells).find((cell) => cell.variant === variant)?.settings;
  const groups: { label: string; span: number }[] = [];
  const starts = new Set<string>();
  for (const column of columns) {
    const label = groupOf(settingsOf(column.variant));
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.span += 1;
    else {
      groups.push({ label, span: 1 });
      starts.add(column.variant);
    }
  }

  const shownRows = [...policyRows];
  if (sort) {
    const rateOf = (row: (typeof policyRows)[number]) => {
      const cell = row.cells.find((candidate) => candidate.variant === sort.variant);
      return cell && cell.episodes > 0 ? cell.successes / cell.episodes : null;
    };
    shownRows.sort((a, b) => {
      const left = rateOf(a);
      const right = rateOf(b);
      if (left === null) return right === null ? 0 : 1;
      if (right === null) return -1;
      return sort.direction === "ascending" ? left - right : right - left;
    });
  }

  // Runs whose demonstrations differ, still training: listed without a value.
  const listed = new Set(policyRows.map((row) => row.run));
  const running = [
    ...runsByGroup({ fix: "after", family: "demonstrations", status: "in_progress" }),
    ...awaitedRuns().filter((entry) => entry.group.fix === "after" && entry.group.family === "demonstrations"),
  ].filter((entry) => !listed.has(entry.name));

  const toggleSort = (variant: string) => {
    setSort((previous) => {
      if (!previous || previous.variant !== variant) return { variant, direction: "descending" };
      if (previous.direction === "descending") return { variant, direction: "ascending" };
      return null;
    });
  };
  const sortWords = sort
    ? `Policies sorted by ${columns.find((column) => column.variant === sort.variant)?.words ?? sort.variant}, ${sort.direction === "descending" ? "highest" : "lowest"} first.`
    : "Policies in the notebook's order.";

  return (
    <div className={styles.blockGap}>
      <div className={styles.controls}>
        <Toggle label="Show second grasp attempts" checked={showRetried} onChange={setShowRetried} />
        <p aria-live="polite" className="text-14 text-ink-muted">
          {sortWords} Select a column head to sort by it.
        </p>
      </div>
      <ScrollBox label="How each policy copes outside the conditions it was trained in" className={styles.blockGap}>
        <table className={`${styles.table} ${styles.battery} sticky-first`}>
          <caption className="sr-only">
            Success of each policy&rsquo;s final checkpoint under each set of conditions, the scripted expert below as the
            reference. A dash: not run.
          </caption>
          <thead>
            <tr>
              <td aria-hidden="true" />
              {groups.map((group, index) => (
                <th key={`${group.label}-${index}`} scope="colgroup" colSpan={group.span} className={`${styles.groupStart} ${styles.wrap}`}>
                  {group.label}
                </th>
              ))}
            </tr>
            <tr>
              <th scope="col">Demonstrations</th>
              {columns.map((column) => {
                const state = sort?.variant === column.variant ? sort.direction : undefined;
                return (
                  <th
                    key={column.variant}
                    scope="col"
                    aria-sort={state ?? "none"}
                    className={`num ${styles.wrap} ${starts.has(column.variant) ? styles.groupStart : ""}`}
                  >
                    <button type="button" className={styles.sortButton} onClick={() => toggleSort(column.variant)}>
                      <span>{column.words}</span>
                      <svg className={styles.sortIcon} viewBox="0 0 10 12" aria-hidden="true" focusable="false">
                        {state !== "ascending" ? <path d="M2 7l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.4" /> : null}
                        {state !== "descending" ? <path d="M2 5l3-3 3 3" fill="none" stroke="currentColor" strokeWidth="1.4" /> : null}
                      </svg>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {shownRows.map((row) => {
              const id = `outside-${row.run}`;
              const words = capital(row.words);
              return (
                <tr key={row.run} id={id}>
                  <th scope="row" className={styles.wrap}>
                    {words}
                    <RowLink id={id} label={words} />
                    {row.weights ? (
                      <span className={styles.cellDetail}>final checkpoint, {WEIGHTS[row.weights].label}</span>
                    ) : null}
                  </th>
                  {columns.map((column) => (
                    <Cell
                      key={column.variant}
                      cell={row.cells.find((cell) => cell.variant === column.variant)}
                      showRetried={showRetried}
                      groupStart={starts.has(column.variant)}
                    />
                  ))}
                </tr>
              );
            })}
            {running.map((entry) => (
              <tr key={entry.name} id={`outside-${entry.name}`}>
                <th scope="row" className={styles.wrap}>
                  {capital(entry.label)}
                  <span className={styles.cellDetail}>
                    <InProgressBadge />
                  </span>
                </th>
                <td colSpan={columns.length} className={styles.hatched}>
                  <span className="sr-only">no value yet: </span>
                  <span className="text-14">{runLabel({ ...entry, samplesPlanned: 0 }, { recipe: true })}: no value until the run is reported.</span>
                </td>
              </tr>
            ))}
          </tbody>
          <tbody>
            <tr className={styles.tbodyHead}>
              <th scope="rowgroup" colSpan={columns.length + 1}>
                {expertLabel()}, the reference
              </th>
            </tr>
            {expertRows.map((row) => {
              const id = `outside-expert-${row.plansAgain ? "plans-again" : "one-plan"}`;
              const words = capital(row.words);
              return (
                <tr key={row.words} id={id}>
                  <th scope="row" className={styles.wrap}>
                    {words}
                    <RowLink id={id} label={`${expertLabel(row.plansAgain)}, ${row.words}`} />
                  </th>
                  {columns.map((column) => (
                    <Cell
                      key={column.variant}
                      cell={row.cells.find((cell) => cell.variant === column.variant)}
                      showRetried={showRetried}
                      groupStart={starts.has(column.variant)}
                    />
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollBox>
    </div>
  );
}
