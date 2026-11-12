import type { CSSProperties } from "react";
import type { Batch } from "./algorithm";
import {
  ACTION_TOKEN_ID,
  ACTION_TOKEN_LABEL,
  COLUMNS,
  FOLDED,
  FOLLOWED,
  OTHER,
  OUTCOMES,
  PAD_LABEL,
  count,
  shapeOf,
  type Arrival,
  type Placement,
  type Prompt,
} from "./model";

export interface ViewProps {
  placement: Placement;
  arrival: Arrival;
}

/** A CSS custom property on an element, typed. */
function vars(values: Record<`--${string}`, number>): CSSProperties {
  return values as CSSProperties;
}

/** The geometry the stylesheet works from (see padding-shift.css). */
const GEOMETRY = vars({
  "--cols-wide": COLUMNS,
  "--cols-narrow": FOLDED > 0 ? COLUMNS - FOLDED + 1 : COLUMNS,
  "--skip-narrow": FOLDED > 0 ? FOLDED - 1 : 0,
});

const POSITIONS = Array.from({ length: COLUMNS }, (_, index) => index);

/** The fold on a narrow stage: one cell with a break line for its right edge. */
function BreakCell() {
  return (
    <div className="ps-slot ps-break">
      <svg className="ps-break-shape" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false" aria-hidden="true">
        <path d="M0 0.5H88L99 25L88 50L99 75L88 99.5H0Z" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="ps-break-label">&hellip;</span>
    </div>
  );
}

interface RowProps {
  prompt: Prompt;
  /** Index of the extra token in this row. */
  token: number;
  /** Indices of the row's padding positions in the batch. */
  pads: readonly number[];
  /** The padding is not there: the prompt is served alone. */
  unpadded: boolean;
  /** This is the prompt the figure follows. */
  followed: boolean;
  /** The row is not part of what the model receives. */
  absent?: boolean;
  /** Columns the row would fill; sizes the outline drawn in its place when absent. */
  length?: number;
}

function Row({ prompt, token, pads, unpadded, followed, absent = false, length = 0 }: RowProps) {
  return (
    <div
      className="ps-track ps-row"
      data-absent={absent}
      style={vars({ "--ghost-columns": length })}
    >
      {FOLDED > 0 ? <BreakCell /> : null}
      {prompt.cells.map((cell, index) => (
        <div
          key={index}
          className={`ps-slot ${cell.word ? "" : "ps-template"} ${index < FOLDED ? "ps-folded" : ""}`}
          style={vars({ "--index": index })}
        >
          <div className="ps-token">{cell.label}</div>
        </div>
      ))}
      {pads.map((index, ordinal) => (
        <div
          key={`pad-${ordinal}`}
          className="ps-slot ps-pad"
          data-hidden={unpadded}
          style={vars({ "--index": index })}
        >
          <div className="ps-token">
            <span>{PAD_LABEL}</span>
          </div>
        </div>
      ))}
      <div
        className={`ps-slot ${followed ? "ps-action" : "ps-action-other"}`}
        style={vars({ "--index": token })}
      >
        <div className="ps-token">{ACTION_TOKEN_LABEL}</div>
      </div>
      {followed ? null : <div className="ps-ghost">not in this request</div>}
    </div>
  );
}

/** "12 ids at positions 0 to 11, 1 pad at position 12, the action token at position 13". */
function describeRow(batch: Batch, row: number): string {
  const kinds = batch.ids[row].map((id, index) =>
    id === ACTION_TOKEN_ID ? "token" : batch.mask[row][index] === 0 ? "pad" : "id",
  );
  const parts: string[] = [];
  let start = 0;
  while (start < kinds.length) {
    let end = start;
    while (end + 1 < kinds.length && kinds[end + 1] === kinds[start]) end += 1;
    const where = end === start ? `position ${start}` : `positions ${start} to ${end}`;
    if (kinds[start] === "token") parts.push(`the action token at ${where}`);
    else parts.push(`${count(end - start + 1, kinds[start])} at ${where}`);
    start = end + 1;
  }
  return parts.join(", ");
}

/** Tokens per row of a batch. */
function lengthOf(batch: Batch): number {
  return batch.ids[0]?.length ?? 0;
}

