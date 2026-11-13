"use client";

import { Arrow, AnimationFrame, Cells, Label, Move } from "@/animations";

/** A camera image cut into a 4 x 4 grid of pieces; the cube sits in piece (row 1, column 2). */
const GRID = 4;
const TILE = 30;
const IMG = { x: 30, y: 46 };
const CUBE_TILE = 1 * GRID + 2;

/** In the row of pieces: 16 tiles of 22 with 3 between. */
const ROW_TILE = 22;
const ROW_GAP = 3.5;
const ROW_Y = 252;
const ROW_X0 = 240 - (GRID * GRID * (ROW_TILE + ROW_GAP) - ROW_GAP) / 2;

const SUMMARY = [0.7, 0.2, 0.9, 0.4, 0.6, 0.3, 0.8, 0.5];

export function OneVsMany() {
  return (
    <AnimationFrame
      title="One summary or every patch"
      description="A camera image shows a cube near the top. One design squeezes the whole image into a single summary vector, so where the cube is must be written into those numbers. The other cuts the image into a grid of patches and passes each patch as its own token; the cube's patch keeps its place in the row, so where the cube is comes built in."
      steps={[
        "A camera image, with the cube in one spot.",
        "Option one: squeeze the whole picture into one summary, a single list of numbers.",
        "Where the cube is must now be written into those numbers, somehow.",
        "Option two: cut the picture into patches, one token each.",
        "The cube's patch keeps its place in the row. Where is built in.",
      ]}
      size={[480, 290]}
    >
      {(step) => {
        const cut = step >= 3;
        return (
          <>
            {Array.from({ length: GRID * GRID }, (_, i) => {
              const row = Math.floor(i / GRID);
              const col = i % GRID;
              const home: [number, number] = [IMG.x + col * TILE, IMG.y + row * TILE];
              const inRow: [number, number] = [ROW_X0 + i * (ROW_TILE + ROW_GAP), ROW_Y - ROW_TILE / 2];
              const [x, y] = cut ? inRow : home;
              const scale = cut ? ROW_TILE / TILE : 1;
              const isCube = i === CUBE_TILE;
              return (
                <Move key={i} x={x} y={y} scale={scale} delay={cut ? i * 35 : 0}>
                  <rect
                    width={TILE}
                    height={TILE}
                    rx={cut ? 4 : 0}
                    className={`a-t t-vision a-fill-soft ${cut ? "a-stroke" : ""}`}
                    strokeWidth={1.5}
                  />
                  {isCube ? <rect x={7} y={9} width={16} height={16} rx={3} className="t-action a-fill" /> : null}
                  {isCube && step >= 4 ? <rect x={-3} y={-3} width={TILE + 6} height={TILE + 6} rx={6} className="t-mark a-stroke" strokeWidth={3} fill="none" /> : null}
                </Move>
              );
            })}
            <Label x={IMG.x + (GRID * TILE) / 2} y={28} tone="vision" size={14} weight={700} opacity={cut ? 0 : 1}>
              camera image
            </Label>

            <Arrow from={[166, 106]} to={[262, 106]} tone="muted" drawn={step >= 1} opacity={step >= 1 ? 1 : 0} />
            <Cells x={290} y={106} values={SUMMARY} tone="vision" cell={12} gap={3} direction="column" opacity={step >= 1 ? 1 : 0} delay={300} />
            <Label x={312} y={64} tone="ink" size={14} anchor="start" weight={700} opacity={step >= 1 ? 1 : 0} delay={300}>
              one summary
            </Label>
            <Label x={312} y={106} tone="muted" size={14} anchor="start" opacity={step >= 2 ? 1 : 0}>
              where? hidden in
            </Label>
            <Label x={312} y={126} tone="muted" size={14} anchor="start" opacity={step >= 2 ? 1 : 0}>
              the numbers
            </Label>

            <Label x={240} y={214} tone="ink" size={14} weight={700} opacity={cut ? 1 : 0}>
              many patches, one token each
            </Label>
            <Label x={ROW_X0 + CUBE_TILE * (ROW_TILE + ROW_GAP) + ROW_TILE / 2} y={ROW_Y + 26} tone="ink" size={13} opacity={step >= 4 ? 1 : 0}>
              the cube is here
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
