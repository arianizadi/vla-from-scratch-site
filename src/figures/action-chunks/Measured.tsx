"use client";

import { useId } from "react";
import { formatCount, formatInterval } from "@/data/format";
import { StampMark } from "@/figures/kit";
import {
  DEFAULT_EXECUTED,
  LAYOUTS_PER_SETTING,
  MEASURED,
  MEASURED_SOURCE,
  measuredAt,
  seconds,
  type MeasuredSetting,
} from "./model";

const percent = (share: number) => `${Math.min(100, Math.max(0, share * 100))}%`;

/** Label type: 13px, medium, condensed. Spelled out, so that no stylesheet's own "label" class can restyle it. */
const SMALL = "text-13 font-medium stretch-80";

/**
 * A 0 to 100% line with the result as a dot and its 95% interval as a bar
 * through it. It lets clicks through to the row's button, whose hit area
 * covers the whole row.
 */
function Track({ row }: { row: MeasuredSetting }) {
  return (
    <div className="pointer-events-none relative mx-1.5 h-5" aria-hidden="true">
      <span className="absolute inset-x-0 top-1/2 border-t border-line-strong" />
      <span className="absolute top-1.5 bottom-[5px] left-0 border-l border-line-strong" />
      <span className="absolute top-1.5 right-0 bottom-[5px] border-l border-line-strong" />
      {row.interval ? (
        <span
          className="absolute top-[calc(50%-4px)] h-[9px] border-x-2 border-ink-muted"
          style={{ left: percent(row.interval[0]), right: percent(1 - row.interval[1]) }}
        >
          <span className="absolute inset-x-0 top-[3px] h-0.5 bg-ink-muted" />
        </span>
      ) : null}
      <span
        className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink outline-2 outline-surface"
        style={{ left: percent(row.rate) }}
      />
    </div>
  );
}

type PanelRow = (MeasuredSetting & { kind: "run" }) | { kind: "unrun"; executed: number };

/** The settings that were run, and, among them in its order, the one drawn when it was not run. */
function withCurrent(executed: number): PanelRow[] {
  const rows: PanelRow[] = MEASURED.map((row) => ({ ...row, kind: "run" }));
  if (!measuredAt(executed)) rows.push({ kind: "unrun", executed });
  return rows.sort((a, b) => a.executed - b.executed);
}

export interface MeasuredProps {
  /** The setting the timeline is drawn for. */
  executed: number;
  /** Called with a setting that was run, to draw the timeline for it. */
  onSelect: (executed: number) => void;
}

/**
 * The drawing's title block: closed-loop success for each number of executed
 * actions that was run, beside how often the policy then plans. Each row is a
 * button that sets the timeline to its setting; the row of the current setting
 * wears the highlighter.
 */
