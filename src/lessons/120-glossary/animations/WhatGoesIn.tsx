"use client";

import { AnimationFrame, Arrow, Cells, Chip, Label, stagger } from "@/animations";

const ROWS = [62, 146, 230];
const RAW_X = 70;
const OUT_X = 214;
const TERM_X = 314;

const TERMS = [
  { name: "tokens", plain: "pieces of text", tone: "language" as const },
  { name: "patches", plain: "picture squares", tone: "vision" as const },
  { name: "state", plain: "joint angles", tone: "ink" as const },
];

const PATCHES = [
  [0.15, 0.5, 0.2],
  [0.3, 0.9, 0.25],
];
const STATE = [0.5, 0.3, 0.75, 0.2, 0.6, 0.45, 0.55, 1];

export function WhatGoesIn() {
  return (
    <AnimationFrame
      title="What goes in"
      description="Three inputs and their names. Text is cut into tokens. A camera picture is cut into patches. The arm's joint angles and gripper opening form the state."
      steps={[
        "Words are cut into tokens: pieces of text.",
        "A camera picture is cut into patches: small squares.",
        "The arm reports its state: joint angles and gripper opening.",
      ]}
      size={[480, 280]}
    >
      {(step) => (
        <>
          <Chip x={RAW_X} y={ROWS[0]} text="pick up" tone="ink" variant="outline" size={15} mono={false} />
          {["pick", "␣up"].map((token, index) => (
            <Chip key={token} x={OUT_X - 30 + index * 64} y={ROWS[0]} text={token} tone="language" size={15} opacity={step >= 0 ? 1 : 0} delay={stagger(index, 80)} />
          ))}

          <g className="a-t" style={{ opacity: step >= 1 ? 1 : 0.2 }}>
            <rect className="t-vision a-fill-soft a-stroke" x={RAW_X - 40} y={ROWS[1] - 28} width={80} height={56} rx={8} strokeWidth={1.5} />
            <path className="t-vision a-stroke" d={`M${RAW_X - 40} ${ROWS[1] + 10}H${RAW_X + 40}`} strokeWidth={1} />
            <rect className="t-action a-fill" x={RAW_X + 6} y={ROWS[1] - 4} width={14} height={14} rx={2} />
          </g>
          <g className="a-t" style={{ opacity: step >= 1 ? 1 : 0 }}>
            {PATCHES.map((row, index) => (
              <Cells key={index} x={OUT_X} y={ROWS[1] - 11 + index * 22} values={row} tone="vision" cell={19} gap={3} />
            ))}
          </g>

          <g className="a-t t-ink" style={{ opacity: step >= 2 ? 1 : 0.2 }}>
            <path className="a-stroke" d={`M${RAW_X - 30} ${ROWS[2] + 18}L${RAW_X - 12} ${ROWS[2] - 14}L${RAW_X + 22} ${ROWS[2] - 4}`} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle className="a-fill-surface a-stroke" cx={RAW_X - 12} cy={ROWS[2] - 14} r={5} strokeWidth={2} />
            <path className="a-stroke" d={`M${RAW_X - 44} ${ROWS[2] + 20}H${RAW_X - 16}`} strokeWidth={3} strokeLinecap="round" />
          </g>
          <Cells x={OUT_X} y={ROWS[2]} values={STATE} tone="ink" cell={11} gap={3} opacity={step >= 2 ? 1 : 0} />

          {ROWS.map((y, index) => (
            <Arrow key={y} from={[RAW_X + 48, y]} to={[OUT_X - 66, y]} tone="faint" width={1.5} drawn={step >= index} />
          ))}

          {TERMS.map((term, index) => (
            <g key={term.name}>
              <Label x={TERM_X} y={ROWS[index] - 10} tone={term.tone} size={16} weight={700} anchor="start" opacity={step >= index ? 1 : 0}>
                {term.name}
              </Label>
              <Label x={TERM_X} y={ROWS[index] + 12} tone="muted" size={13} anchor="start" opacity={step >= index ? 1 : 0}>
                {term.plain}
              </Label>
            </g>
          ))}
        </>
      )}
    </AnimationFrame>
  );
}
