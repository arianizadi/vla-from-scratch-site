"use client";

/**
 * Section 2: the finished runs before the position fix, one at a time, with
 * their trained and averaged weights. The list of runs is the data module's:
 * every finished run on the named-object task with two or more checkpoints
 * reported with both weights.
 */

import { useId, useState } from "react";
import { ControlButton } from "@/figures/kit";
import { checkpoints } from "@/data/checkpoints";
import { WEIGHTS, runLabel } from "@/data/labels";
import { policyStyle } from "./policyStyle";
import { isFinished, runsByGroup, type FinishedRun } from "@/data/runs";
import { CheckpointChart } from "./CheckpointChart";
import { CheckpointTable } from "./CheckpointTable";
import styles from "./styles";

/** The runs the chart offers, in the notebook's order. */
export function headlineRuns(): FinishedRun[] {
  return runsByGroup({ fix: "before" }).filter(
    (entry): entry is FinishedRun =>
      isFinished(entry) && entry.task === "pick_target" && checkpoints(entry.name).length >= 2,
  );
}

export function HeadlineChart() {
  const options = headlineRuns();
  const reference = runsByGroup({ fix: "before", family: "reference" }).find((entry) =>
    options.some((option) => option.name === entry.name),
  );
  const [selected, setSelected] = useState(reference?.name ?? options[0]?.name ?? "");
  const [table, setTable] = useState(false);
  const selectId = useId();

  const entry = options.find((option) => option.name === selected) ?? options[0];
  if (!entry) return null;
  const rows = checkpoints(entry.name);
  const label = runLabel(entry, { budget: true });
  const policy = policyStyle(entry);

  return (
    <CheckpointChart
      title="Success, looking and slope by checkpoint, before the fix"
      lines={(["raw", "ema"] as const).map((weights) => ({
        id: weights,
        label: WEIGHTS[weights].label.charAt(0).toUpperCase() + WEIGHTS[weights].label.slice(1),
        // Colour is the policy's; the two sets of weights differ by line and marker, not by hue.
        color: policy.color,
        shape: policy.shape,
        secondary: weights === "ema",
        rows,
        weights,
      }))}
      controls={
        <div className={styles.controls}>
          <label htmlFor={selectId} className="fig-label">
            Run
          </label>
          <select
            id={selectId}
            className={styles.select}
            value={entry.name}
            onChange={(event) => setSelected(event.target.value)}
          >
            {options.map((option) => (
              <option key={option.name} value={option.name}>
                {runLabel(option, { budget: true })}
              </option>
            ))}
          </select>
          <ControlButton aria-pressed={table} onClick={() => setTable((shown) => !shown)}>
            {table ? "Hide table" : "Show as table"}
          </ControlButton>
        </div>
      }
      caption={`${label}: every checkpoint the notebook reports, ${rows[0]?.raw.episodes ?? ""} unseen layouts each. The whisker at the crosshair is the 95% interval of the success rate.`}
      note="One training seed per run; differences of a few percent between single runs are noise."
    >
      {table ? (
        <div className="mt-4">
          <CheckpointTable rows={rows} label={`${label}, by checkpoint`} idPrefix={`chart-${entry.name}`} />
        </div>
      ) : null}
    </CheckpointChart>
  );
}
