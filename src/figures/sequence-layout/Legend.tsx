"use client";

import { STYLE_LABEL, type CellStyle } from "./model";

const SIZE = 12;
/** How far the swatch of a token that names the object reaches above the others. */
const RAISE = 5;

/** A swatch drawn like the cells, so the key matches the drawing in both themes. */
function Swatch({ style }: { style: CellStyle }) {
  const outlined =
    style === "placeholder" ||
    style === "clean" ||
    style === "empty" ||
    style === "unsplit";
  const inset = outlined ? 0.5 : 0;
  if (style === "key") {
    // Next to a plain text cell, as in the drawing: the taller cell is the one that names the object.
    return (
      <svg
        width={2 * SIZE + 2}
        height={SIZE + RAISE}
        viewBox={`0 0 ${2 * SIZE + 2} ${SIZE + RAISE}`}
        aria-hidden="true"
      >
        <rect
          className="sl-cell"
          data-s="language"
          x={0}
          y={RAISE}
          width={SIZE}
          height={SIZE}
        />
        <rect
          className="sl-cell"
          data-s="key"
          x={SIZE + 2}
          y={0}
          width={SIZE}
          height={SIZE + RAISE}
        />
      </svg>
    );
  }
  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      aria-hidden="true"
    >
      {style === "state" ? (
        <>
          <rect
            className="sl-hatch-ground"
            x={0.5}
            y={0.5}
            width={SIZE - 1}
            height={SIZE - 1}
          />
          <path
            className="sl-hatch-line"
            d="M0 9L9 0M3 12L12 3M-1 4L4 -1M8 13L13 8"
          />
          <rect
            className="sl-cell"
            data-s="state"
            x={0.5}
            y={0.5}
            width={SIZE - 1}
            height={SIZE - 1}
            fill="none"
          />
        </>
      ) : (
        <rect
          className="sl-cell"
          data-s={style}
          x={inset}
          y={inset}
          width={SIZE - 2 * inset}
          height={SIZE - 2 * inset}
        />
      )}
      {style === "summary" ? (
        <path className="sl-cell-half" d={`M${SIZE} 0V${SIZE}H0Z`} />
      ) : null}
    </svg>
  );
}

/** The key to the cells the current config uses, and to the marks drawn over them. */
export function Legend({
  styles,
  targets,
  changed,
}: {
  styles: CellStyle[];
  targets: boolean;
  changed: boolean;
}) {
  const pair = 2 * SIZE + 2;
  return (
    <ul className="fig-legend sl-legend" aria-label="Key">
      {styles.map((style) => (
        <li key={style}>
          <Swatch style={style} />
          {STYLE_LABEL[style]}
        </li>
      ))}
      {targets ? (
        <>
          <li>
            <svg
              width={pair}
              height={SIZE + 5}
              viewBox={`0 0 ${pair} ${SIZE + 5}`}
              aria-hidden="true"
            >
              <rect className="sl-cell" data-s="language" width={SIZE} height={SIZE} />
              <rect
                className="sl-cell"
                data-s="language"
                x={SIZE + 2}
                width={SIZE}
                height={SIZE}
              />
              <rect className="sl-target-bar" y={SIZE + 2} width={pair} height={2} />
            </svg>
            scored as a target (underlined)
          </li>
          <li>
            <svg
              width={pair}
              height={SIZE}
              viewBox={`0 0 ${pair} ${SIZE}`}
              aria-hidden="true"
            >
              <g className="sl-muted">
                <rect className="sl-cell" data-s="language" width={SIZE} height={SIZE} />
                <rect
                  className="sl-cell"
                  data-s="vision"
                  x={SIZE + 2}
                  width={SIZE}
                  height={SIZE}
                />
              </g>
            </svg>
            not scored (faded)
          </li>
        </>
      ) : null}
      {changed ? (
        <li>
          <svg
            width={pair + 4}
            height={SIZE + 4}
            viewBox={`0 0 ${pair + 4} ${SIZE + 4}`}
            aria-hidden="true"
          >
            <rect className="sl-cell" data-s="key" x={2} y={2} width={SIZE} height={SIZE} />
            <rect
              className="sl-cell"
              data-s="key"
              x={SIZE + 4}
              y={2}
              width={SIZE}
              height={SIZE}
            />
            <rect
              className="sl-changed"
              x={0.75}
              y={0.75}
              width={pair + 2.5}
              height={SIZE + 2.5}
            />
          </svg>
          changed with the instruction
        </li>
      ) : null}
    </ul>
  );
}