/** What the drawing shows in its current state, in words and numbers. */
export function describeDrawing({ placement, arrival }: ViewProps): string {
  const outcome = OUTCOMES[placement];
  const drawn = arrival === "alone" ? outcome.alone[0] : outcome.batch;
  const ruler = `under a ruler of positions 0 to ${lengthOf(drawn) - 1}`;
  if (arrival === "batch") {
    return (
      `Token ids of two prompts as one training batch of shape ${shapeOf(outcome.batch)}, drawn as two rows of cells ${ruler}. ` +
      `"${FOLLOWED.text}": ${describeRow(outcome.batch, 0)}. ` +
      `"${OTHER.text}": ${describeRow(outcome.batch, 1)}.`
    );
  }
  return (
    `Token ids of one prompt served alone, shape ${shapeOf(outcome.alone[0])}, drawn as one row of cells ${ruler}. ` +
    `"${FOLLOWED.text}": ${describeRow(outcome.alone[0], 0)}. Nothing is padded.`
  );
}

/**
 * The tensor the model receives, one cell per token: the two prompts as a
 * padded batch, or the followed prompt alone. Above it a ruler of positions
 * marks where the extra token is now (highlighter) and where it is on the
 * other path (dashed), with a dimension line between the two when they differ.
 */
export function Drawing({ placement, arrival }: ViewProps) {
  const outcome = OUTCOMES[placement];
  const alone = arrival === "alone";
  const here = alone ? outcome.followed.alone : outcome.followed.batch;
  const there = alone ? outcome.followed.batch : outcome.followed.alone;
  const tensor = alone ? outcome.alone[0] : outcome.batch;
  const length = lengthOf(tensor);

  // The dimension line spans the token's two positions wherever padding separates them.
  // Appending is the case that separates them; inserting never does.
  const widest = OUTCOMES.append.followed;
  const low = Math.min(widest.batch.index, widest.alone.index);
  const span = widest.shift + 1;
  const inset = 50 / span;

  return (
    <div className="ps-drawing" style={GEOMETRY} role="img" aria-label={describeDrawing({ placement, arrival })}>
      <div className="ps-track ps-strip">
        <code className="ps-shape">input_ids {shapeOf(tensor)}</code>
        <div
          className="ps-dimension"
          data-hidden={outcome.followed.shift === 0}
          style={vars({ "--lo": low, "--span": span })}
        >
          <span className="ps-dimension-label">{count(widest.shift, "position")}</span>
          <svg className="ps-dimension-line" focusable="false" aria-hidden="true">
            <line x1={`${inset}%`} x2={`${100 - inset}%`} y1="5.5" y2="5.5" />
            {[inset, 100 - inset].map((x) => (
              <svg key={x} x={`${x}%`} y="5.5" overflow="visible">
                <line x1="0" x2="0" y1="-4" y2="10" />
                <line x1="-3.5" x2="3.5" y1="3.5" y2="-3.5" />
              </svg>
            ))}
          </svg>
        </div>
      </div>

      <div className="ps-track ps-ruler">
        {FOLDED > 0 ? (
          <div className="ps-slot ps-break ps-tick">0&ndash;{FOLDED - 1}</div>
        ) : null}
        {POSITIONS.map((index) => (
          <div
            key={index}
            className={`ps-slot ps-tick ${index < FOLDED ? "ps-folded" : ""}`}
            // Past the end of the drawn tensor a position is shown only where the dashed echo
            // marks the token on the other path.
            data-hidden={index >= length && index !== there.index}
            style={vars({ "--index": index })}
          >
            {index}
          </div>
        ))}
        <div
          className="ps-slot ps-echo"
          data-hidden={there.index === here.index}
          style={vars({ "--index": there.index })}
        >
          <span />
        </div>
        <div className="ps-slot ps-cursor" style={vars({ "--index": here.index })}>
          <span>{here.index}</span>
        </div>
      </div>

      <div className="ps-rows">
        <Row
          prompt={FOLLOWED}
          token={here.index}
          pads={outcome.followed.batch.pads}
          unpadded={alone}
          followed
        />
        <Row
          prompt={OTHER}
          token={outcome.other.batch.index}
          pads={outcome.other.batch.pads}
          unpadded={false}
          followed={false}
          absent={alone}
          length={outcome.other.batch.length}
        />
      </div>
    </div>
  );
}
