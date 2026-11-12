"use client";

import { MISSING, formatCount, formatInterval } from "@/data/format";
import { WEIGHTS } from "@/data/labels";
import { capital, formatLoss, rowSamples, type RunModel } from "./model";

/**
 * The figure as a table: one row per reported checkpoint, with the loss
 * logged by then and the result of each set of weights the notebook reports.
 * The row of the checkpoint the scrubber has reached carries the highlighter.
 */
export function DataTable({ model, at }: { model: RunModel; at: number }) {
  const reached = model.stops[at].reached;

  return (
    <div className="table-scroll mt-4" role="group" aria-label={`Loss and closed-loop success by checkpoint: ${model.label}`} tabIndex={0}>
      <table className="sticky-first">
        <caption className="border-b border-line px-3 py-2 text-left text-13 text-ink-muted stretch-88">
          The logged loss starts at {formatLoss(model.lossStart)}. Each row is a reported checkpoint: the last loss
          logged by then, and successes out of episodes with their 95% interval.
        </caption>
        <thead>
          <tr>
            <th scope="col">Samples</th>
            <th scope="col" className="num">
              Training loss
            </th>
            {model.weights.map((kind) => [
              <th key={kind} scope="col" className="num">
                {capital(WEIGHTS[kind].label)}
              </th>,
              <th key={`${kind}-interval`} scope="col" className="num">
                95% interval<span className="sr-only">, {WEIGHTS[kind].label}</span>
              </th>,
            ])}
          </tr>
        </thead>
        <tbody>
          {model.rows.map((row, index) => {
            const isCurrent = index === reached - 1;
            return (
              <tr key={row.checkpoint} aria-current={isCurrent ? "true" : undefined}>
                {/* A row header, drawn as a body cell: the stylesheet's `th` rules are for the head row. */}
                <th
                  scope="row"
                  className={`border-b-0 bg-surface text-15 font-medium whitespace-nowrap ${index > 0 ? "border-t border-line" : ""}`}
                >
                  {isCurrent ? <mark>{rowSamples(row)}</mark> : rowSamples(row)}
                </th>
                <td className="num">{formatLoss(model.stops[model.checkpointStops[index]].loss)}</td>
                {model.weights.map((kind) => {
                  const evaluation = row[kind];
                  return [
                    <td key={kind} className="num">
                      {evaluation ? formatCount(evaluation.successes, evaluation.episodes) : MISSING}
                    </td>,
                    <td key={`${kind}-interval`} className="num text-ink-muted">
                      {evaluation ? formatInterval(evaluation.ci) : MISSING}
                    </td>,
                  ];
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
