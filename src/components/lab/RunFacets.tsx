"use client";

/**
 * Small multiples: success against training samples, one panel per run, so
 * any number of runs reads without a seventh colour. A run in progress gets a
 * hatched panel and no line; it fills in when the data module reports it.
 */

import { useState } from "react";
import { FigureFrame, Legend, POLICY_SERIES, REFERENCE, Segmented, SERIES, type MarkerShape } from "@/figures/kit";
import { checkpointRows, type CheckpointRow } from "@/data/checkpoints";
import { MISSING, formatPercent, formatSamples } from "@/data/format";
import { WEIGHTS, policySeries } from "@/data/labels";
import { awaitedRuns, run } from "@/data/runs";
import type { RunDesign, Weights } from "@/data/types";
import { InProgressBadge } from "./shared";
import { Panels, SHARE_AXIS, samplesAxis, stopsOf, type ChartPanel, type ChartSeries } from "./Panels";

interface Facet {
  name: string;
  label: string;
  design: RunDesign | null;
  inProgress: boolean;
  rows: CheckpointRow[];
}

function facetOf(name: string): Facet {
  const entry = run(name);
  if (entry) {
    return {
      name,
      label: entry.label,
      design: entry.design,
      inProgress: entry.status === "in_progress",
      rows: entry.status === "finished" ? checkpointRows(name) : [],
    };
  }
  const awaited = awaitedRuns().find((candidate) => candidate.name === name);
  return { name, label: awaited?.label ?? name, design: awaited?.design ?? null, inProgress: true, rows: [] };
}

const capital = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

function styleOf(design: RunDesign | null): { color: string; shape: MarkerShape } {
  const key = design ? policySeries(design) : undefined;
  return key ? POLICY_SERIES[key] : { color: SERIES[0], shape: "circle" };
}

/**
 * Where a checkpoint sits on the shared axis: its samples in millions to two
 * decimals, so that the same point of training in two runs (499,328 and
 * 499,520 samples) shares one crosshair stop. Only a position on the axis;
 * the samples printed are the row's own.
 */
const xOf = (row: CheckpointRow) => Math.round(row.samples / 1e4) / 100;

const valueAt = (rows: CheckpointRow[], weights: Weights, x: number) => {
  const row = rows.find((candidate) => xOf(candidate) === x);
  const evaluation = row ? (weights === "raw" ? row.raw : row.ema) : null;
  return row && evaluation ? { row, evaluation } : undefined;
};

interface RunFacetsProps {
  title: string;
  runs: string[];
  /** Drawn dashed in every panel, for comparison. */
  reference?: string | null;
  /** Panels share one x-axis and one crosshair; otherwise each run has its own axis. */
  sharedX?: boolean;
  caption: string;
}

