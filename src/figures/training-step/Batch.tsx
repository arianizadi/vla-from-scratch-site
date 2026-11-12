"use client";

import { useId } from "react";
import { Axis } from "@/figures/kit";
import { arrowHead, equalAspectPlot, HALO, svgId } from "./geometry";
import { SQUARE_DIGITS, START, num, pass, predict, type Row, type Weights } from "./model";

/** The drawn part of the (input, target) plane, the same scale on both axes so a gap is drawn to size. */
const X_DOMAIN: [number, number] = [-1.5, 2.5];
const Y_DOMAIN: [number, number] = [-1.2, 2.6];
const X_TICKS = [-1, 0, 1, 2];
const Y_TICKS = [-1, 0, 1, 2];

/**
 * The strip under the plot: one slot per example, with its number above and
 * its value below. Loss shows each squared error as a square, backward each
 * example's share of dL/dw as a bar, update the squares after the step. It is
 * always laid out, so the drawing keeps its height from stage to stage.
 */
const STRIP = { gap: 14, title: 14, number: 16, glyph: 56, value: 18, slot: 48, between: 10 } as const;
const STRIP_HEIGHT = STRIP.gap + STRIP.title + STRIP.number + STRIP.glyph + STRIP.value;

/** One scale for the whole walk, set by the first step, so squares can be compared from step to step. */
const START_ROWS = pass(START).rows;
const SQUARE_SCALE = STRIP.glyph / Math.max(...START_ROWS.map((row) => Math.abs(row.error)));
const SHARE_SCALE = STRIP.glyph / 2 / Math.max(...START_ROWS.map((row) => Math.abs(row.gradW)));

interface BatchProps {
  width: number;
  before: Weights;
  after: Weights;
  /** 0 forward, 1 loss, 2 backward, 3 update. */
  stage: number;
  label: string;
}

/**
 * The batch: four examples as (input, target) points and the model as the
 * line w * x + b through them. Forward puts a prediction on the line above
 * each input; the loss is the gap to each target, squared (drawn as squares
 * under the plot); backward shows which way each example pulls and how much it
 * counts for w; after the update the line has moved.
 */
