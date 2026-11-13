"use client";

import { AnimationFrame, Chip, Dot, Label, stagger } from "@/animations";

/** Every token compares itself with every token: n tokens make an n x n square of comparisons. */
const SMALL = 4;
const BIG = 8;
const GAP = 20;
const GRID_X = 220;
const GRID_Y = 92;
const AXIS_GAP = 20;

export function Handshakes() {
  return (
    <AnimationFrame
      title="Double the tokens, four times the work"
      description="Inside the model every token compares itself with every other, like guests at a party who all shake hands. Four tokens make a 4 by 4 square of comparisons, 16 in all. Eight tokens make 64: double the tokens, four times the work. Every patch of four camera pictures is hundreds of tokens, so the detail costs work each time the robot acts."
      steps={[
        "Four tokens. Each one compares itself with every token.",
        "That is a 4 by 4 square: 16 comparisons.",
        "Double to 8 tokens: 64 comparisons, four times the work.",
        "Every patch of four pictures is hundreds of tokens, paid each time the robot acts.",
      ]}
      size={[480, 290]}
    >
      {(step) => {
        const n = step >= 2 ? BIG : SMALL;
        return (
          <>
            {Array.from({ length: BIG }, (_, i) => (
              <g key={`axis-${i}`}>
                <Chip x={GRID_X - AXIS_GAP - 10} y={GRID_Y + i * GAP} text="" width={16} size={9} tone="vision" opacity={i < n ? 1 : 0} delay={stagger(i)} />
                <Chip x={GRID_X + i * GAP} y={GRID_Y - AXIS_GAP - 10} text="" width={16} size={9} tone="vision" opacity={i < n ? 1 : 0} delay={stagger(i)} />
              </g>
            ))}
            {Array.from({ length: BIG * BIG }, (_, k) => {
              const r = Math.floor(k / BIG);
              const c = k % BIG;
              const on = step >= 1 && r < n && c < n;
              const fresh = step >= 2 && (r >= SMALL || c >= SMALL);
              return (
                <Dot
                  key={k}
                  x={GRID_X + c * GAP}
                  y={GRID_Y + r * GAP}
                  r={5}
                  tone={fresh ? "accent" : "ink"}
                  opacity={on ? 1 : 0}
                  delay={on ? (r + c) * 30 : 0}
                />
              );
            })}

            <Label x={100} y={110} tone="muted" size={14} opacity={step <= 1 ? 1 : 0}>
              4 tokens
            </Label>
            <Label x={100} y={136} tone="ink" size={20} weight={700} opacity={step === 1 ? 1 : 0}>
              16
            </Label>
            <Label x={100} y={110} tone="muted" size={14} opacity={step >= 2 ? 1 : 0}>
              8 tokens
            </Label>
            <Label x={100} y={136} tone="accent" size={20} weight={700} opacity={step >= 2 ? 1 : 0}>
              64
            </Label>
            <Label x={100} y={160} tone="muted" size={14} opacity={step >= 1 ? 1 : 0}>
              comparisons
            </Label>
            <Label x={GRID_X + 70} y={262} tone="accent" size={14} weight={700} opacity={step === 3 ? 1 : 0}>
              hundreds of tokens: huge squares
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
