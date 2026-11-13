"use client";

import { AnimationFrame, Arrow, Chip, Label, stagger } from "@/animations";

/** Two pick_target instructions: 5 ids and 6 ids with this tokenizer (one token per word here). */
const ROWS = [
  ["pick", "␣up", "␣the", "␣red", "␣cube"],
  ["pick", "␣up", "␣the", "␣yellow", "␣T", "␣block"],
];
const LENGTH = 6;
const SLOT = 68;
const X0 = 70;
const xAt = (index: number) => X0 + index * SLOT;
const ROW_Y = [66, 156];

export function PaddingMask() {
  return (
    <AnimationFrame
      title="Padding and the mask"
      description="Two instructions have 5 and 6 tokens. A batch must be a rectangle, so the shorter row gets one pad token at its end. A second grid, the mask, marks real tokens with 1 and the pad with 0. Because the model reads left to right and the pad sits at the right end, no real token ever looks at it."
      steps={[
        "Two instructions, 5 and 6 tokens long.",
        "Stacked together they must form a grid: the short row gets a blank pad at its end.",
        "The mask says which slots are real: 1 for a word, 0 for a blank.",
        "The model reads left to right, and the pad comes last, so no real token sees it.",
      ]}
      size={[480, 270]}
    >
      {(step) => (
        <>
          {ROWS.map((row, rowIndex) =>
            row.map((token, index) => (
              <Chip
                key={`${rowIndex}-${index}`}
                x={xAt(index)}
                y={ROW_Y[rowIndex]}
                text={token}
                tone="language"
                size={14}
                width={62}
              />
            )),
          )}
          <Chip x={xAt(5)} y={ROW_Y[0]} text="pad" tone="faint" variant="outline" size={14} width={62} opacity={step >= 1 ? 1 : 0} scale={step >= 1 ? 1 : 0.6} />

          {ROWS.map((row, rowIndex) =>
            Array.from({ length: LENGTH }, (_, index) => {
              const real = index < row.length;
              return (
                <Label
                  key={`mask-${rowIndex}-${index}`}
                  x={xAt(index)}
                  y={ROW_Y[rowIndex] + 36}
                  tone={real ? "ink" : "failure"}
                  size={15}
                  weight={700}
                  mono
                  opacity={step >= 2 ? 1 : 0}
                  delay={stagger(index, 60)}
                >
                  {real ? "1" : "0"}
                </Label>
              );
            }),
          )}
          <Label x={20} y={ROW_Y[0] + 36} tone="faint" size={13} anchor="start" opacity={step >= 2 ? 1 : 0}>
            mask
          </Label>
          <Label x={20} y={ROW_Y[1] + 36} tone="faint" size={13} anchor="start" opacity={step >= 2 ? 1 : 0}>
            mask
          </Label>

          <Arrow from={[xAt(0) - 20, 238]} to={[xAt(5) + 20, 238]} tone="accent" drawn={step >= 3} flow={step >= 3} width={2.5} />
          <Label x={240} y={258} tone="accent" size={14} opacity={step >= 3 ? 1 : 0}>
            each token sees only what came before it
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
