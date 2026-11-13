"use client";

import { useId } from "react";
import { Glyph } from "@/components/ui/Glyph";
import { formatCount, formatInterval, formatMs } from "@/data/format";
import type { Count } from "@/data/types";
import { StampMark } from "@/figures/kit";
import { wilson } from "./model";
import { DEFAULT_STEPS, EXECUTED, layoutsPerCell, rowAt, STEP_OPTIONS, SWEEPS, type Sweep } from "./sweeps";

/** Label type: 13px, medium, condensed. */
const SMALL = "text-13 font-medium stretch-80";

const percent = (share: number) => `${Math.min(100, Math.max(0, share * 100))}%`;

/** A 0 to 100% line: the first set as a dot with its 95% interval, a second set as an open dot. */
function Track({ first, second }: { first: Count; second?: Count }) {
  const [low, high] = wilson(first.successes, first.episodes);
  return (
    <div className="relative mx-1.5 h-5" aria-hidden="true">
      <span className="absolute inset-x-0 top-1/2 border-t border-line" />
      <span className="absolute top-1.5 bottom-[5px] left-0 border-l border-line-strong" />
      <span className="absolute top-1.5 bottom-[5px] left-1/2 border-l border-line" />
      <span className="absolute top-1.5 right-0 bottom-[5px] border-l border-line-strong" />
      <span
        className="absolute top-[calc(50%-4px)] h-[9px] border-x-2 border-ink-muted"
        style={{ left: percent(low), right: percent(1 - high) }}
      >
        <span className="absolute inset-x-0 top-[3px] h-0.5 bg-ink-muted" />
      </span>
      {second ? (
        <span
          className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-ink bg-surface"
          style={{ left: percent(second.successes / second.episodes) }}
        />
      ) : null}
      <span
        className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink outline-2 outline-surface"
        style={{ left: percent(first.successes / first.episodes) }}
      />
    </div>
  );
}

/**
 * Which policy's sweep the panel shows. A native select: the names are long
 * and there can be more sweeps than fit in a row of segments. It changes this
 * panel only, so it sits inside it.
 */
