"use client";

import { Fragment, type ReactNode } from "react";
import {
  CHANGE_MARK,
  GRADIENT_DIGITS,
  LOSS_DIGITS,
  SQUARE_DIGITS,
  STAGES,
  STAGE_NAME,
  approx,
  change,
  factor,
  loss,
  lossDigits,
  num,
  pass,
  rateText,
  update,
  type Weights,
} from "./model";

const V = ({ children }: { children: ReactNode }) => <i className="ts-var">{children}</i>;

interface StripProps {
  stage: number;
  before: Weights;
  after: Weights;
  onSelect: (stage: number) => void;
}

/**
 * The four stages of one optimisation step, in order. The current one carries
 * the highlighter; each stage already reached shows its result in one line.
 */
export function StageStrip({ stage, before, after, onSelect }: StripProps) {
  const current = pass(before);
  const results = [
    <>
      {current.rows.length} predictions
    </>,
    <>
      <V>L</V> = {num(current.loss)}
    </>,
    <>
      ∂<V>L</V>/∂<V>w</V> {num(current.gradient.w, GRADIENT_DIGITS)}, ∂<V>L</V>/∂<V>b</V>{" "}
      {num(current.gradient.b, GRADIENT_DIGITS)}
    </>,
    <>
      <V>w</V> {num(after.w)}, <V>b</V> {num(after.b)}
    </>,
  ];

  return (
    <ol className="ts-strip" aria-label="Stages of one optimisation step">
      {STAGES.map((name, index) => (
        <li key={name}>
          <button
            type="button"
            className="ts-stage"
            aria-current={index === stage ? "step" : undefined}
            onClick={() => onSelect(index)}
          >
            <span className="ts-stage-name">
              <span className="ts-stage-number">{index + 1}</span>
              {STAGE_NAME[name]}
            </span>
            {/* A stage not yet reached keeps its result's space, so the strip does not grow while stepping. */}
            <span
              className={index <= stage ? "ts-stage-result" : "ts-stage-result ts-key-later"}
              aria-hidden={index <= stage ? undefined : true}
            >
              {results[index]}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

interface SheetProps {
  stage: number;
  before: Weights;
  after: Weights;
  rate: number;
}

/**
 * Every number of the current stage, as a worked table. All four tables are
 * laid out in the same place and only the current one is shown, so the plate
 * is as tall on every stage and the controls below never move.
 */
export function Worksheet({ stage, before, after, rate }: SheetProps) {
  const sheets = [
    <ForwardSheet key="forward" before={before} />,
    <LossSheet key="loss" before={before} />,
    <BackwardSheet key="backward" before={before} />,
    <UpdateSheet key="update" before={before} after={after} rate={rate} />,
  ];
  return (
    <div className="ts-sheets">
      {sheets.map((sheet, index) => (
        <div key={index} className={index === stage ? "ts-sheet-slot" : "ts-sheet-slot ts-sheet-hidden"} aria-hidden={index === stage ? undefined : true}>
          {sheet}
        </div>
      ))}
    </div>
  );
}

function ForwardSheet({ before }: { before: Weights }) {
  const { rows } = pass(before);
  return (
    <Sheet
      formula={
        <>
          <V>ŷ</V> = <V>w</V>·<V>x</V> + <V>b</V>, with <V>w</V> = {num(before.w)} and <V>b</V> = {num(before.b)}
        </>
      }
      head={["Example", <V key="x">x</V>, <>
        <V>w</V>·<V>x</V> + <V>b</V>
      </>, <V key="p">ŷ</V>]}
      body={rows.map((row, index) => [
        String(index + 1),
        num(row.x, 0),
        `${factor(before.w)} × ${factor(row.x, 0)} + ${factor(before.b)}`,
        num(row.prediction),
      ])}
      caption="Forward: the model's prediction for each input of the batch."
      wideColumn={2}
    />
  );
}

function LossSheet({ before }: { before: Weights }) {
  const current = pass(before);
  return (
    <Sheet
      formula={
        <>
          <V>L</V> = mean of (<V>ŷ</V> − <V>y</V>)² over the batch
        </>
      }
      head={["Example", <V key="p">ŷ</V>, <V key="y">y</V>, <>
        <V>ŷ</V> − <V>y</V>
      </>, <>
        (<V>ŷ</V> − <V>y</V>)²
      </>]}
      body={current.rows.map((row, index) => [
        String(index + 1),
        num(row.prediction),
        num(row.y),
        num(row.error),
        num(row.squared, SQUARE_DIGITS),
      ])}
      foot={{
        label: (
          <>
            Mean, <V>L</V>
          </>
        ),
        values: [<strong key="l">{approx(current.loss, LOSS_DIGITS, current.lossExact)}</strong>],
      }}
      caption="Loss: each prediction compared with its target, the error squared, and the mean: one number."
    />
  );
}

function BackwardSheet({ before }: { before: Weights }) {
  const current = pass(before);
  return (
    <Sheet
      formula={
        <>
          ∂<V>L</V>/∂<V>w</V> = mean of 2(<V>ŷ</V> − <V>y</V>)·<V>x</V>, ∂<V>L</V>/∂<V>b</V> = mean of 2(<V>ŷ</V> − <V>y</V>)
        </>
      }
      head={["Example", <V key="x">x</V>, <>
        <V>ŷ</V> − <V>y</V>
      </>, <>
        2(<V>ŷ</V> − <V>y</V>)·<V>x</V>
      </>, <>
        2(<V>ŷ</V> − <V>y</V>)
      </>]}
      body={current.rows.map((row, index) => [String(index + 1), num(row.x, 0), num(row.error), num(row.gradW), num(row.gradB)])}
      foot={{
        label: (
          <>
            Mean: ∂<V>L</V>/∂<V>w</V> and ∂<V>L</V>/∂<V>b</V>
          </>
        ),
        values: [
          <strong key="w">{num(current.gradient.w, GRADIENT_DIGITS)}</strong>,
          <strong key="b">{num(current.gradient.b, GRADIENT_DIGITS)}</strong>,
        ],
      }}
      caption="Backward: how much the loss changes when each weight changes a little, from every example's error."
    />
  );
}

function UpdateSheet({ before, after, rate }: { before: Weights; after: Weights; rate: number }) {
  const current = pass(before);
  const { step, rounded } = update(before, current.gradient, rate);
  const lossAfter = loss(after);
  const outcome = change(current.loss, lossAfter);
  const markOf = CHANGE_MARK[outcome];
  const digits = lossDigits(current.loss, lossAfter);
  return (
    <Sheet
      formula={
        <>
          new weight = weight − <V>η</V> × gradient, with learning rate <V>η</V> = {rateText(rate)}; the weights are kept to
          two decimals, so the step is rounded
        </>
      }
      head={["Weight", "Before", "Gradient", <>
        −<V>η</V> × gradient
      </>, "After"]}
      body={[
        [<V key="w">w</V>, num(before.w), num(current.gradient.w, GRADIENT_DIGITS), approx(step.w, 2, !rounded.w), num(after.w)],
        [<V key="b">b</V>, num(before.b), num(current.gradient.b, GRADIENT_DIGITS), approx(step.b, 2, !rounded.b), num(after.b)],
      ]}
      outcome={
        <p className="ts-outcome">
          <span className={markOf.className} aria-hidden="true">
            {markOf.glyph}
          </span>{" "}
          Loss {num(current.loss, digits)} before the step, {num(lossAfter, digits)} after: {outcome}.
        </p>
      }
      caption="Update: each weight moves against its gradient, by the learning rate times the gradient."
    />
  );
}

interface TableProps {
  formula: ReactNode;
  head: ReactNode[];
  body: ReactNode[][];
  /** The last row: a label spanning the first columns, then the values under the last ones. */
  foot?: { label: ReactNode; values: ReactNode[] };
  caption: string;
  /** A column of working-out that is dropped on narrow screens. */
  wideColumn?: number;
  /** A line under the table. */
  outcome?: ReactNode;
}

function Sheet({ formula, head, body, foot, caption, wideColumn, outcome }: TableProps) {
  const cell = (index: number) => (index === wideColumn ? "ts-wide-only" : undefined);
  return (
    <div className="ts-sheet">
      <p className="ts-formula">{formula}</p>
      <div className="ts-table-wrap">
        <table className="ts-table">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {head.map((content, index) => (
                <th key={index} scope="col" className={cell(index)}>
                  {content}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((content, index) =>
                  index === 0 ? (
                    <th key={index} scope="row">
                      {content}
                    </th>
                  ) : (
                    <td key={index} className={cell(index)}>
                      {content}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
          {foot ? (
            <tfoot>
              <tr>
                <th scope="row" colSpan={head.length - foot.values.length}>
                  {foot.label}
                </th>
                {foot.values.map((content, index) => (
                  <td key={index}>{content}</td>
                ))}
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
      {outcome}
    </div>
  );
}

interface HistoryProps {
  path: readonly Weights[];
  /** How many losses have been computed so far: the points path[0] up to path[count - 1]. */
  count: number;
}

/**
 * The loss at the start and after every step, as far as the walk has computed
 * them. A hidden copy with every step reserves the height of the full list,
 * so the line does not grow into the controls as the walk goes on.
 */
export function LossHistory({ path, count }: HistoryProps) {
  const line = (shown: number, hidden: boolean) => {
    const losses = path.slice(0, shown).map(loss);
    return (
      <p className={hidden ? "ts-history ts-history-ghost" : "ts-history"} aria-hidden={hidden ? true : undefined}>
        <span className="ts-history-label">Loss so far</span>{" "}
        {losses.length === 0 ? <span>none yet: the first loss is computed at the loss stage</span> : null}
        {losses.map((value, index) => (
          // The arrow sits between the items, after a space, so the line can break before it.
          <Fragment key={index}>
            {index > 0 ? <span aria-hidden="true"> →</span> : null}{" "}
            <span className="ts-history-item">
              <span className="sr-only">{index === 0 ? "at the start " : `after step ${index} `}</span>
              {num(value)}
            </span>
          </Fragment>
        ))}
      </p>
    );
  };
  return (
    <div className="ts-history-slot">
      {line(path.length, true)}
      {line(count, false)}
    </div>
  );
}
