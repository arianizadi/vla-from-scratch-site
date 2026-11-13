"use client";

import { AnimationFrame, Arrow, Box, Bracket, Cells, Label, Move } from "@/animations";

/** Made-up numbers: one token's vector, and the two updates a block adds to it. */
const START = [0.3, 0.6, 0.2];
const ATTN = [0.3, 0.0, 0.4];
const FFN = [0.2, 0.3, 0.1];
const add = (a: number[], b: number[]) => a.map((value, index) => Math.min(1, Math.round((value + b[index]) * 100) / 100));
const AFTER_ATTN = add(START, ATTN);
const AFTER_FFN = add(AFTER_ATTN, FFN);

const STREAM_Y = 200;
const BOX_Y = 98;
const ATTN_X = 150;
const FFN_X = 330;
const PLUS_1 = 212;
const PLUS_2 = 392;
const VEC = [46, 252, 436];
const CELL = 13;

function Plus({ x, lit }: { x: number; lit: boolean }) {
  return (
    <g className={`a-t ${lit ? "t-accent" : "t-faint"}`} transform={`translate(${x} ${STREAM_Y})`}>
      <circle r={11} className="a-t a-stroke a-fill-surface" strokeWidth={1.5} />
      <path d="M-5 0H5M0 -5V5" className="a-t a-stroke" strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

export function ResidualStream() {
  return (
    <AnimationFrame
      title="Adding to the running notes"
      description="Each word's numbers travel along a running set of notes, the residual stream. A copy goes to attention, which gathers from the other words and works out an update; the update is added to the notes. The feed-forward network then works on each word alone and adds its update too. Blocks repeat this many times, and nothing written early is erased."
      steps={[
        "The running notes carry each word's numbers from start to finish.",
        "A copy goes to attention, which gathers from the other words and works out an update.",
        "The update is added to the notes. Nothing is erased.",
        "The feed-forward network works on each word alone and adds its update too.",
        "Blocks repeat this many times. What an early block writes stays readable to every later one.",
      ]}
      size={[480, 260]}
    >
      {(step) => {
        const vector = step >= 3 ? AFTER_FFN : step >= 2 ? AFTER_ATTN : START;
        const vx = step >= 3 ? VEC[2] : step >= 2 ? VEC[1] : VEC[0];
        return (
          <>
            <Arrow from={[16, STREAM_Y]} to={[466, STREAM_Y]} tone="faint" width={2} />
            <Label x={16} y={STREAM_Y + 34} tone="muted" size={14} anchor="start">
              running notes
            </Label>

            <Bracket x1={86} x2={404} y={34} label="one block, repeated many times" tone="muted" below opacity={step >= 4 ? 1 : 0} />

            <Box x={ATTN_X} y={BOX_Y} w={136} h={56} label="attention" sub="between words" active={step === 1} tone="ink" />
            <Arrow from={[96, STREAM_Y - 8]} to={[112, BOX_Y + 34]} bend={-8} tone={step === 1 ? "accent" : "faint"} width={1.5} />
            <Arrow from={[190, BOX_Y + 34]} to={[PLUS_1 - 4, STREAM_Y - 14]} bend={-8} tone={step === 2 ? "accent" : "faint"} width={1.5} />

            <Box x={FFN_X} y={BOX_Y} w={136} h={56} label="feed-forward" sub="each word alone" active={step === 3} tone="ink" />
            <Arrow from={[276, STREAM_Y - 8]} to={[292, BOX_Y + 34]} bend={-8} tone={step === 3 ? "accent" : "faint"} width={1.5} />
            <Arrow from={[370, BOX_Y + 34]} to={[PLUS_2 - 4, STREAM_Y - 14]} bend={-8} tone={step === 3 ? "accent" : "faint"} width={1.5} />

            <Plus x={PLUS_1} lit={step === 2} />
            <Plus x={PLUS_2} lit={step === 3} />

            <Move x={step >= 2 ? PLUS_1 : ATTN_X} y={step >= 2 ? STREAM_Y : 150} opacity={step === 1 ? 1 : 0}>
              <Cells x={0} y={0} values={ATTN} tone="accent" cell={CELL} gap={2} />
            </Move>
            <Move x={step >= 4 ? PLUS_2 : FFN_X} y={step >= 4 ? STREAM_Y : 150} opacity={step === 3 ? 1 : 0}>
              <Cells x={0} y={0} values={FFN} tone="accent" cell={CELL} gap={2} />
            </Move>
            <Label x={ATTN_X} y={172} tone="accent" size={13} opacity={step === 1 ? 1 : 0}>
              update
            </Label>
            <Label x={FFN_X} y={172} tone="accent" size={13} opacity={step === 3 ? 1 : 0}>
              update
            </Label>

            <Move x={vx} y={STREAM_Y} delay={step === 3 ? 700 : 0}>
              <rect x={-26} y={-12} width={52} height={24} rx={5} className="a-fill-surface" />
              <Cells x={0} y={0} values={vector} tone="language" cell={CELL} gap={2} />
            </Move>
          </>
        );
      }}
    </AnimationFrame>
  );
}