export function RunFacets({ title, runs: names, reference = null, sharedX = true, caption }: RunFacetsProps) {
  const [weights, setWeights] = useState<Weights>("raw");
  const [active, setActive] = useState<number | null>(null);

  const facets = names.map(facetOf);
  const referenceFacet = reference ? facetOf(reference) : null;
  const referenceLabel = referenceFacet ? `${capital(referenceFacet.label)} (reference)` : "";

  const lineOf = (facet: Facet, dashed: boolean, id: string): ChartSeries => {
    const style = styleOf(facet.design);
    return {
      id,
      label: facet.label,
      color: dashed ? REFERENCE.color : style.color,
      shape: dashed ? null : style.shape,
      dashed,
      points: facet.rows.map((row) => {
        const evaluation = weights === "raw" ? row.raw : row.ema;
        return {
          x: xOf(row),
          y: evaluation ? evaluation.rate : null,
          low: evaluation ? evaluation.ci[0] : null,
          high: evaluation ? evaluation.ci[1] : null,
        };
      }),
    };
  };

  const allRows = [...facets, ...(referenceFacet ? [referenceFacet] : [])].flatMap((facet) => facet.rows);
  const maxMillions = Math.max(0.1, ...allRows.map((row) => row.samples / 1e6));
  const shared = samplesAxis(maxMillions);

  const panels: ChartPanel[] = facets.map((facet) => {
    const own = facet.rows.length > 0 ? samplesAxis(Math.max(...facet.rows.map((row) => row.samples / 1e6))) : shared;
    const missingWeights = facet.rows.length > 0 && facet.rows.every((row) => (weights === "raw" ? false : row.ema === null));
    const series = [
      ...(referenceFacet && referenceFacet.name !== facet.name && referenceFacet.rows.length > 0
        ? [lineOf(referenceFacet, true, "reference")]
        : []),
      lineOf(facet, false, facet.name),
    ];
    return {
      id: facet.name,
      title: (
        <>
          {capital(facet.label)}
          {facet.inProgress ? <InProgressBadge /> : null}
          {missingWeights ? <span className="font-normal text-ink-faint">no {WEIGHTS[weights].label} saved</span> : null}
        </>
      ),
      series,
      y: SHARE_AXIS,
      x: sharedX ? undefined : own,
      empty: facet.inProgress ? <span className="text-14 text-ink-muted">No value until the run is reported</span> : undefined,
    };
  });

  const stops = sharedX ? stopsOf(panels.flatMap((panel) => (panel.empty ? [] : panel.series.filter((series) => !series.dashed)))) : [];
  const current = active !== null && active < stops.length ? active : null;

  let status: string;
  const finished = facets.filter((facet) => !facet.inProgress).length;
  const running = facets.length - finished;
  if (current === null) {
    status = `${finished} run${finished === 1 ? "" : "s"} with values, ${running} in progress. ${capital(WEIGHTS[weights].label)}.${sharedX ? " Move the pointer over a panel, or focus the panels and use the arrow keys, to read one point of training." : ""}`;
  } else {
    const x = stops[current];
    const found = facets.flatMap((facet) => {
      const value = valueAt(facet.rows, weights, x);
      return value ? [{ facet, ...value }] : [];
    });
    const when = found[0] ? `${formatSamples(found[0].row.samples)} samples` : MISSING;
    const parts = found.map(({ facet, evaluation }) => `${facet.label} ${formatPercent(evaluation.rate)}`);
    status = `${when}: ${parts.length > 0 ? parts.join("; ") : MISSING}.`;
  }

  const legend = [
    ...new Map(
      facets.filter((facet) => !facet.inProgress).map((facet) => {
        const style = styleOf(facet.design);
        const key = facet.design ? policySeries(facet.design) : undefined;
        const label = key ? POLICY_SERIES[key].label : facet.label;
        return [label, { label, color: style.color, shape: style.shape }] as const;
      }),
    ).values(),
    ...(referenceFacet && referenceFacet.rows.length > 0
      ? [{ label: referenceLabel, color: REFERENCE.color, shape: "line" as const, dashed: true }]
      : []),
  ];

  return (
    <FigureFrame
      title={title}
      stamp="measured"
      caption={caption}
      note={`Success of the ${WEIGHTS[weights].label} at every checkpoint the notebook reports; one training seed per run.`}
      status={status}
      controls={
        <Segmented
          label="Weights"
          showLabel
          value={weights}
          onChange={setWeights}
          options={(["raw", "ema"] as const).map((value) => ({ value, label: capital(WEIGHTS[value].short) }))}
        />
      }
    >
      {legend.length > 0 ? <Legend className="mb-3" items={legend} /> : null}
      <Panels
        panels={panels}
        x={shared}
        xLabel="Training samples (millions)"
        stops={stops}
        active={current}
        onActive={setActive}
        columns={2}
        height={140}
        label={`${title}. One panel per run.${sharedX ? " Use the left and right arrow keys to move along training." : ""}`}
      />
    </FigureFrame>
  );
}
