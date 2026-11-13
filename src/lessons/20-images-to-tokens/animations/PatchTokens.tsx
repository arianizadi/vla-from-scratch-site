"use client";

import { AnimationFrame, Arrow, Box, Cells, Label, Move, stagger } from "@/animations";
import { CUBE, GRID, PATCHES } from "./scene";

const FX = 24;
const FY = 52;
const CELL = 14;
const SIDE = GRID * CELL;
const RIGHT = 352;

/** Centre of the patch the drawing follows (the cube's). */
const PATCH: [number, number] = [FX + CUBE[1] * CELL + CELL / 2, FY + CUBE[0] * CELL + CELL / 2];

/** Grid lines between the patches, drawn in the paper colour so they cut the picture. */
const GRID_LINES = Array.from({ length: GRID - 1 }, (_, i) => {
  const offset = (i + 1) * CELL;
  return `M${FX + offset} ${FY}V${FY + SIDE}M${FX} ${FY + offset}H${FX + SIDE}`;
}).join("");

/** The colour numbers of one patch, shown as 10 cells (made-up values). */
const FLAT = [0.9, 1, 0.8, 0.95, 0.7, 1, 0.85, 0.75, 1, 0.9];
/** The patch's token (made-up values). */
const TOKEN = [0.3, 0.85, 0.15, 0.6, 0.95, 0.4];
/** The first patches of the picture, row by row, as they leave as tokens. */
const ROW = PATCHES[0].slice(0, 7);

export function PatchTokens() {
  return (
    <AnimationFrame
      title="A picture becomes a row of tokens"
      description="A camera picture is a grid of coloured dots. It is cut into a 14 by 14 grid of square tiles called patches. One patch's colour numbers are laid out in a line, and one shared learned recipe turns them into a token. Every patch goes through the same recipe, so the picture becomes a row of tokens, read from the top left."
      steps={[
        "A camera picture: a grid of tiny coloured dots.",
        "Cut it into square tiles, called patches: 14 across, 14 down.",
        "Take one patch and lay its colour numbers out in a line.",
        "One shared recipe squeezes them into a token.",
        "Every patch goes through the same recipe: a row of tokens, like words.",
      ]}
      size={[480, 290]}
    >
      {(step) => (
        <>
          <g className="t-vision">
            {PATCHES.map((row, r) =>
              row.map((value, c) => (
                <rect
                  key={`${r}-${c}`}
                  x={FX + c * CELL}
                  y={FY + r * CELL}
                  width={CELL}
                  height={CELL}
                  className="a-fill"
                  style={{ fillOpacity: Math.round((0.12 + 0.88 * value) * 100) / 100 }}
                />
              )),
            )}
          </g>
          <path d={GRID_LINES} className="a-t" style={{ stroke: "var(--surface)", opacity: step >= 1 ? 1 : 0 }} strokeWidth={2} fill="none" />
          <rect x={FX} y={FY} width={SIDE} height={SIDE} rx={2} fill="none" className="t-faint a-stroke" strokeWidth={1.5} />
          <rect
            x={PATCH[0] - CELL / 2 - 2}
            y={PATCH[1] - CELL / 2 - 2}
            width={CELL + 4}
            height={CELL + 4}
            rx={3}
            fill="none"
            className="a-t"
            style={{ stroke: "var(--mark)", opacity: step >= 2 && step <= 3 ? 1 : 0 }}
            strokeWidth={3}
          />

          <Label x={FX + SIDE / 2} y={30} tone="muted" opacity={step === 0 ? 1 : 0}>
            camera picture
          </Label>
          <Label x={FX + SIDE / 2} y={30} tone="vision" weight={700} opacity={step >= 1 && step <= 3 ? 1 : 0}>
            196 patches
          </Label>
          <Label x={FX + SIDE / 2} y={30} tone="accent" weight={700} opacity={step === 4 ? 1 : 0}>
            read row by row
          </Label>

          <Arrow from={[FX + SIDE + 8, PATCH[1]]} to={[RIGHT - 70, 70]} bend={-20} tone="faint" drawn={step >= 2 && step <= 3} opacity={step >= 2 && step <= 3 ? 1 : 0} />
          <Label x={RIGHT} y={44} tone="muted" size={14} opacity={step >= 2 && step <= 3 ? 1 : 0}>
            one patch&apos;s colours
          </Label>
          <Cells x={RIGHT} y={72} values={FLAT} tone="vision" cell={10} gap={2} opacity={step >= 2 && step <= 3 ? 1 : 0} />

          <Arrow from={[RIGHT, 86]} to={[RIGHT, 110]} tone="faint" drawn={step === 3} opacity={step === 3 ? 1 : 0} />
          <Box x={RIGHT} y={134} w={150} h={40} label="same recipe" tone="ink" opacity={step >= 3 ? 1 : 0} active={step === 4} />
          <Arrow from={[RIGHT, 156]} to={[RIGHT, 178]} tone="faint" drawn={step === 3} opacity={step === 3 ? 1 : 0} />
          <Cells x={RIGHT} y={196} values={TOKEN} tone="vision" cell={14} gap={3} opacity={step === 3 ? 1 : 0} />
          <Label x={RIGHT} y={222} tone="vision" size={14} weight={700} opacity={step === 3 ? 1 : 0}>
            one token
          </Label>

          {ROW.map((value, i) => (
            <Move key={i} x={step === 4 ? 274 + i * 24 : RIGHT} y={step === 4 ? 200 : 134} opacity={step === 4 ? 1 : 0} delay={step === 4 ? stagger(i, 90) : 0}>
              <Cells x={0} y={0} values={[value + 0.3, 0.8 - value / 2, value + 0.1]} tone="vision" cell={9} gap={2} direction="column" />
            </Move>
          ))}
          <Label x={RIGHT + 92} y={200} tone="faint" size={16} weight={700} opacity={step === 4 ? 1 : 0}>
            …
          </Label>
          <Label x={RIGHT} y={240} tone="vision" size={14} weight={700} opacity={step === 4 ? 1 : 0}>
            196 tokens
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
