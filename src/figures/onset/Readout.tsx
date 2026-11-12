"use client";

import { Fragment } from "react";
import { formatCount, formatInterval, formatPercent, formatSamples, formatSlope } from "@/data/format";
import type { Evaluation, Weights } from "@/data/types";
import { Marker } from "@/figures/kit";
import type { DrawnRun } from "./Chart";
import { standAt, type OnsetRun, type StandAt, type Stop } from "./model";

/** Where a run stood, in words, when it was not evaluated at the stop itself. */
export function whereText(run: OnsetRun, at: StandAt | undefined, stop: Stop, xMax: number): string | null {
  if (!at) return "not evaluated yet";
  if (at.past) {
    return run.ends === "stopped"
      ? `stopped at ${formatSamples(at.row.samples)}`
      : `budget ended at ${formatSamples(at.row.samples)}`;
  }
  if (!at.here) return `last checkpoint ${formatSamples(at.row.samples)}`;
  if (at.row === run.rows[run.rows.length - 1] && at.row.samples < xMax * (1 - 0.02)) {
    return run.ends === "stopped" ? "stopped here" : "its budget ends here";
  }
  return formatSamples(at.row.samples) === stop.label ? null : `checkpoint ${formatSamples(at.row.samples)}`;
}

/** Slope, closed at the named object, and success with its count, as three cells. */
function Values({ evaluation }: { evaluation: Evaluation | undefined }) {
  return (
    <>
      <td>{evaluation ? formatSlope(evaluation.slope) : "-"}</td>
      <td>{evaluation ? formatPercent(evaluation.named) : "-"}</td>
      <td>
        {evaluation ? (
          <>
            {formatPercent(evaluation.rate)}
            <span className="onset-run-hint">
              {formatCount(evaluation.successes, evaluation.episodes)}
              <span className="onset-wide">{`, ${formatInterval(evaluation.ci)}`}</span>
            </span>
          </>
        ) : (
          "-"
        )}
      </td>
    </>
  );
}

export interface ReadoutProps {
  runs: readonly DrawnRun[];
  /** Right end of the training axis: a run whose last checkpoint is before it ended early. */
  xMax: number;
  weights: Weights;
  cursor: number;
  stop: Stop;
}

/**
 * The values under the cursor, one row per drawn run, in the order of the
 * panels: slope, closed at the named object, success with its count. A run
 * that was not evaluated at this stop shows where it last was, and says why.
 */
export function Readout({ runs, xMax, weights, cursor, stop }: ReadoutProps) {
  if (runs.length === 0) return null;
  return (
    <table className="onset-readout">
      <caption className="sr-only">Values at {stop.label} training samples</caption>
      <thead>
        <tr>
          <th scope="col">At {stop.label} samples</th>
          <th scope="col">Slope</th>
          <th scope="col">
            <span className="onset-wide">Closed at named</span>
            <span className="onset-narrow">Named</span>
          </th>
          <th scope="col">Success</th>
        </tr>
      </thead>
      <tbody>
        {runs.map(({ run }) => {
          const at = standAt(run, weights, cursor, stop);
          const where = whereText(run, at, stop, xMax);
          const faded = !at || !at.here;
          const evaluation = at?.evaluation;
          return (
            <Fragment key={run.name}>
              <tr className={faded ? "is-faded" : undefined}>
                <th scope="row">
                  <span className="onset-readout-run">
                    <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden="true" focusable="false" className="flex-none">
                      <Marker
                        shape={run.style.shape}
                        x={7}
                        y={7}
                        size={10}
                        color={run.style.color}
                        hollow={run.style.hollow}
                        ring={false}
                      />
                    </svg>
                    <span>
                      {run.label}
                      {where ? <span className="onset-run-hint">{where}</span> : null}
                    </span>
                  </span>
                </th>
                <Values evaluation={evaluation} />
              </tr>
              {/* A stop that gathers two checkpoints of this run: the earlier one, which the chart draws apart. */}
              {(at?.alsoHere ?? []).map((row) => (
                <tr key={row.checkpoint} className="is-also">
                  <th scope="row">
                    <span className="onset-readout-also">
                      {run.label}
                      <span className="onset-run-hint">
                        {at?.row.final
                          ? `the checkpoint before its final one, also at ${formatSamples(row.samples)}`
                          : `an earlier checkpoint at this stop, ${formatSamples(row.samples)}`}
                      </span>
                    </span>
                  </th>
                  <Values evaluation={row[weights] ?? undefined} />
                </tr>
              ))}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
