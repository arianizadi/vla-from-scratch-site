"use client";

import { useId } from "react";
import { Glyph } from "@/components/ui/Glyph";
import { WEIGHTS } from "@/data/labels";
import type { Weights } from "@/data/types";
import { Marker } from "@/figures/kit";
import type { OnsetGroup, OnsetRun, RunStyle } from "./model";

export interface RunPickerProps {
  group: OnsetGroup;
  /** Selected runs, each with its place among those turned on. */
  slots: Readonly<Record<string, number>>;
  weights: Weights;
  /** No slot is free: runs that are off cannot be turned on. */
  full: boolean;
  onToggle: (run: OnsetRun, on: boolean) => void;
}

/** The colour and marker of a run, or a hollow grey one while it is off. Doubles as the chart's legend. */
function Swatch({ style }: { style: RunStyle | undefined }) {
  const color = style ? style.color : "var(--border-strong)";
  return (
    <svg width={24} height={14} viewBox="0 0 24 14" aria-hidden="true" focusable="false" className="flex-none">
      <line x1={1} x2={23} y1={7} y2={7} stroke={color} strokeWidth={2} strokeDasharray={style ? style.dash : "2 3"} />
      <Marker shape={style ? style.shape : "circle"} x={12} y={7} size={9} color={color} hollow={style ? style.hollow : true} />
    </svg>
  );
}

/**
 * The runs of the group, by family, as a list of checkboxes. It is also the
 * legend: each selected run shows the colour and marker it is drawn with.
 * Runs in progress are listed after them, with a clock and the words "in
 * progress", and have nothing to select; so are finished runs the notebook
 * does not report at any checkpoint yet. A run reported at one checkpoint is
 * drawn as a lone point.
 */
export function RunPicker({ group, slots, weights, full, onToggle }: RunPickerProps) {
  const baseId = useId();
  const missing = `checked, not drawn: ${weights === "ema" ? "no averaged weights saved" : `no ${WEIGHTS[weights].label} reported`}`;
  const inProgress = group.pending.filter((run) => run.why === "in_progress");
  const unreported = group.pending.filter((run) => run.why === "unreported");

  return (
    <fieldset className="onset-picker">
      <legend className="onset-picker-legend">
        Runs to draw<span className="sr-only">, {group.label.toLowerCase()}</span>
      </legend>
      {group.families.filter((family) => family.runs.length > 0).map((family, index) => {
        const headingId = `${baseId}-family-${index}`;
        return (
          <div key={family.label} role="group" aria-labelledby={headingId} className="onset-family">
            <p id={headingId} className="onset-family-label">
              {family.label}
            </p>
            <ul>
              {family.runs.map((run) => {
                const slot = slots[run.name];
                const on = slot !== undefined;
                const hasWeights = run.has[weights];
                return (
                  <li key={run.name}>
                    <label className={`onset-run ${!on && full ? "is-unavailable" : ""}`}>
                      <input
                        type="checkbox"
                        checked={on}
                        disabled={!on && full}
                        onChange={(event) => onToggle(run, event.target.checked)}
                      />
                      <Swatch style={on && hasWeights ? run.style : undefined} />
                      <span className="onset-run-text">
                        <span>{run.label}</span>
                        {!hasWeights ? (
                          <span className="onset-run-hint">{on ? missing : missing.replace("checked, not drawn: ", "")}</span>
                        ) : run.rows.length === 1 ? (
                          <span className="onset-run-hint">one checkpoint reported: drawn as a point</span>
                        ) : null}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      {inProgress.length > 0 ? (
        <div className="onset-pending">
          <p className="onset-family-label">
            <span className="onset-pending-mark">
              <Glyph name="clock" size={12} />
              In progress
            </span>{" "}
            listed, not drawn: no value until the notebook reports them
          </p>
          <ul>
            {inProgress.map((run) => (
              <li key={run.name}>{run.label}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {unreported.length > 0 ? (
        <div className="onset-pending">
          <p className="onset-family-label">Finished, no checkpoint reported yet: not drawn</p>
          <ul>
            {unreported.map((run) => (
              <li key={run.name}>{run.label}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </fieldset>
  );
}
