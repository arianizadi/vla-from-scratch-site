"use client";

/**
 * Success, closed at the named object and slope against training samples, as
 * three aligned panels with one crosshair. Each line is one set of weights of
 * one run, read from the data module's checkpoint rows.
 */

import { useState, type ReactNode } from "react";
import { FigureFrame, Legend, type MarkerShape } from "@/figures/kit";
import type { CheckpointRow } from "@/data/checkpoints";
import { MISSING, formatCount, formatPercent, formatSamples, formatSlope } from "@/data/format";
import { setup } from "@/data/notebook";
import type { Evaluation, Weights } from "@/data/types";
import { Panels, SHARE_AXIS, fittedAxis, samplesAxis, stopsOf, type ChartPanel, type ChartSeries } from "./Panels";

/** One line: the given weights of a run's checkpoint rows. */
export interface CheckpointLine {
  id: string;
  label: string;
  color: string;
  shape: MarkerShape;
  /** Dashed line and open markers: the contrast within one policy (averaged weights, the run before the fix). */
  secondary?: boolean;
  rows: CheckpointRow[];
  weights: Weights;
}

const evaluationOf = (row: CheckpointRow, weights: Weights): Evaluation | null => (weights === "raw" ? row.raw : row.ema);

function seriesOf(line: CheckpointLine, measure: (evaluation: Evaluation) => number | null, interval = false): ChartSeries {
  return {
    id: line.id,
    label: line.label,
    color: line.color,
    shape: line.shape,
    dashed: line.secondary,
    hollow: line.secondary,
    points: line.rows.map((row) => {
      const evaluation = evaluationOf(row, line.weights);
      return {
        x: row.samples / 1e6,
        y: evaluation ? measure(evaluation) : null,
        low: interval && evaluation ? evaluation.ci[0] : null,
        high: interval && evaluation ? evaluation.ci[1] : null,
      };
    }),
  };
}

interface CheckpointChartProps {
  title: string;
  lines: CheckpointLine[];
  /** Controls above the panels' status: the run selector, a table toggle. */
  controls?: ReactNode;
  caption?: ReactNode;
  note?: ReactNode;
  /** Shown under the frame's bar, for example the table of the plotted rows. */
  children?: ReactNode;
}

export function CheckpointChart({ title, lines, controls, caption, note, children }: CheckpointChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const chance = setup.chance.percent / 100;

  const success = lines.map((line) => seriesOf(line, (evaluation) => evaluation.rate, true));
  const named = lines.map((line) => seriesOf(line, (evaluation) => evaluation.named));
  const slope = lines.map((line) => seriesOf(line, (evaluation) => evaluation.slope));
  const stops = stopsOf(success);
  const maxSamples = Math.max(0, ...stops);

  const panels: ChartPanel[] = [
    { id: "success", title: "Success", series: success, y: SHARE_AXIS },
    {
      id: "named",
      title: "Closed at the named object",
      series: named,
      y: SHARE_AXIS,
      levels: [{ value: chance, label: "chance" }],
    },
    {
      id: "slope",
      title: "Slope: 1 closes where the object is, 0 ignores the scene",
      series: slope,
      y: fittedAxis(
        slope.flatMap((series) => series.points.map((point) => point.y)),
        [0, 1],
        (value) => String(value),
      ),
    },
  ];

  // Clamp a stale crosshair after the lines change.
  const current = active !== null && active < stops.length ? active : null;
  const atStop = (line: CheckpointLine) =>
    current === null ? undefined : line.rows.find((row) => Math.abs(row.samples / 1e6 - stops[current]) < 1e-9);

  let status: string;
  if (current === null) {
    status = `${lines.map((line) => `${line.label}: ${line.rows.length} checkpoints`).join("; ")}. Move the pointer over the chart, or focus it and use the arrow keys, to read one checkpoint.`;
  } else {
    const parts = lines.flatMap((line) => {
      const row = atStop(line);
      const evaluation = row ? evaluationOf(row, line.weights) : null;
      if (!row || !evaluation) return [];
      return [
        `${line.label}: success ${formatPercent(evaluation.rate)} (${formatCount(evaluation.successes, evaluation.episodes)}), closed at the named object ${formatPercent(evaluation.named)}, slope ${formatSlope(evaluation.slope)}`,
      ];
    });
    const row = lines.map(atStop).find((entry) => entry !== undefined);
    const when = row ? `${formatSamples(row.samples)}${row.final ? " (final)" : ""}` : MISSING;
    status = `${when} samples. ${parts.join("; ")}.`;
  }

  return (
    <FigureFrame
      title={title}
      stamp="measured"
      caption={caption}
      note={note}
      status={status}
      controls={controls}
    >
      {lines.length > 1 ? (
        <Legend
          className="mb-3"
          items={lines.map((line) => ({
            label: line.label,
            color: line.color,
            shape: line.shape,
            dashed: line.secondary,
            hollow: line.secondary,
          }))}
        />
      ) : null}
      <Panels
        panels={panels}
        x={samplesAxis(maxSamples)}
        xLabel="Training samples (millions)"
        stops={stops}
        active={current}
        onActive={setActive}
        label={`${title}. Three panels share the horizontal axis. Use the left and right arrow keys to move between checkpoints.`}
      />
      {children}
    </FigureFrame>
  );
}
