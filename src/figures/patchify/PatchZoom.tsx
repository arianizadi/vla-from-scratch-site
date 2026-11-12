"use client";

import { useEffect, useRef } from "react";
import { count, scaled, type Cell, type Grid, type PixelRange, type Processor } from "./model";
import type { ObjectMask } from "./segment";
import type { FramePixels } from "./useFramePixels";

const CHANNELS = ["Red", "Green", "Blue"] as const;

/** The processors of the chapter's table, in words. */
const RANGE_WORDS: Record<PixelRange, string> = {
  none: "0 to 255 as is, no scaling",
  simple_vlm: "÷ 255, then (x − 0.5) / 0.5: −1 to 1",
};

/** A value after the processor: whole numbers stay whole; scaled ones get two decimals (computed here, not measured). */
function formatScaled(value: number, range: PixelRange): string {
  return range === "none" ? String(value) : value.toFixed(2).replace("-", "−");
}

export interface PatchZoomProps {
  src: string;
  grid: Grid;
  cell: Cell;
  /** Width of the vector a patch becomes. */
  tokenWidth: number;
  /** The pixel range each config hands the vision transformer. */
  processors: Processor[];
  pixels?: FramePixels;
  mask?: ObjectMask;
  /** On a narrow screen the steps from the patch to its token fold away behind a summary. */
  collapsed?: boolean;
}

/** Copies one channel of the patch into a canvas as grey levels, or the three channels one after another. */
function paint(canvas: HTMLCanvasElement | null, pixels: FramePixels, cell: Cell, patch: number, channels: number[]) {
  const context = canvas?.getContext("2d");
  if (!canvas || !context) return;
  const area = patch * patch;
  const image = context.createImageData(canvas.width, canvas.height);
  channels.forEach((channel, block) => {
    for (let index = 0; index < area; index += 1) {
      const x = cell.x + (index % patch);
      const y = cell.y + Math.floor(index / patch);
      const level = pixels.data[(y * pixels.size + x) * 4 + channel];
      // A single plane keeps its square; the flattened vector (one row) runs red, then green, then blue.
      const target = (block * area + index) * 4;
      image.data[target] = level;
      image.data[target + 1] = level;
      image.data[target + 2] = level;
      image.data[target + 3] = 255;
    }
  });
  context.putImageData(image, 0, 0);
}

/**
 * The focused patch up close: its pixels, the three grids of numbers they
 * are (red, green, blue), the one list those become, the range the processor
 * puts them in, and the linear layer that turns the list into the token.
 */
