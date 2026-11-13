"use client";

import { AnimationFrame, Arrow, Box, Chip, Label } from "@/animations";

const N = 7;
const CELL = 18;
const GAP = 3;
const GX = 30;
const GY = 96;
const SPAN = N * CELL + (N - 1) * GAP;
/** Patches hidden from the student in this made-up fill-in-the-blanks example. */
const MASKED = new Set([8, 10, 16, 24, 30, 33, 38, 44]);

const shade = (i: number) => 0.3 + (((i * 7) % 5) / 4) * 0.5;
const at = (i: number): [number, number] => [GX + (i % N) * (CELL + GAP), GY + Math.floor(i / N) * (CELL + GAP)];

const LOSS: [number, number] = [384, 160];

export function WhatTheLossReads() {
  return (
    <AnimationFrame
      title="What the grade reads"
      description="An encoder turns a picture into patch tokens and one summary token. Encoders trained by caption matching are graded only on the summary, compared with a caption, so no grade asks a single patch to be right. Encoders trained to fill in hidden patches use no text: their grade reads the summary and every hidden patch, so the patch tokens themselves are trained."
      steps={[
        "An encoder turns a picture into patch tokens plus one summary token.",
        "Caption matching grades only the summary, against a caption.",
        "No grade ever asks a single patch to be right.",
        "Fill-in-the-blanks training hides patches and grades each hidden one.",
      ]}
      size={[480, 290]}
    >
      {(step) => {
        const clip = step <= 2;
        return (
          <>
            <Chip x={GX + SPAN / 2} y={52} text="summary" tone="vision" variant="solid" size={15} active={step >= 1} />
            <Label x={GX + SPAN / 2} y={GY + SPAN + 22} tone={step === 2 ? "failure" : "muted"} size={14} weight={step === 2 ? 700 : 400}>
              {step < 2 ? "patch tokens" : step === 2 ? "patches: never graded" : "patch tokens"}
            </Label>
            {Array.from({ length: N * N }, (_, i) => {
              const [x, y] = at(i);
              const read = !clip && MASKED.has(i);
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={y}
                    width={CELL}
                    height={CELL}
                    rx={3}
                    className="a-t t-vision a-fill"
                    style={{ fillOpacity: Math.round(shade(i) * 100) / 100, opacity: step === 2 ? 0.3 : 1 }}
                  />
                  <rect
                    x={x - 2}
                    y={y - 2}
                    width={CELL + 4}
                    height={CELL + 4}
                    rx={4}
                    fill="none"
                    className="a-t"
                    style={{ stroke: "var(--mark)", opacity: read ? 1 : 0 }}
                    strokeWidth={3}
                  />
                </g>
              );
            })}

            <Label x={LOSS[0]} y={36} tone="ink" size={16} weight={700} opacity={clip ? 1 : 0}>
              caption matching
            </Label>
            <Label x={LOSS[0]} y={36} tone="ink" size={16} weight={700} opacity={clip ? 0 : 1}>
              fill in the blanks
            </Label>
            <Box x={LOSS[0]} y={LOSS[1]} w={150} h={50} label="grade" sub={clip ? "vs caption" : "vs hidden patches"} tone="ink" active={step >= 1} />
            <Arrow from={[GX + SPAN / 2 + 40, 52]} to={[LOSS[0] - 80, LOSS[1] - 14]} bend={-18} tone="ink" drawn={step >= 1} opacity={step >= 1 ? 1 : 0} />
            <Arrow from={[GX + SPAN + 10, GY + SPAN / 2]} to={[LOSS[0] - 80, LOSS[1] + 8]} tone="ink" drawn={step === 3} opacity={step === 3 ? 1 : 0} />

            <Chip x={LOSS[0]} y={248} text="a caption" tone="language" size={14} opacity={clip ? 1 : 0} />
            <Arrow from={[LOSS[0], 232]} to={[LOSS[0], 190]} tone="language" drawn={step >= 1 && clip} opacity={step >= 1 && clip ? 1 : 0} />

            <Label x={LOSS[0]} y={248} tone="vision" size={14} weight={700} opacity={step === 3 ? 1 : 0}>
              hidden patches
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
