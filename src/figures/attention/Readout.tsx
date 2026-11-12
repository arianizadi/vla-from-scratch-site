"use client";

import { Fragment, type CSSProperties, type ReactNode } from "react";
import type { Stage } from "./Matrix";
import { SCALE, TOKENS, formatNumber, formatVector, type Reading, type VectorSet } from "./model";
import { shadeOf } from "./ramp";

export interface ReadoutProps {
  /** The focused token. */
  reader: number;
  reading: Reading;
  vectors: VectorSet;
  stage: Stage;
  causal: boolean;
}

/**
 * A sentence with token names in it. A token is kept apart from the prose
 * around it, so the same sentence can be printed with the token in quotes
 * (the status line, a text alternative) or set in the mono face (the readout):
 * "the" and "up" are words too, and bare they garble the sentence.
 */
export type Phrase = readonly (string | { token: string } | { code: string })[];

/** A phrase as plain text, every token in curly quotes. */
export function phraseText(phrase: Phrase): string {
  return phrase.map((part) => (typeof part === "string" ? part : "token" in part ? quote(part.token) : part.code)).join("");
}

/** A token in curly quotes, for plain text. */
export function quote(token: string): string {
  return `“${token}”`;
}

/** A phrase as markup, every token in the mono face. */
function PhraseView({ phrase }: { phrase: Phrase }): ReactNode {
  return phrase.map((part, index) =>
    typeof part === "string" ? (
      <Fragment key={index}>{part}</Fragment>
    ) : "code" in part ? (
      <code key={index} className="at-mono">
        {part.code}
      </code>
    ) : (
      <span key={index} className="at-mono at-token">
        {part.token}
      </span>
    ),
  );
}

/** "0.117·v_pick + 0.078·v_up + …": the weighted mix of values the token receives. */
export function mixText(reading: Reading): string {
  return reading.weights
    .map((weight, read) => (reading.mask[read] === 0 ? `${formatNumber(weight, 3)}·v_${TOKENS[read]}` : null))
    .filter((term) => term !== null)
    .join(" + ");
}

/** One sentence on what the current step does to the focused row. */
export function stepPhrase(reader: number, reading: Reading, stage: Stage, causal: boolean): Phrase {
  const token = { token: TOKENS[reader] };
  const length = reading.scores.length;
  const later = length - 1 - reader;
  if (stage === 0) {
    return ["Each score is the query of ", token, " times a key, divided by √4 = ", String(SCALE), "."];
  }
  if (stage === 1) {
    if (!causal) {
      return later === 0
        ? ["The mask is off: ", token, " may read every token of the sequence, itself included; it is the last token, so nothing comes after it."]
        : ["The mask is off: ", token, " may read every token of the sequence, itself and the ", later === 1 ? "one" : String(later), " after it included."];
    }
    if (later === 0) {
      if (length === 1) return [token, " is the only token of the sequence, so the mask removes nothing."];
      // The last row is the one the mask leaves alone; point at an earlier row that shows it at work.
      const example = { token: TOKENS[Math.min(2, length - 2)] };
      return [token, " is the last token of the sequence, so the mask removes nothing from its row. Focus an earlier row, ", example, " for example, to see what it removes."];
    }
    return [
      "The mask sets the score of the ",
      later === 1 ? "token" : `${later} tokens`,
      " after ",
      token,
      " to −∞. ",
      token,
      ` may read ${reading.readable} of ${length}.`,
    ];
  }
  return [token, " receives ", { code: mixText(reading) }, reading.readable === 1 ? ": it can read only itself." : "."];
}

const PENDING = "–";

/**
 * The focused row, step by step: the query, then one line per token of the
 * sequence with its key, the score, what the mask adds, the exponential and
 * the weight. Columns of a step not reached yet hold a dash, so the table
 * keeps its shape while the reader steps through.
 *
 * In a wide figure the computation is always shown. In a narrow one it sits
 * in a closed <details> under the sentence, so the matrix and the control
 * bar stay close enough to be seen together on a phone. Both copies are in
 * the markup and a container query shows one; the hidden one is display:none,
 * so a screen reader meets the table once.
 */
