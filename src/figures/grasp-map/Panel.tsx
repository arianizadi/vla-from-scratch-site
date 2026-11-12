"use client";

import { useId } from "react";
import { Glyph } from "@/components/ui/Glyph";
import { formatSamples } from "@/data/format";
import { CONDITION_KINDS } from "@/data/labels";
import type { ConditionKind, Weights } from "@/data/types";
import { rowCount, weightsFor, type ConditionOption, type RowGroup } from "./model";

export interface EvaluationPickerProps {
  groups: readonly RowGroup[];
  value: string;
  onChange: (key: string) => void;
  /** The weights the reader prefers: each row's count is given for them where the row has them. */
  weights: Weights;
}

function rowSummary(samplesText: string | null, count: string | null) {
  return [samplesText, count ? `${count} lifted` : null].filter(Boolean).join(" · ");
}

/**
 * The evaluations as a list of radio buttons, grouped before and after the
 * position fix. A run evaluated at several points of training is named once,
 * with its checkpoints under it, so the reader sees one run learning; a run
 * retrained after the fix says which run before it had the same recipe. The
 * reader sees every choice and its outcome at once, and the arrow keys walk
 * the list while the marks move. Shown beside the map on a wide figure.
 */
export function EvaluationList({ groups, value, onChange, weights }: EvaluationPickerProps) {
  const name = useId();
  const labelId = `${name}-label`;
  return (
    <div className="gm-list">
      <p id={labelId} className="gm-list-title">
        Evaluation
      </p>
      <div role="radiogroup" aria-labelledby={labelId}>
        {groups.map((group) => (
          <div key={group.id} className="gm-group">
            {group.label ? (
              <p className="gm-group-label" aria-hidden="true">
                {group.label}
              </p>
            ) : null}
            {group.runs.map((entry) => {
              const nested = entry.rows.length > 1;
              return (
                <div key={entry.run} className={nested ? "gm-run gm-run-nested" : "gm-run"}>
                  {nested ? (
                    <p className="gm-run-label" aria-hidden="true">
                      {entry.label}
                      {entry.pairedWith ? <span className="gm-row-pair">{entry.pairedWith}</span> : null}
                    </p>
                  ) : null}
                  {entry.rows.map((row) => {
                    const summary = rowSummary(row.samplesText, rowCount(row, weightsFor(row, weights)));
                    return (
                      <label key={row.key} className="gm-row">
                        <input
                          type="radio"
                          name={name}
                          className="sr-only"
                          checked={row.key === value}
                          onChange={() => onChange(row.key)}
                          aria-label={[group.label, row.label, summary, entry.pairedWith].filter(Boolean).join(", ")}
                        />
                        <span className="gm-row-body">
                          {nested ? (
                            <span className="gm-row-label">{summary || row.label}</span>
                          ) : (
                            <>
                              <span className="gm-row-label">{row.label}</span>
                              {summary ? <span className="gm-row-sub">{summary}</span> : null}
                              {entry.pairedWith ? <span className="gm-row-pair">{entry.pairedWith}</span> : null}
                            </>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function NativeSelect({
  label,
  value,
  onChange,
  children,
  className = "",
  describedBy,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  describedBy?: string;
}) {
  const id = useId();
  return (
    <div className={`gm-select ${className}`}>
      <label htmlFor={id} className="fig-label">
        {label}
      </label>
      <div className="gm-select-box">
        <select id={id} value={value} aria-describedby={describedBy} onChange={(event) => onChange(event.target.value)}>
          {children}
        </select>
        <Glyph name="chevron" size={12} className="gm-select-chevron" />
      </div>
    </div>
  );
}

/**
 * The same choice as a native select, for a narrow figure, where a list would
 * push the map off the screen. A closed select shows only the start of its
 * option, so each option begins with what tells it from its neighbours (the
 * samples and the count), and the line under it names the whole evaluation.
 */
export function EvaluationSelect({ groups, value, onChange, weights }: EvaluationPickerProps) {
  const lineId = useId();
  const currentEntry = groups.flatMap((group) => group.runs).find((entry) => entry.rows.some((row) => row.key === value));
  const currentRow = currentEntry?.rows.find((row) => row.key === value);
  const current =
    currentEntry && currentRow
      ? {
          label: currentRow.label,
          summary: rowSummary(currentRow.samplesText, rowCount(currentRow, weightsFor(currentRow, weights))),
          pairedWith: currentEntry.pairedWith,
        }
      : undefined;
  const content = groups.map((group) => {
    const options = group.runs.flatMap((entry) =>
      entry.rows.map((row) => {
        const count = rowCount(row, weightsFor(row, weights));
        const lead = [row.samples !== undefined ? formatSamples(row.samples) : null, count ? `${count} lifted` : null]
          .filter(Boolean)
          .join(" · ");
        return (
          <option key={row.key} value={row.key}>
            {lead ? `${lead} — ${row.label}` : row.label}
          </option>
        );
      }),
    );
    return group.label ? (
      <optgroup key={group.id} label={group.label}>
        {options}
      </optgroup>
    ) : (
      options
    );
  });
  return (
    <div className="gm-narrow-only gm-select-wrap">
      <NativeSelect label="Evaluation" value={value} onChange={onChange} describedBy={lineId}>
        {content}
      </NativeSelect>
      {current ? (
        <p id={lineId} className="gm-current">
          <span className="gm-row-label">{current.label}</span>
          {current.summary ? <span className="gm-row-sub">{current.summary}</span> : null}
          {current.pairedWith ? <span className="gm-row-pair">{current.pairedWith}</span> : null}
        </p>
      ) : null}
    </div>
  );
}

/** The conditions the selected evaluation was also run under: frozen cameras, an expert prefix, a moved object. */
export function ConditionSelect({
  options,
  value,
  onChange,
}: {
  options: readonly ConditionOption[];
  value: string;
  onChange: (variant: string) => void;
}) {
  const kinds = [...new Set(options.filter((option) => option.variant !== "plain").map((option) => option.kind))];
  const plain = options.filter((option) => option.variant === "plain");
  return (
    <NativeSelect label="Conditions" value={value} onChange={onChange}>
      {plain.map((option) => (
        <option key={option.variant} value={option.variant}>
          {option.label}
        </option>
      ))}
      {kinds.map((kind: ConditionKind) => (
        <optgroup key={kind} label={CONDITION_KINDS[kind]}>
          {options
            .filter((option) => option.variant !== "plain" && option.kind === kind)
            .map((option) => (
              <option key={option.variant} value={option.variant}>
                {option.label}
              </option>
            ))}
        </optgroup>
      ))}
    </NativeSelect>
  );
}
