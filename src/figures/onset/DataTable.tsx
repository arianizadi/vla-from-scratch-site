"use client";

import { formatCount, formatInterval, formatPercent, formatSamples, formatSlope } from "@/data/format";
import { WEIGHTS } from "@/data/labels";
import type { Weights } from "@/data/types";
import type { DrawnRun } from "./Chart";
import { rowsWith } from "./model";

export interface DataTableProps {
  runs: readonly DrawnRun[];
  weights: Weights;
}

/** Every reported checkpoint of the drawn runs, with the selected weights: the figure as a table. */
export function DataTable({ runs, weights }: DataTableProps) {
  if (runs.length === 0) return <p className="onset-empty">No run is drawn.</p>;
  return (
    <div className="onset-table-wrap">
      <table className="onset-table">
        <caption>
          Every reported checkpoint of the runs drawn, {WEIGHTS[weights].label}
        </caption>
        <thead>
          <tr>
            <th scope="col">Samples</th>
            <th scope="col">Slope</th>
            <th scope="col">Closed at named</th>
            <th scope="col">Success</th>
            <th scope="col">95% interval</th>
          </tr>
        </thead>
        {runs.map(({ run }) => (
          <tbody key={run.name}>
            <tr>
              <th scope="rowgroup" colSpan={5} className="onset-table-run">
                {run.label}
              </th>
            </tr>
            {rowsWith(run, weights).map((row) => {
              const evaluation = row[weights];
              if (!evaluation) return null;
              return (
                <tr key={row.checkpoint}>
                  <th scope="row">
                    {formatSamples(row.samples)}
                    {row.final ? " (final)" : ""}
                  </th>
                  <td>{formatSlope(evaluation.slope)}</td>
                  <td>{formatPercent(evaluation.named)}</td>
                  <td>
                    {formatCount(evaluation.successes, evaluation.episodes)} = {formatPercent(evaluation.rate)}
                  </td>
                  <td>{formatInterval(evaluation.ci)}</td>
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>
    </div>
  );
}