export function Readout({ reader, reading, vectors, stage, causal }: ReadoutProps) {
  const token = TOKENS[reader];
  const showMask = stage >= 1;
  const showSoftmax = stage === 2;
  const weightSum = reading.weights.reduce((sum, weight) => sum + weight, 0);

  const computation = (
    <>
      <p className="at-query">
        Query of <span className="at-mono at-token">{token}</span>:{" "}
        <code className="at-mono">{formatVector(vectors.queries[reader])}</code>
      </p>
      <div className="at-scroll">
        <table className="at-steps">
          <caption className="sr-only">
            The row of {quote(token)}: key, score, mask, exponential and weight for each token it may read.
          </caption>
          <thead>
            <tr>
              <th scope="col" style={{ textAlign: "left" }}>
                Token
              </th>
              <th scope="col" className="at-key-col">
                Key
              </th>
              <th scope="col">Score</th>
              <th scope="col" className={showMask ? undefined : "at-pending"}>
                + mask
              </th>
              <th scope="col" className={showSoftmax ? undefined : "at-pending"}>
                e<sup>x</sup>
              </th>
              <th scope="col" className={showSoftmax ? undefined : "at-pending"}>
                Weight
              </th>
              <th scope="col" className="at-bar-col">
                <span className="sr-only">Weight as a bar</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {reading.scores.map((score, read) => {
              const masked = reading.mask[read] !== 0;
              const weight = reading.weights[read];
              const bar = { width: `calc(${weight * 100}% + 2px)`, backgroundColor: shadeOf(weight).fill } as CSSProperties;
              return (
                <tr key={TOKENS[read]} data-masked={showMask && masked ? "" : undefined}>
                  <th scope="row">{TOKENS[read]}</th>
                  <td className="at-key-col">{formatVector(vectors.keys[read])}</td>
                  <td>{formatNumber(score, 2)}</td>
                  <td className={showMask ? undefined : "at-pending"}>
                    {showMask ? formatNumber(reading.mask[read], 0) : PENDING}
                  </td>
                  <td className={showSoftmax ? undefined : "at-pending"}>
                    {showSoftmax ? (masked ? "0" : formatNumber(reading.exps[read], 2)) : PENDING}
                  </td>
                  <td className={showSoftmax ? undefined : "at-pending"}>
                    {showSoftmax ? (masked ? "0" : formatNumber(weight, 3)) : PENDING}
                  </td>
                  <td className="at-bar-col">
                    <div className="at-track" aria-hidden="true">
                      {showSoftmax && !masked ? <span className="at-bar" style={bar} /> : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" style={{ fontFamily: "inherit" }}>
                Sum
              </th>
              <td className="at-key-col" />
              <td />
              <td />
              <td>{showSoftmax ? formatNumber(reading.total, 2) : null}</td>
              {/* The sum of the unrounded weights; the note below says why the printed ones may not add up to it. */}
              <td>{showSoftmax ? `${formatNumber(weightSum, 3)}*` : null}</td>
              <td className="at-bar-col" />
            </tr>
          </tfoot>
        </table>
      </div>
      {showSoftmax ? (
        <p className="at-footnote">* Weights are printed to three decimals; unrounded, they add up to exactly 1.</p>
      ) : null}
    </>
  );

  return (
    <div className="at-readout">
      <p className="at-label">
        What <b className="at-mono">{token}</b> reads{causal ? "" : ", mask off"}
      </p>
      <p className="at-mix">
        <PhraseView phrase={stepPhrase(reader, reading, stage, causal)} />
      </p>
      <div className="at-wide-only">{computation}</div>
      <details className="at-narrow-only at-details">
        <summary>Show the computation</summary>
        {computation}
      </details>
    </div>
  );
}
