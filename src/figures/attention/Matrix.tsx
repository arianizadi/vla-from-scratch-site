"use client";

import { useRef, type CSSProperties, type KeyboardEvent } from "react";
import { TOKENS, formatNumber, type Reading } from "./model";
import { HATCH, SHADE_STEPS, shadeOf } from "./ramp";

/** The three steps the figure walks through, in order. */
export type Stage = 0 | 1 | 2;

/** What happened to a row when the last token of the sequence was added. */
export type RowChange = "same" | "changed" | "new";

const CHANGE_WORD: Record<RowChange, string> = { same: "same", changed: "changed", new: "new row" };

/** Rows fill one after another, 60 ms apart (DESIGN.md, section 6: stagger up to 60 ms). */
const STAGGER_MS = 60;

export interface MatrixProps {
  /** One reading per token of the sequence. */
  rows: readonly Reading[];
  stage: Stage;
  /** The focused (reading) row. */
  focused: number;
  onFocus: (row: number) => void;
  /** Per row of the sequence; null when there is nothing to compare (one token, or before the softmax). */
  changes: readonly RowChange[] | null;
  /** Read by screen readers as the table's caption. */
  summary: string;
}

/**
 * The attention matrix as a table: a row per reading token, a column per token
 * read. The whole sentence is always drawn, so adding a token never moves the
 * layout; tokens not yet in the sequence are dashed outlines.
 */
export function Matrix({ rows, stage, focused, onFocus, changes, summary }: MatrixProps) {
  const length = rows.length;
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const last = TOKENS[length - 1];

  const move = (event: KeyboardEvent<HTMLButtonElement>, row: number) => {
    const target =
      event.key === "ArrowDown"
        ? Math.min(length - 1, row + 1)
        : event.key === "ArrowUp"
          ? Math.max(0, row - 1)
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? length - 1
              : null;
    if (target === null) return;
    event.preventDefault();
    onFocus(target);
    buttons.current[target]?.focus();
  };

  return (
    <table className="at-matrix">
      <caption className="sr-only">{summary}</caption>
      <thead>
        <tr>
          <td />
          {TOKENS.map((token, column) => (
            <th key={token} scope="col" className="at-col-head" data-ghost={column >= length || undefined}>
              {token}
            </th>
          ))}
          <th scope="col" className="at-change-head">
            {/* Always laid out, so the matrix does not move when the column fills. */}
            <span aria-hidden={changes ? undefined : true} style={changes ? undefined : { visibility: "hidden" }}>
              vs. without
              <br />
              <span className="at-mono">{length > 1 ? last : TOKENS[1]}</span>
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        {TOKENS.map((token, row) => {
          const reading = rows[row];
          const delay = { "--delay": `${row * STAGGER_MS}ms` } as CSSProperties;
          if (!reading) {
            return (
              <tr key={token}>
                <th scope="row" className="at-row-head">
                  <span className="at-row-ghost">
                    {token}
                    <span className="sr-only">, not yet in the sequence</span>
                  </span>
                </th>
                {TOKENS.map((column) => (
                  <td key={column} className="at-cell" data-ghost="" aria-hidden="true" />
                ))}
                <td className="at-change" />
              </tr>
            );
          }
          const isFocused = row === focused;
          const change = changes?.[row];
          return (
            <tr key={token}>
              <th scope="row" className="at-row-head">
                <button
                  ref={(element) => {
                    buttons.current[row] = element;
                  }}
                  type="button"
                  className="at-row-button"
                  aria-pressed={isFocused}
                  aria-label={`\u201c${token}\u201d: show what it reads`}
                  tabIndex={isFocused ? 0 : -1}
                  onClick={() => onFocus(row)}
                  onKeyDown={(event) => move(event, row)}
                >
                  {token}
                </button>
              </th>
              {TOKENS.map((column, read) => {
                if (read >= length) {
                  return <td key={column} className="at-cell" data-ghost="" aria-hidden="true" />;
                }
                const masked = reading.mask[read] !== 0;
                const weight = reading.weights[read];
                const step = shadeOf(weight);
                const shaded = stage === 2 && !masked;
                const hatched = stage >= 1 && masked;
                const text =
                  stage === 0
                    ? formatNumber(reading.scores[read], 2)
                    : masked
                      ? stage === 1
                        ? formatNumber(-Infinity, 0)
                        : "0"
                      : stage === 1
                        ? formatNumber(reading.scores[read], 2)
                        : formatNumber(weight, 2);
                const spoken =
                  stage === 2 && masked ? "0, masked" : stage === 1 && masked ? "minus infinity, masked" : text;
                return (
                  <td
                    key={column}
                    className="at-cell"
                    data-focus={isFocused || undefined}
                    data-first={read === 0 || undefined}
                    data-last={read === length - 1 || undefined}
                    onClick={() => onFocus(row)}
                  >
                    <span className="at-shade" data-on={shaded || undefined} style={{ ...delay, backgroundColor: step.fill }} aria-hidden="true" />
                    <span className="at-hatch" data-on={hatched || undefined} style={{ ...delay, ...HATCH }} aria-hidden="true" />
                    <span className="at-cell-edge" aria-hidden="true" />
                    <span
                      className="at-value"
                      data-muted={masked && stage >= 1 ? "" : undefined}
                      style={shaded ? { color: step.ink } : undefined}
                      aria-hidden="true"
                    >
                      {text}
                    </span>
                    <span className="sr-only">{spoken}</span>
                  </td>
                );
              })}
              <td className="at-change" data-kind={change}>
                {change ? CHANGE_WORD[change] : null}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/**
 * One line under the key that says what the last column compares: each row
 * with the same row computed before the last token was added. Where the figure
 * is too narrow for that column (attention.css), the line says instead what the
 * column would have shown. Shown only while the column is filled (after the
 * softmax, with two tokens or more); it sits below the matrix, so the matrix
 * never moves when it appears.
 */
export function ChangeNote({
  changes,
  length,
  cacheSentence,
}: {
  changes: readonly RowChange[] | null;
  length: number;
  cacheSentence: string;
}) {
  if (!changes) return null;
  return (
    <p className="at-change-note">
      <span className="at-column-only">
        Last column: each row compared with the same row computed before{" "}
        <span className="at-mono at-token">{TOKENS[length - 1]}</span> was added; <i>same</i> means identical.
      </span>
      <span className="at-no-column">{cacheSentence}</span>
    </p>
  );
}

/** The key under the matrix: the five shades with their bounds, and the hatch of a masked cell. */
export function ShadeKey({ stage }: { stage: Stage }) {
  return (
    <div className="at-key">
      <div>
        <p className="at-label">{stage === 2 ? "Weight" : "Weight, after the softmax"}</p>
        <div className="at-scale" aria-hidden="true">
          {SHADE_STEPS.map((step) => (
            <span key={step.fill} className="at-swatch" style={{ backgroundColor: step.fill }}>
              <span className="at-cell-edge" />
            </span>
          ))}
        </div>
        <div className="at-ticks" aria-hidden="true">
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((tick) => (
            <span key={tick}>{tick === 0 || tick === 1 ? String(tick) : tick.toFixed(1)}</span>
          ))}
        </div>
        <p className="sr-only">Shaded in five steps from 0 to 1; darker in the light theme, brighter in the dark theme, means more weight.</p>
      </div>
      <p className="at-mask-key">
        <span className="at-swatch" style={HATCH} aria-hidden="true">
          <span className="at-cell-edge" />
        </span>
        Masked: score −∞, weight exactly 0
      </p>
    </div>
  );
}