export function Measured({ executed, onSelect }: MeasuredProps) {
  const titleId = useId();

  return (
    <div className="w-full max-w-[480px] rounded-plate border border-line-strong bg-surface text-14 leading-5">
      <div className="flex min-h-9 items-center justify-between gap-3 border-b border-line px-3 py-1.5">
        <p id={titleId} className="font-semibold stretch-95">
          Success on {LAYOUTS_PER_SETTING === null ? "" : `${LAYOUTS_PER_SETTING} `}unseen layouts
        </p>
        {MEASURED_SOURCE ? (
          <a
            href={MEASURED_SOURCE.href}
            className="touch-target rounded-control text-ink-muted underline-offset-[3px] hover:text-ink hover:underline"
          >
            <StampMark stamp="measured" className="text-inherit" />
            <span className="sr-only">: the lab notebook, section {MEASURED_SOURCE.section}</span>
          </a>
        ) : (
          <StampMark stamp="measured" />
        )}
      </div>

      {MEASURED.length > 0 ? (
        <>
          <div
            role="table"
            aria-labelledby={titleId}
            className="grid grid-cols-[auto_auto_minmax(72px,1fr)] gap-x-3 tabular-nums"
          >
            {/* Each head has two lines, as each cell under it has. */}
            <div role="row" className={`col-span-full grid grid-cols-subgrid items-end px-3 pt-2 pb-1.5 text-ink-faint ${SMALL}`}>
              <span role="columnheader">
                Executed
                <span className="sr-only">, </span>
                <span className="block">plans every</span>
              </span>
              <span role="columnheader" className="text-right">
                Successes
                <span className="sr-only">, </span>
                <span className="block">95% interval</span>
              </span>
              <span role="columnheader" className="flex justify-between px-1.5">
                <span className="sr-only">Share of episodes, from </span>
                <span>0%</span>
                <span className="sr-only"> to </span>
                <span>100%</span>
              </span>
            </div>

            {withCurrent(executed).map((row) => {
              const selected = row.executed === executed;
              if (row.kind === "unrun") {
                // The setting the timeline is drawn for was not run: it takes its place among the others, without a value.
                return (
                  <div
                    key={`unrun-${row.executed}`}
                    role="row"
                    className="col-span-full grid grid-cols-subgrid items-center border-t border-line px-3 py-1.5"
                  >
                    <div role="rowheader" className="grid justify-items-start gap-0.5 font-normal">
                      <span className="inline-flex h-6 min-w-7 pointer-coarse:h-11 pointer-coarse:min-w-11 items-center justify-center rounded-control border border-ink bg-mark px-1.5 text-14 font-semibold text-on-mark">
                        {row.executed}
                        <span className="sr-only"> actions executed per chunk, the setting drawn</span>
                      </span>
                      <span className={`text-ink-faint ${SMALL}`}>
                        <span className="sr-only">plans every </span>
                        {seconds(row.executed)}
                      </span>
                    </div>
                    <div role="cell" aria-colspan={2} className="col-span-2 text-ink-muted">
                      <span className="block text-15 font-semibold">Not run</span>
                      <span className={`block text-ink-faint ${SMALL}`}>This policy was not evaluated with this setting</span>
                    </div>
                  </div>
                );
              }
              return (
                <div
                  key={row.executed}
                  role="row"
                  className="group/setting relative col-span-full grid cursor-pointer grid-cols-subgrid items-center border-t border-line px-3 py-1.5"
                >
                  <div role="rowheader" className="grid justify-items-start gap-0.5 font-normal">
                    <button
                      type="button"
                      aria-pressed={selected}
                      aria-label={`${row.executed} actions executed per chunk: draw the timeline`}
                      onClick={() => onSelect(row.executed)}
                      className={`inline-flex h-6 min-w-7 pointer-coarse:h-11 pointer-coarse:min-w-11 cursor-pointer items-center justify-center rounded-control border px-1.5 text-14 font-semibold after:absolute after:inset-0 ${
                        selected
                          ? "border-ink bg-mark text-on-mark"
                          : "border-line-strong bg-surface text-ink group-hover/setting:border-ink"
                      }`}
                    >
                      {row.executed}
                    </button>
                    <span className={`text-ink-faint ${SMALL}`}>
                      <span className="sr-only">plans every </span>
                      {seconds(row.executed)}
                    </span>
                  </div>
                  <div role="cell" className="text-right">
                    <span className="block text-15 font-semibold text-ink">{formatCount(row.successes, row.episodes)}</span>
                    <span className={`block text-ink-faint ${SMALL}`}>
                      {row.interval ? (
                        <>
                          <span className="sr-only">95% interval </span>
                          {formatInterval(row.interval)}
                        </>
                      ) : (
                        // Keeps the row as tall as the others.
                        <span aria-hidden="true">&nbsp;</span>
                      )}
                    </span>
                  </div>
                  <div role="cell">
                    <Track row={row} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="border-t border-line px-3 py-2 text-13 leading-[1.125rem] text-ink-faint stretch-88">
            A dot is the share of episodes that succeeded, the bar through it the 95% interval.{" "}
            Only the settings with a count were run{measuredAt(DEFAULT_EXECUTED) ? `; the default is ${DEFAULT_EXECUTED}` : ""}.
          </p>
        </>
      ) : (
        <p className="px-3 py-3 text-ink-muted">The lab notebook reports no evaluation of these settings yet.</p>
      )}
    </div>
  );
}
