"use client";

import { AnimationFrame, Arrow, Box, Cells, Chip, Label, stagger } from "@/animations";

/** Toy rows: what one example becomes on each path. Row 1 differs until it is fixed. */
const ROWS = [
  { name: "size", a: [0.5, 0.5, 0.5, 0.5, 0.5], b: [0.5, 0.5, 0.5, 0.5, 0.5] },
  { name: "range", a: [0.15, 0.4, 0.6, 0.85, 0.3], b: [1, 1, 1, 1, 1] },
  { name: "values", a: [0.7, 0.2, 0.5, 0.3, 0.9], b: [0.7, 0.2, 0.5, 0.3, 0.9] },
];
const COL_A = 196;
const COL_B = 356;
const MID = (COL_A + COL_B) / 2;
const rowY = (i: number) => 140 + i * 44;

export function OneExample() {
  return (
    <AnimationFrame
      title="Taste the same spoonful from both kitchens"
      description="One stored example is prepared on the training path and on the serving path. The two results are compared row by row: size, range and values. The range row differs, which is the skew. After the fix, all rows match, and a small automatic test keeps it that way."
      steps={[
        "Take one stored example.",
        "Prepare it on the training path.",
        "Prepare the very same example on the serving path.",
        "Compare row by row. The range differs: there is the skew.",
        "Fix it, and add a small automatic test so it cannot come back.",
      ]}
      size={[480, 290]}
      still={3}
    >
      {(step) => {
        const fixed = step >= 4;
        return (
          <>
            <Box x={276} y={36} w={170} h={40} label="one stored example" tone="vision" filled />
            <Arrow from={[236, 58]} to={[COL_A, 98]} tone={step === 1 ? "accent" : "faint"} drawn={step >= 1} />
            <Arrow from={[316, 58]} to={[COL_B, 98]} tone={step === 2 ? "accent" : "faint"} drawn={step >= 2} />
            <Label x={COL_A} y={112} tone="ink" size={14} weight={700} opacity={step >= 1 ? 1 : 0}>
              training path
            </Label>
            <Label x={COL_B} y={112} tone="ink" size={14} weight={700} opacity={step >= 2 ? 1 : 0}>
              serving path
            </Label>

            {ROWS.map((row, i) => {
              const differs = row.name === "range" && !fixed;
              return (
                <g key={row.name}>
                  <Label x={16} y={rowY(i)} tone="muted" size={14} anchor="start" opacity={step >= 1 ? 1 : 0}>
                    {row.name}
                  </Label>
                  <Cells x={COL_A} y={rowY(i)} values={row.a} tone="vision" cell={16} opacity={step >= 1 ? 1 : 0} delay={stagger(i, 80)} />
                  <Cells x={COL_B} y={rowY(i)} values={fixed ? row.a : row.b} tone="vision" cell={16} opacity={step >= 2 ? 1 : 0} delay={stagger(i, 80)} />
                  <Label
                    x={MID}
                    y={rowY(i)}
                    tone={differs ? "failure" : "success"}
                    size={18}
                    weight={700}
                    opacity={step >= 3 ? 1 : 0}
                    delay={stagger(i, 150)}
                  >
                    {differs ? "≠" : "="}
                  </Label>
                  <rect
                    x={COL_B - 56}
                    y={rowY(i) - 17}
                    width={112}
                    height={34}
                    rx={8}
                    className="a-t t-mark a-stroke"
                    fill="none"
                    strokeWidth={3}
                    style={{ opacity: differs && step === 3 ? 1 : 0 }}
                  />
                </g>
              );
            })}

            <Chip x={276} y={268} text="✓ locked by a test" tone="accent" variant="solid" mono={false} size={14} opacity={fixed ? 1 : 0} />
          </>
        );
      }}
    </AnimationFrame>
  );
}
