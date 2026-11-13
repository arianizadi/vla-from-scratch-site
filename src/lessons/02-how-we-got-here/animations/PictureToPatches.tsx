"use client";

import { AnimationFrame, Arrow, Chip, Label, stagger } from "@/animations";

/** A 4 by 3 picture: how much of each square the cube (or the can) fills. Toy values. */
const COLS = 4;
const ROWS = 3;
const SHADE = [0.05, 0.05, 0.1, 0.05, 0.1, 0.5, 0.15, 0.05, 0.25, 0.9, 0.35, 0.2];
const CUBE_CELLS = new Set([5, 9]);

const CELL = 40;
const GRID_X = 240 - (COLS * CELL) / 2;
const GRID_Y = 30;
const ROW_CELL = 30;
const GHOST = 0.65;
const ROW_GAP = 6;
const ROW_Y = 176;
const ROW_X = 240 - (SHADE.length * ROW_CELL + (SHADE.length - 1) * ROW_GAP) / 2;

export function PictureToPatches() {
  return (
    <AnimationFrame
      title="A picture becomes a row of patches"
      description="A camera picture is cut into a grid of small squares called patches. The patches are laid out in a row, like the words of a sentence, so the same kind of model that reads words can read the picture. Pairing pictures with captions then teaches which patches show a red cube."
      steps={[
        "A camera picture.",
        "Cut it into small squares: patches.",
        "Lay them out in a row, like words in a sentence.",
        "Pictures paired with captions teach what the patches show.",
      ]}
      size={[480, 270]}
    >
      {(step) => (
        <>
          {SHADE.map((shade, index) => {
            const col = index % COLS;
            const row = Math.floor(index / COLS);
            const inRow = step >= 2;
            const cut = step >= 1;
            const size = inRow ? ROW_CELL : cut ? CELL - 6 : CELL;
            const x = inRow ? ROW_X + index * (ROW_CELL + ROW_GAP) + ROW_CELL / 2 : GRID_X + col * CELL + CELL / 2;
            const y = inRow ? ROW_Y : GRID_Y + row * CELL + CELL / 2;
            const cube = CUBE_CELLS.has(index);
            return (
              <g
                key={index}
                className={`a-t ${cube ? "t-action" : "t-vision"}`}
                style={{ transform: `translate(${x}px, ${y}px)`, transitionDelay: `${inRow ? stagger(index, 45) : 0}ms` }}
              >
                <rect
                  className="a-t a-fill"
                  x={-size / 2}
                  y={-size / 2}
                  width={size}
                  height={size}
                  rx={cut ? 4 : 0}
                  style={{ fillOpacity: 0.16 + 0.8 * shade }}
                />
                {step >= 3 && cube ? (
                  <rect className="a-t chip-ring" x={-size / 2 - 4} y={-size / 2 - 4} width={size + 8} height={size + 8} rx={7} />
                ) : null}
              </g>
            );
          })}

          <g className="a-t" style={{ opacity: step >= 2 ? 0.75 : 0, transform: `translate(${240 - GHOST * (COLS * CELL) / 2}px, 18px) scale(${GHOST})` }}>
            {SHADE.map((shade, index) => (
              <rect
                key={index}
                className={`a-fill ${CUBE_CELLS.has(index) ? "t-action" : "t-vision"}`}
                x={(index % COLS) * CELL + 2}
                y={Math.floor(index / COLS) * CELL + 2}
                width={CELL - 4}
                height={CELL - 4}
                rx={4}
                style={{ fillOpacity: 0.16 + 0.8 * shade }}
              />
            ))}
          </g>
          <Label x={240} y={ROW_Y - 36} tone="vision" size={14} weight={700} opacity={step >= 2 ? 1 : 0}>
            12 patches, read like 12 words
          </Label>

          <Chip x={240} y={244} text="a red cube on a table" tone="language" size={14} mono={false} opacity={step >= 3 ? 1 : 0} />
          <Arrow from={[300, 232]} to={[ROW_X + 9 * (ROW_CELL + ROW_GAP) + ROW_CELL / 2, ROW_Y + 22]} bend={-14} tone="language" width={1.5} drawn={step >= 3} />
          <Label x={GRID_X + COLS * CELL + 16} y={GRID_Y + (ROWS * CELL) / 2} tone="muted" size={14} anchor="start" opacity={step <= 1 ? 1 : 0}>
            {step === 0 ? "a picture" : "patches"}
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
