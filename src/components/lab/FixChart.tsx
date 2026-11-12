"use client";

/**
 * The same recipe trained with the old and with the fixed position table,
 * checkpoint by checkpoint: one of the data module's before/after pairs. A
 * side whose run is in progress has no rows and draws no line.
 */

import { useState } from "react";
import { Segmented } from "@/figures/kit";
import { checkpointRows } from "@/data/checkpoints";
import { beforeAfterPairs } from "@/data/comparisons";
import { POSITION_FIX, WEIGHTS, runLabel } from "@/data/labels";
import { run } from "@/data/runs";
import type { Weights } from "@/data/types";
import { CheckpointChart, type CheckpointLine } from "./CheckpointChart";
import { policyStyle } from "./policyStyle";

const capital = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

export function FixChart({ pairIndex }: { pairIndex: number }) {
  const pair = beforeAfterPairs()[pairIndex];
  const [weights, setWeights] = useState<Weights>(pair?.weights[0] ?? "raw");
  if (!pair) return null;

  const sides = [
    { fix: "before" as const, name: pair.before, used: new Set(pair.rows.flatMap((row) => (row.before ? [row.before.checkpoint] : []))) },
    { fix: "after" as const, name: pair.after, used: new Set(pair.rows.flatMap((row) => (row.after ? [row.after.checkpoint] : []))) },
  ];
  const before = run(pair.before);
  // One policy on both sides: its own hue, the side before the fix dashed with open markers.
  const policy = policyStyle(run(pair.after) ?? before);
  const lines: CheckpointLine[] = sides.map((side) => ({
    id: side.fix,
    label: capital(POSITION_FIX[side.fix].short),
    color: policy.color,
    shape: policy.shape,
    secondary: side.fix === "before",
    rows: checkpointRows(side.name).filter((row) => side.used.has(row.checkpoint)),
    weights,
  }));
  const recipe = before ? runLabel(before, { recipe: true }) : pair.before;

  return (
    <CheckpointChart
      title="The same run before and after the position fix"
      lines={lines}
      controls={
        pair.weights.length > 1 ? (
          <Segmented
            label="Weights"
            showLabel
            value={weights}
            onChange={setWeights}
            options={pair.weights.map((value) => ({ value, label: capital(WEIGHTS[value].short) }))}
          />
        ) : undefined
      }
      caption={`${recipe}, with the old and with the fixed position table, ${WEIGHTS[weights].label}, at the checkpoints the notebook sets side by side. The whisker at the crosshair is the 95% interval.`}
      note="One training seed each. A side whose run is still in progress has no line."
    />
  );
}