export function PatchZoom({
  src,
  grid,
  cell,
  tokenWidth,
  processors,
  pixels,
  mask,
  collapsed = false,
}: PatchZoomProps) {
  const { patch } = grid;
  const zoom = Math.max(4, Math.floor(144 / patch));
  const side = patch * zoom;
  const numbers = patch * patch * 3;
  const planes = useRef<(HTMLCanvasElement | null)[]>([]);
  const vector = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!pixels) return;
    CHANNELS.forEach((_, channel) => paint(planes.current[channel], pixels, cell, patch, [channel]));
    paint(vector.current, pixels, cell, patch, [0, 1, 2]);
  }, [pixels, cell, patch]);

  // The first number of the list: the red value of the patch's top-left pixel.
  const first = pixels ? pixels.data[(cell.y * pixels.size + cell.x) * 4] : undefined;

  const inPatch = mask
    ? mask.pixels.filter((index) => {
        const x = index % mask.frameSize;
        const y = Math.floor(index / mask.frameSize);
        return x >= cell.x && x < cell.x + patch && y >= cell.y && y < cell.y + patch;
      }).length
    : 0;

  const steps = (
    <>
      <p className="pf-step-label">Three grids of numbers, 0 to 255</p>
      <div className="pf-planes">
        {CHANNELS.map((name, channel) => (
          <figure key={name} className="pf-plane">
            <canvas
              ref={(element) => {
                planes.current[channel] = element;
              }}
              width={patch}
              height={patch}
              style={{ width: patch * 3, height: patch * 3 }}
              aria-hidden="true"
            />
            <figcaption>{name}</figcaption>
          </figure>
        ))}
      </div>

      <p className="pf-step-label">
        Flattened into one list, channel by channel: 3 × {patch} × {patch} = {count(numbers)} numbers
      </p>
      <div className="pf-vector-wrap">
        <canvas ref={vector} className="pf-vector" width={numbers} height={1} aria-hidden="true" />
        <div className="pf-vector-ticks" aria-hidden="true">
          {CHANNELS.map((name) => (
            <span key={name}>{name.charAt(0)}</span>
          ))}
        </div>
      </div>

      <p className="pf-step-label">The range the processor hands the layer</p>
      <ul className="pf-ranges">
        {processors.map((processor) => (
          <li key={processor.configs.join()}>
            <span className="pf-configs">
              {processor.configs.map((config, index) => (
                <span key={config}>
                  {index > 0 ? ", " : null}
                  <code>{config}</code>
                </span>
              ))}
            </span>
            <span>
              {RANGE_WORDS[processor.range]}
              {first !== undefined ? (
                <>
                  {" "}
                  (first number: {first} → {formatScaled(scaled(first, processor.range), processor.range)})
                </>
              ) : null}
            </span>
          </li>
        ))}
      </ul>

      <p className="pf-step-label pf-shape">
        <code>[{numbers}]</code>
        <span aria-hidden="true">→</span>
        <span>one linear layer</span>
        <span aria-hidden="true">→</span>
        <code>[{tokenWidth}]</code>
      </p>
      <p className="pf-small">
        The same layer for every patch. Its output is token {cell.token}, a vector of {tokenWidth} numbers.
      </p>
    </>
  );

  return (
    <div className="pf-zoom">
      <div className="pf-zoom-pixels" style={{ width: side }}>
        <div className="pf-zoom-box" style={{ width: side, height: side }}>
          <div
            className="pf-zoom-image"
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: `${grid.size * zoom}px ${grid.size * zoom}px`,
              backgroundPosition: `${-cell.x * zoom}px ${-cell.y * zoom}px`,
            }}
          />
          <svg
            className="pf-zoom-overlay"
            viewBox={`${cell.x} ${cell.y} ${patch} ${patch}`}
            width={side}
            height={side}
            aria-hidden="true"
            focusable="false"
          >
            {mask ? (
              <>
                <path d={mask.outline} className="pf-outline-halo" vectorEffect="non-scaling-stroke" />
                <path d={mask.outline} className="pf-outline" vectorEffect="non-scaling-stroke" />
              </>
            ) : null}
          </svg>
        </div>
        <svg className="pf-zoom-dim" width={side} height={22} aria-hidden="true" focusable="false">
          <g className="pf-dim">
            <line x1={0.5} x2={side - 0.5} y1={8} y2={8} />
            <line x1={0.5} x2={0.5} y1={3} y2={13} />
            <line x1={side - 0.5} x2={side - 0.5} y1={3} y2={13} />
          </g>
          <rect x={side / 2 - 22} y={0} width={44} height={18} className="pf-dim-gap" />
          <text x={side / 2} y={13} textAnchor="middle" className="fig-axis-text pf-dim-text">
            {patch} px
          </text>
        </svg>
        <p className="pf-small">
          {count(patch * patch)} pixels
          {mask ? (
            <>
              , <strong>{count(inPatch)}</strong> of them the object
            </>
          ) : null}
        </p>
      </div>

      {collapsed ? (
        <details className="pf-zoom-steps pf-zoom-more">
          <summary>From the patch to its token: the numbers, their range, the layer</summary>
          {steps}
        </details>
      ) : (
        <div className="pf-zoom-steps">{steps}</div>
      )}
    </div>
  );
}
