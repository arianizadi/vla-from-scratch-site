"use client";

import { MISSING, formatCount, formatMm } from "@/data/format";
import type { Actor, DisturbanceOption } from "./model";

const sentenceCase = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

/**
 * The figure as a table: every actor under the chosen disturbance, how its
 * rollout on the chosen layout went, and what the notebook reports over the
 * whole evaluation.
 */
export function DataTable({
  actors,
  option,
  episode,
}: {
  actors: readonly Actor[];
  option: DisturbanceOption;
  episode: number;
}) {
  const rows = actors.flatMap((actor) => {
    const under = option.actors.get(actor.words);
    return under
      ? [
          {
            actor,
            under,
            info: under.traces.find((entry) => entry.episode === episode),
          },
        ]
      : [];
  });
  // A column only when the notebook prints it for some actor here; a dash where it prints it for others.
  const distances = rows.some(({ under }) => under.reported?.fromOldMm != null || under.reported?.fromNewMm != null);
  const retried = rows.some(({ under }) => under.reported?.retried != null);
  const cell = "border-b border-line px-3 py-2 align-top";
  const number = `${cell} text-right tabular-nums whitespace-nowrap`;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-left text-14 [font-stretch:88%]">
        <caption className="pb-2 text-left text-13 text-ink-muted">
          {option.words}, layout {episode + 1}. Evaluation counts are over the episodes in which the object could be
          moved; a dash where the lab notebook prints no value.
        </caption>
        <thead>
          <tr className="text-13">
            <th scope="col" className={`${cell} border-line-strong font-semibold`}>
              Actor
            </th>
            <th scope="col" className={`${cell} border-line-strong font-semibold`}>
              This layout
            </th>
            <th scope="col" className={`${cell} border-line-strong text-right font-semibold`}>
              Lifted
            </th>
            {distances ? (
              <>
                <th scope="col" className={`${cell} border-line-strong text-right font-semibold`}>
                  Closed, median from the old place
                </th>
                <th scope="col" className={`${cell} border-line-strong text-right font-semibold`}>
                  from the new place
                </th>
              </>
            ) : null}
            {retried ? (
              <th scope="col" className={`${cell} border-line-strong text-right font-semibold`}>
                Second grasp attempt
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ actor, under, info }) => {
            const reported = under.reported;
            return (
              <tr key={actor.words}>
                <th scope="row" className={`${cell} font-medium`}>
                  {sentenceCase(actor.words)}
                </th>
                <td className={cell}>
                  {info
                    ? `${info.success ? "Lifted" : "Not lifted"}; ${info.closes === 1 ? "1 close" : `${info.closes} closes`}`
                    : "No rollout"}
                </td>
                <td className={number}>{reported ? formatCount(reported.successes, reported.episodes) : MISSING}</td>
                {distances ? (
                  <>
                    <td className={number}>{reported?.fromOldMm != null ? formatMm(reported.fromOldMm) : MISSING}</td>
                    <td className={number}>{reported?.fromNewMm != null ? formatMm(reported.fromNewMm) : MISSING}</td>
                  </>
                ) : null}
                {retried ? (
                  <td className={number}>
                    {reported?.retried != null ? formatCount(reported.retried, reported.episodes) : MISSING}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
