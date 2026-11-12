"use client";

import { useEffect, useRef } from "react";
import { fixed, formatCount, formatInterval, formatMm, formatPercent } from "@/data/format";
import { styles } from "./styles";
import { JOINTS, type RolloutModel, type SlotProbe } from "./model";

const grip = (value: number) => (value >= 0.5 ? "open" : "closed");

/** The rollout as a table: every control step, the selected joint, the miss over seven joints and the gripper. */
export function RolloutTable({
  model,
  joint,
  step,
  title,
}: {
  model: RolloutModel;
  joint: number;
  step: number;
  title: string;
}) {
  const box = useRef<HTMLDivElement>(null);

  // Keep the marked step in view inside the table's own scroll box (instantly: no smooth scroll), never the page.
  useEffect(() => {
    const element = box.current;
    const row = element?.querySelector<HTMLElement>('tr[aria-current="true"]');
    if (!element || !row) return;
    const head = element.querySelector("thead");
    const sticky = head && getComputedStyle(head.querySelector("th") ?? head).position === "sticky";
    const top = element.getBoundingClientRect().top + (sticky ? head.getBoundingClientRect().height : 0);
    const bottom = element.getBoundingClientRect().bottom;
    const rect = row.getBoundingClientRect();
    // The first row brings the caption and the column heads back with it.
    if (!row.previousElementSibling) element.scrollTop = 0;
    else if (rect.top < top) element.scrollTop -= top - rect.top;
    else if (rect.bottom > bottom) element.scrollTop += rect.bottom - bottom;
  }, [step]);

  return (
    <div ref={box} className={`table-scroll ${styles.tableBox}`} role="group" aria-label={title} tabIndex={0}>
      <table>
        <caption className="border-b border-line px-3 py-2 text-left text-13 text-ink-muted stretch-88">
          {title}
        </caption>
        <thead>
          <tr>
            <th scope="col" className="num">
              Step
            </th>
            <th scope="col" className="num">
              Joint {joint + 1}, expert (rad)
            </th>
            <th scope="col" className="num">
              Joint {joint + 1}, repeated (rad)
            </th>
            <th scope="col" className="num">
              Miss, seven joints (rad)
            </th>
            <th scope="col">Gripper, expert</th>
            <th scope="col">Gripper, repeated</th>
          </tr>
        </thead>
        <tbody>
          {model.rows.map((row) => {
            const isCurrent = row.step === step;
            const note = row.step === model.firstQuery ? " (first query)" : row.expertDrives ? " (expert drives)" : "";
            return (
              <tr key={row.step} aria-current={isCurrent ? "true" : undefined}>
                <td className="num">
                  {isCurrent ? <mark>{row.step}</mark> : row.step}
                  <span className="text-ink-muted">{note}</span>
                </td>
                <td className="num">{fixed(row.action[joint], 3)}</td>
                <td className="num">{fixed(row.previous[joint], 3)}</td>
                <td className="num">{fixed(row.miss, 3)}</td>
                <td>{grip(row.action[JOINTS])}</td>
                <td>{grip(row.previous[JOINTS])}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** The probes as a table, in the notebook's terms. */
export function ProbeTable({ rows, selected, title }: { rows: SlotProbe[]; selected: string; title: string }) {
  return (
    <div className={`table-scroll ${styles.tableBox}`} role="group" aria-label={title} tabIndex={0}>
      <table>
        <caption className="border-b border-line px-3 py-2 text-left text-13 text-ink-muted stretch-88">
          {title}
        </caption>
        <thead>
          <tr>
            <th scope="col" className={styles.condition}>
              Condition
            </th>
            <th scope="col" className="num">
              Success
            </th>
            <th scope="col" className="num">
              95% interval
            </th>
            <th scope="col" className="num">
              Closed at the named object
            </th>
            <th scope="col" className="num">
              Median miss
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.probe.variant} aria-current={row.probe.variant === selected ? "true" : undefined}>
              <td className={styles.condition}>
                {row.probe.variant === selected ? <mark>{row.description}</mark> : row.description}
              </td>
              <td className="num">{formatCount(row.probe.successes, row.probe.episodes)}</td>
              <td className="num">{formatInterval(row.probe.ci)}</td>
              <td className="num">{formatPercent(row.probe.named)}</td>
              <td className="num">{formatMm(row.probe.missMm)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
