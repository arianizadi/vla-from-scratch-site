"use client";

/**
 * Section 6: the same recipe on demonstrations that differ in what they
 * contain, at the fixed points of training the notebook's table uses. One
 * table, two measures: success (trained / averaged), or closed at the named
 * object and slope. The rows are the comparison table's finished runs and
 * every run of the family still in progress, in the notebook's order.
 */

import { useState } from "react";
import { Segmented } from "@/figures/kit";
import { ScrollBox } from "@/components/ui/ScrollBox";
import { checkpointRows, type CheckpointRow } from "@/data/checkpoints";
import { comparisonRows } from "@/data/comparisons";
import { MISSING, formatPercent, formatSamples, formatSlope, parseSamples } from "@/data/format";
import { WEIGHTS, runLabel } from "@/data/labels";
import { awaitedRuns, run } from "@/data/runs";
import { demonstrationRows } from "./demonstrations";
import { InProgressBadge, RowLink, both, bestText, successOf } from "./shared";
import styles from "./styles";

type Measure = "success" | "named";

const capital = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

/** The row the notebook prints under a column such as "1.0M": the final checkpoint when two read the same. */
function rowAt(rows: CheckpointRow[], column: string): CheckpointRow | undefined {
  const matches = rows.filter((row) => formatSamples(row.samples) === column);
  return matches.find((row) => row.final) ?? matches[0];
}

export function DemonstrationsTable() {
  const [measure, setMeasure] = useState<Measure>("success");
  const table = comparisonRows(measure === "success" ? "demonstrations" : "demonstrationsNamed");
  if (!table) return null;
  const rows = demonstrationRows();
  const sampleColumns = table.columns.filter((column) => parseSamples(column) !== undefined);
  const hasBest = table.columns.some((column) => parseSamples(column) === undefined);
  const width = sampleColumns.length + (hasBest ? 1 : 0);

  return (
    <div className={styles.blockGap}>
      <Segmented
        label="Measure"
        showLabel
        value={measure}
        onChange={setMeasure}
        options={[
          { value: "success", label: "Success" },
          { value: "named", label: "Closed at the named object, slope" },
        ]}
      />
      <ScrollBox label="What the demonstrations contain, by point of training" className={styles.blockGap}>
        <table className={`${styles.table} sticky-first`}>
          <caption className="sr-only">
            {measure === "success"
              ? "Success with the trained / averaged weights at fixed points of training; a dash where a run did not save averaged weights."
              : "Share of episodes closed at the named object, and the slope, of the trained weights at fixed points of training."}
          </caption>
          <thead>
            <tr>
              <th scope="col">Demonstrations</th>
              {sampleColumns.map((column) => (
                <th key={column} scope="col" className="num">
                  {column}
                </th>
              ))}
              {hasBest ? (
                <th scope="col" className="num">
                  Best checkpoint
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const id = `demonstrations-${row.name}`;
              const words = capital(row.words);
              const entry = run(row.name);
              const awaited = awaitedRuns().find((candidate) => candidate.name === row.name);
              const recipe = entry ? runLabel(entry, { recipe: true }) : awaited ? runLabel({ ...awaited, samplesPlanned: 0 }, { recipe: true }) : row.name;
              const data = row.inProgress ? [] : checkpointRows(row.name);
              return (
                <tr key={row.name} id={id}>
                  <th scope="row" className={styles.wrap}>
                    {words}
                    <RowLink id={id} label={words} />
                    <span className={styles.cellDetail}>
                      {row.inProgress ? <InProgressBadge /> : <code className={styles.inlineCode}>{entry?.design.dataset ?? row.name}</code>}
                    </span>
                  </th>
                  {row.inProgress ? (
                    <td colSpan={width} className={styles.hatched}>
                      <span className="text-14">{recipe}: no value until the run is reported.</span>
                    </td>
                  ) : (
                    <>
                      {sampleColumns.map((column) => {
                        const found = rowAt(data, column);
                        let text: string = MISSING;
                        if (found) {
                          text =
                            measure === "success"
                              ? both(found, successOf, formatPercent)
                              : `${formatPercent(found.raw.named)}, ${formatSlope(found.raw.slope)}`;
                        }
                        return (
                          <td key={column} className="num">
                            {text}
                          </td>
                        );
                      })}
                      {hasBest ? (
                        <td className="num">{bestText(entry, { raw: WEIGHTS.raw.short, ema: WEIGHTS.ema.short })}</td>
                      ) : null}
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollBox>
    </div>
  );
}
