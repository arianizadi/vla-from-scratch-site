"use client";

import { useId, type CSSProperties } from "react";
import type { Config, ConfigId } from "./configs";
import { formatCount } from "./model";

export interface ConfigRow {
  config: Config;
  prompt: number | null;
  head: number | null;
}

interface ConfigPickerProps {
  rows: ConfigRow[];
  value: ConfigId;
  onChange: (id: ConfigId) => void;
}

/** A length as a bar on the scale shared by every row and column, and its count. */
function Length({ value, longest }: { value: number | null; longest: number }) {
  return (
    <span className="sl-picker-cell" aria-hidden="true">
      <span className="sl-picker-track">
        {value !== null ? (
          <span
            className="sl-picker-bar"
            style={{ "--len": value / longest } as CSSProperties}
          />
        ) : null}
      </span>
      <span className="sl-num sl-picker-count">
        {value === null ? "–" : formatCount(value)}
      </span>
    </span>
  );
}

function sentence(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The prompt's length in words: "33 tokens", "not drawn" (Qwen) or "none". */
function promptWords(row: ConfigRow): string {
  if (row.prompt !== null) return `${formatCount(row.prompt)} tokens`;
  return row.config.kind === "qwen" ? "not drawn" : "none";
}

/**
 * The configs as a radio group laid out like a table: name and file, then the
 * prompt's length and the action head's length, each a bar on one scale for
 * every row and column. Tab reaches the selected row, the arrow keys move the
 * selection. On a narrow stage the same choice is a native select, with both
 * counts in each option, so the drawing stays directly under it.
 */
export function ConfigPicker({ rows, value, onChange }: ConfigPickerProps) {
  const name = useId();
  const longest = Math.max(
    1,
    ...rows.map((row) => Math.max(row.head ?? 0, row.prompt ?? 0)),
  );
  const selected = rows.find((row) => row.config.id === value);

  return (
    <>
      <fieldset className="sl-picker">
        <legend className="sl-picker-legend">Config</legend>
        <div className="sl-picker-head" aria-hidden="true">
          <span>Config, in sim/pickup/configs/</span>
          <span className="sl-num">Prompt</span>
          <span className="sl-num">Action head</span>
        </div>
        {rows.map((row) => {
          const { config, prompt, head } = row;
          const isSelected = config.id === value;
          const headText =
            head === null ? "none" : `${formatCount(head)} tokens`;
          const describedBy = `${name}-${config.id}`;
          return (
            <div key={config.id}>
              <label className="sl-picker-row" data-selected={isSelected}>
                <input
                  type="radio"
                  name={name}
                  className="sr-only"
                  checked={isSelected}
                  onChange={() => onChange(config.id)}
                  aria-describedby={describedBy}
                />
                <span className="sl-picker-name">
                  <span className="sl-picker-title">{config.name}</span>
                  <code className="sl-picker-file">{config.file}</code>
                </span>
                <Length value={prompt} longest={longest} />
                <Length value={head} longest={longest} />
              </label>
              {/* Outside the label, so it is read once, as the description. */}
              <span id={describedBy} className="sr-only">
                {config.description}. Prompt: {promptWords(row)}. Action head:{" "}
                {headText}.
              </span>
            </div>
          );
        })}
      </fieldset>

      <div className="sl-picker-compact">
        <label htmlFor={`${name}-select`}>
          Config (tokens: prompt / action head)
        </label>
        <select
          id={`${name}-select`}
          className="sl-select"
          value={value}
          onChange={(event) => onChange(event.target.value as ConfigId)}
        >
          {rows.map((row) => (
            <option key={row.config.id} value={row.config.id}>
              {`${row.config.name} (${row.prompt === null ? "–" : formatCount(row.prompt)} / ${row.head === null ? "–" : formatCount(row.head)})`}
            </option>
          ))}
        </select>
        {selected ? (
          <p className="sl-picker-compact-file">
            <code>{selected.config.file}</code>: prompt{" "}
            {promptWords(selected)}, action head{" "}
            {selected.head === null
              ? "none"
              : `${formatCount(selected.head)} tokens`}
            . {sentence(selected.config.description)}.
          </p>
        ) : null}
      </div>
    </>
  );
}