export function Batch({ width, before, after, stage, label }: BatchProps) {
  const clip = svgId(useId(), "batch");
  const plot = equalAspectPlot(width, X_DOMAIN, Y_DOMAIN);
  const shown = stage >= 3 ? after : before;
  const rows = pass(shown).rows;
  const beforeRows = pass(before).rows;
  const height = plot.height + STRIP_HEIGHT;

  const line = (weights: Weights) => ({
    x1: plot.x(X_DOMAIN[0]),
    y1: plot.y(predict(weights, X_DOMAIN[0])),
    x2: plot.x(X_DOMAIN[1]),
    y2: plot.y(predict(weights, X_DOMAIN[1])),
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="ts-svg" role="img" aria-label={label}>
      <defs>
        <clipPath id={clip}>
          <rect x={plot.left} y={plot.top} width={plot.right - plot.left} height={plot.bottom - plot.top} />
        </clipPath>
      </defs>

      <rect x={plot.left} y={plot.top} width={plot.right - plot.left} height={plot.bottom - plot.top} className="ts-plot-area" />
      <Axis scale={plot.x} orientation="bottom" offset={plot.bottom} ticks={X_TICKS} format={(v) => num(v, 0)} label="Input x" />
      <Axis scale={plot.y} orientation="left" offset={plot.left} ticks={Y_TICKS} format={(v) => num(v, 0)} label="Target y, prediction ŷ" />

      <g clipPath={`url(#${clip})`}>
        {/* The model before the step, kept faint once the step has moved it. */}
        {stage >= 3 ? <line {...line(before)} className="ts-model-before" /> : null}
        <line key={stage >= 3 ? "after" : "before"} {...line(shown)} className="ts-model" />

        {/* Errors: the gap from each prediction to its target. On backward, an arrowhead shows the pull. */}
        {stage === 1 || stage === 2
          ? beforeRows.map((row, index) => {
              const x = plot.x(row.x);
              const y1 = plot.y(row.prediction);
              const y2 = plot.y(row.y);
              return (
                <g key={index}>
                  <line x1={x} x2={x} y1={y1} y2={y2} className={stage === 2 ? "ts-pull" : "ts-error"} />
                  {stage === 2 && Math.abs(y2 - y1) > 14 ? (
                    <path
                      d={arrowHead(x, y1, x, y2 + (y2 > y1 ? -6 : 6), 8)}
                      className="ts-pull-head ts-enter ts-fade"
                    />
                  ) : null}
                </g>
              );
            })
          : null}

        {/* Predictions on the line. */}
        {rows.map((row, index) => (
          <rect
            key={index}
            x={plot.x(row.x) - 4.5}
            y={plot.y(row.prediction) - 4.5}
            width={9}
            height={9}
            className="ts-prediction"
          />
        ))}
      </g>

      {/* Targets, numbered as the rows of the table. */}
      {rows.map((row, index) => (
        <g key={index}>
          <circle cx={plot.x(row.x)} cy={plot.y(row.y)} r={5} className="ts-target" />
          <text x={plot.x(row.x) - 9} y={plot.y(row.y) - 7} textAnchor="end" className="ts-label ts-label-muted" style={HALO}>
            {index + 1}
          </text>
        </g>
      ))}

      <Strip top={plot.height} left={plot.left} right={plot.right} stage={stage} beforeRows={beforeRows} afterRows={pass(after).rows} />
    </svg>
  );
}

/** Rough width of 13 px label text per character. */
const CHAR_PX = 6.8;

/**
 * The values under the slots, as exact as the room allows: all digits when
 * they fit side by side, else fewer, marked "≈" (only for weights that have
 * run far off, at a rate that diverges).
 */
function stripValues(values: number[], digits: number, room: number): string[] {
  for (const shown of [digits, 2, 0]) {
    const texts = values.map((value) => {
      const text = num(value, shown);
      return shown < digits && Number(value.toFixed(digits)) !== Number(value.toFixed(shown)) ? `≈ ${text}` : text;
    });
    const width = texts.reduce((sum, text) => sum + Math.max(STRIP.slot, text.length * CHAR_PX + 4), 0) + 3 * STRIP.between;
    if (width <= room || shown === 0) return texts;
  }
  return values.map((value) => num(value, 0));
}

interface StripProps {
  top: number;
  left: number;
  right: number;
  stage: number;
  beforeRows: Row[];
  afterRows: Row[];
}

function Strip({ top, left, right, stage, beforeRows, afterRows }: StripProps) {
  const titleY = top + STRIP.gap + STRIP.title - 3;
  if (stage === 0) {
    return (
      <text x={left} y={titleY} className="ts-label ts-label-muted">
        Squared errors: drawn here from the loss stage on
      </text>
    );
  }
  const numberY = titleY + STRIP.number;
  const glyphTop = numberY + 4;
  const glyphBottom = glyphTop + STRIP.glyph;
  const valueY = glyphBottom + STRIP.value - 3;
  const room = right - left;

  if (stage === 2) {
    // Backward: each example's share of dL/dw, 2 (prediction - y) x, as a bar up (positive) or down.
    const largest = Math.max(...beforeRows.map((row) => Math.abs(row.gradW)));
    const scale = Math.min(SHARE_SCALE, largest > 0 ? STRIP.glyph / 2 / largest : SHARE_SCALE);
    const slot = Math.min(STRIP.slot + 12, (room - 3 * STRIP.between) / 4);
    const shares = stripValues(
      beforeRows.map((row) => row.gradW),
      2,
      room,
    );
    const middle = glyphTop + STRIP.glyph / 2;
    return (
      <g className="ts-enter ts-fade">
        <text x={left} y={titleY} className="ts-label ts-label-muted">
          {`Each example's part of ∂L/∂w, 2(ŷ − y)·x${scale < SHARE_SCALE ? ", smaller scale" : ""}`}
        </text>
        <line x1={left} x2={left + 4 * slot + 3 * STRIP.between} y1={middle} y2={middle} className="ts-strip-base" />
        {beforeRows.map((row, index) => {
          const cx = left + index * (slot + STRIP.between) + slot / 2;
          const size = Math.abs(row.gradW) * scale;
          return (
            <g key={index}>
              <text x={cx} y={numberY} textAnchor="middle" className="ts-label ts-label-muted">
                {index + 1}
              </text>
              {size > 0.5 ? (
                <rect x={cx - 9} y={row.gradW > 0 ? middle - size : middle} width={18} height={size} className="ts-share" />
              ) : null}
              <text x={cx} y={valueY} textAnchor="middle" className="ts-label">
                {shares[index]}
              </text>
            </g>
          );
        })}
      </g>
    );
  }

  // Loss and update: each error squared, as a square. Update also outlines the squares before the step.
  const rows = stage === 3 ? afterRows : beforeRows;
  const sides = (list: Row[]) => list.map((row) => Math.abs(row.error));
  const largest = Math.max(...sides(rows), ...(stage === 3 ? sides(beforeRows) : []));
  const texts = stripValues(
    rows.map((row) => row.squared),
    SQUARE_DIGITS,
    room,
  );
  const textWidth = (index: number) => texts[index].length * CHAR_PX + 4;
  const slotFor = (side: number, scale: number, index: number) => Math.max(STRIP.slot, side * scale, textWidth(index));
  const fits = (scale: number) =>
    largest * scale <= STRIP.glyph &&
    rows.reduce((sum, row, index) => sum + slotFor(Math.max(Math.abs(row.error), Math.abs(beforeRows[index].error)), scale, index), 0) +
      3 * STRIP.between <=
      room;
  let scale = SQUARE_SCALE;
  if (!fits(scale)) scale = Math.min(scale, largest > 0 ? STRIP.glyph / largest : scale);
  while (!fits(scale) && scale > 0.01) scale *= 0.9;

  const slots: { x: number; width: number; side: number; outline: number }[] = [];
  let x = left;
  for (const [index, row] of rows.entries()) {
    const previous = Math.abs(beforeRows[index].error);
    const outline = stage === 3 ? previous * scale : 0;
    const side = Math.abs(row.error) * scale;
    const width = slotFor(Math.max(Math.abs(row.error), stage === 3 ? previous : 0), scale, index);
    slots.push({ x, width, side, outline });
    x += width + STRIP.between;
  }

  return (
    <g key={stage} className="ts-enter ts-fade">
      <text x={left} y={titleY} className="ts-label ts-label-muted">
        {stage === 3 ? "Squared errors after the step; outline: before" : "Squared errors, (ŷ − y)², as squares"}
        {scale < SQUARE_SCALE ? ", smaller scale" : ""}
      </text>
      {slots.map(({ x: slotX, width, side, outline }, index) => {
        const cx = slotX + width / 2;
        return (
          <g key={index}>
            <text x={cx} y={numberY} textAnchor="middle" className="ts-label ts-label-muted">
              {index + 1}
            </text>
            {outline > 0.5 ? (
              <rect x={cx - outline / 2} y={glyphBottom - outline} width={outline} height={outline} className="ts-square-before" />
            ) : null}
            {side > 0.5 ? (
              <rect x={cx - side / 2} y={glyphBottom - side} width={side} height={side} className="ts-square" />
            ) : null}
            <text x={cx} y={valueY} textAnchor="middle" className="ts-label">
              {texts[index]}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** The key to the batch drawing, in HTML so it wraps. Every item is always laid out, so nothing moves. */
export function BatchLegend({ stage }: { stage: number }) {
  return (
    <ul className="fig-legend ts-legend" aria-label="Key to the batch drawing">
      <li>
        <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden="true">
          <circle cx={7} cy={7} r={4.5} className="ts-target" />
        </svg>
        target y
      </li>
      <li>
        <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden="true">
          <rect x={2.5} y={2.5} width={9} height={9} className="ts-prediction" />
        </svg>
        prediction ŷ
      </li>
      <li>
        <svg width={22} height={14} viewBox="0 0 22 14" aria-hidden="true">
          <line x1={1} x2={21} y1={7} y2={7} className="ts-model" />
        </svg>
        model ŷ = w·x + b
      </li>
      <li className={stage >= 3 ? undefined : "ts-key-later"} aria-hidden={stage >= 3 ? undefined : true}>
        <svg width={22} height={14} viewBox="0 0 22 14" aria-hidden="true">
          <line x1={1} x2={21} y1={7} y2={7} className="ts-model-before" />
        </svg>
        before the step
      </li>
    </ul>
  );
}