function PolicySelect({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  const id = useId();
  return (
    <div className="flex min-w-0 items-center gap-2 px-3 pt-2">
      <label htmlFor={id} className="fig-label flex-none">
        Policy
      </label>
      <div className="relative min-w-0 flex-1">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="block h-8 w-full min-w-0 cursor-pointer appearance-none truncate rounded-control border border-line-strong bg-surface py-0 pr-8 pl-2.5 text-14 font-medium text-ink hover:border-ink pointer-coarse:h-11"
        >
          {SWEEPS.map((entry) => (
            <option key={entry.name} value={entry.name}>
              {entry.label}
            </option>
          ))}
        </select>
        <Glyph
          name="chevron"
          size={12}
          className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rotate-90 text-ink-muted"
        />
      </div>
    </div>
  );
}

export interface MeasuredProps {
  sweep: Sweep | undefined;
  /** The step count the toy is drawn with. */
  steps: number;
  onSelect: (steps: number) => void;
  /** Show another policy's sweep, by run name. */
  onSweep: (name: string) => void;
}

/**
 * Closed-loop success of the real policy for each number of flow steps, beside
 * the toy. Each row's step count is a button that sets the toy to it; the row
 * of the current count wears the highlighter.
 */
export function Measured({ sweep, steps, onSelect, onSweep }: MeasuredProps) {
  const titleId = useId();
  const layouts = sweep ? layoutsPerCell(sweep) : null;
  const anySecond = sweep?.rows.some((row) => row.second) ?? false;

  return (
    <section
      aria-labelledby={titleId}
      className="w-full min-w-0 rounded-plate border border-line-strong bg-surface text-14 leading-5"
    >
      <div className="flex min-h-9 items-center justify-between gap-3 border-b border-line px-3 py-1.5">
        <h3 id={titleId} className="font-semibold stretch-95">
          The policy, same flow steps
        </h3>
        <StampMark stamp="measured" />
      </div>

      {sweep ? (
        <>
          {SWEEPS.length > 1 ? <PolicySelect value={sweep.name} onChange={onSweep} /> : null}
          <p className={`px-3 pt-2 text-ink-muted ${SMALL}`}>
            {SWEEPS.length > 1 ? null : <>{sweep.label}. </>}
            {sweep.checkpoint ? `Checkpoint: ${sweep.checkpoint}. ` : ""}Success on{" "}
            {layouts === null ? "" : `${layouts} `}unseen layouts, {EXECUTED} actions executed per chunk.
          </p>
          <div className="overflow-x-auto">
          <table className="mt-1 w-full border-collapse tabular-nums">
            <caption className="sr-only">
              Closed-loop success and median time per action chunk for each number of flow steps
            </caption>
            <thead>
              <tr className={`text-left align-bottom text-ink-faint ${SMALL}`}>
                <th scope="col" className="py-1.5 pr-2 pl-3 font-medium">
                  Flow steps
                </th>
                <th scope="col" className="px-1 py-1.5 text-right font-medium">
                  Success
                </th>
                <th scope="col" className="w-full px-1 py-1.5 font-medium">
                  <span className="sr-only">Share of episodes, from </span>
                  <span className="flex justify-between px-1.5">
                    <span>0%</span>
                    <span className="sr-only"> to </span>
                    <span>100%</span>
                  </span>
                </th>
                <th scope="col" className="py-1.5 pr-3 pl-1 text-right font-medium">
                  Per chunk
                </th>
              </tr>
            </thead>
            <tbody>
              {STEP_OPTIONS.map((option) => {
                const row = rowAt(sweep, option);
                const selected = option === steps;
                return (
                  <tr key={option} className="border-t border-line align-middle">
                    <th scope="row" className="py-1.5 pr-2 pl-3 text-left font-normal">
                      <span className="grid justify-items-start gap-0.5">
                        <button
                          type="button"
                          aria-pressed={selected}
                          aria-label={`${option} flow ${option === 1 ? "step" : "steps"}: draw the toy with ${option === 1 ? "it" : "them"}`}
                          onClick={() => onSelect(option)}
                          className={`inline-flex h-7 min-w-8 cursor-pointer items-center justify-center rounded-control border px-1.5 text-14 font-semibold pointer-coarse:h-11 pointer-coarse:min-w-11 ${
                            selected
                              ? "border-ink bg-mark text-on-mark"
                              : "border-line-strong bg-surface text-ink hover:border-ink"
                          }`}
                        >
                          {option}
                        </button>
                        {option === DEFAULT_STEPS ? <span className={`text-ink-faint ${SMALL}`}>default</span> : null}
                      </span>
                    </th>
                    {row ? (
                      <>
                        <td className="px-1 py-1.5 text-right whitespace-nowrap">
                          <span className="block text-15 font-semibold text-ink">
                            {formatCount(row.first.successes, row.first.episodes)}
                            {row.second ? (
                              <>
                                <span className="sr-only">, second set </span>
                                <span aria-hidden="true">, </span>
                                {formatCount(row.second.successes, row.second.episodes)}
                              </>
                            ) : null}
                          </span>
                          <span className={`block text-ink-faint ${SMALL}`}>
                            <span className="sr-only">95% interval of the first set </span>
                            {formatInterval(wilson(row.first.successes, row.first.episodes))}
                          </span>
                        </td>
                        <td className="px-1 py-1.5">
                          <Track first={row.first} second={row.second} />
                        </td>
                        <td className="py-1.5 pr-3 pl-1 text-right whitespace-nowrap text-ink">
                          {formatMs(row.latencyMs)}
                        </td>
                      </>
                    ) : (
                      <td colSpan={3} className={`px-1 py-1.5 text-ink-faint ${SMALL}`}>
                        Not measured
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          <p className="border-t border-line px-3 py-2 text-13 leading-[1.125rem] text-ink-faint stretch-88">
            A dot is the share of episodes that succeeded, the bar through it the 95% interval
            {anySecond ? "; an open dot is a second set of layouts, where one was run" : ""}. Per chunk: median time to
            produce one action chunk.
          </p>
          <p className="border-t border-line px-3 py-2 text-13 leading-[1.125rem] text-ink-faint stretch-88">
            Why one flow step costs the policy less than the toy (a reading, not a measurement): the toy&rsquo;s two
            targets lie far apart, while once the instruction and the images fix the object, the chunks that fit one
            observation lie close together.
          </p>
        </>
      ) : (
        <p className="px-3 py-3 text-ink-muted">The lab notebook reports no sweep of the flow steps yet.</p>
      )}
    </section>
  );
}
