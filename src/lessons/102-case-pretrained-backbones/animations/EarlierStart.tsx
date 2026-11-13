"use client";

import { AnimationFrame, Axes, Bracket, Label, Line, Path, scale, type Tone } from "@/animations";

/**
 * Went for the named object, % of 100 tries, averaged weights, at each saved
 * snapshot (lab notebook, "From-scratch VLA, every token, no history"; the
 * chapter's rows). Samples in millions.
 */
const SAMPLES = [0.25, 0.5, 0.75, 1.0, 1.2, 1.5, 2.0, 2.5, 3.0];
const RUNS: { name: string; tone: Tone; values: number[]; legendX: number }[] = [
  { name: "pretrained backbone", tone: "accent", values: [97, 100, 100, 99, 100, 100, 100, 100, 100], legendX: 60 },
  { name: "blank backbone", tone: "ink", values: [28, 33, 37, 68, 95, 97, 100, 100, 100], legendX: 260 },
];

const P = { x: 60, y: 56, w: 380, h: 170 };
const sx = scale([0, 3], [P.x, P.x + P.w]);
const sy = scale([0, 100], [P.y + P.h, P.y]);
const CHANCE_Y = Math.round(sy(100 / 3));

export function EarlierStart() {
  return (
    <AnimationFrame
      title="Same curve, an earlier start"
      description="How often each robot went for the named object at each saved snapshot of training. The pretrained one does so in 97 of 100 tries from its first snapshot. The blank one stays near guessing, one in three, until about three quarters of a million training examples later, then rises the same way. By the end both go for the named object every time."
      steps={[
        "How often the robot goes for the named object, as training goes on. Guessing gives 1 in 3.",
        "The pretrained backbone: on target from its very first snapshot.",
        "The blank backbone: guessing at first, then the same rise.",
        "The gap: about three quarters of a million training examples. Same curve, shifted.",
      ]}
      size={[480, 300]}
      hold={[2600, 2400, 2600, 3800]}
    >
      {(step) => (
        <>
          <Axes x={P.x} y={P.y} w={P.w} h={P.h} xLabel="training examples, millions →" xTicks={["0", "1", "2", "3"]} />
          <Label x={P.x - 8} y={sy(100)} tone="muted" size={13} anchor="end">
            100
          </Label>
          <Label x={P.x - 8} y={CHANCE_Y} tone="failure" size={13} anchor="end">
            33
          </Label>
          <Path d={`M${P.x} ${CHANCE_Y}H${P.x + P.w}`} tone="failure" width={1.5} dashed />
          <Label x={P.x + P.w} y={CHANCE_Y + 16} tone="failure" size={13} anchor="end">
            guessing
          </Label>
          {RUNS.map((run, i) => {
            const shown = step >= i + 1;
            return (
              <g key={run.name}>
                <Line points={SAMPLES.map((s, k) => [Math.round(sx(s)), Math.round(sy(run.values[k]))])} tone={run.tone} width={3} dots drawn={shown} />
                <Path d={`M${run.legendX} 22H${run.legendX + 18}`} tone={run.tone} width={3} opacity={shown ? 1 : 0} />
                <Label x={run.legendX + 24} y={22} tone={run.tone} size={13} weight={700} anchor="start" opacity={shown ? 1 : 0}>
                  {run.name}
                </Label>
              </g>
            );
          })}
          <Bracket x1={Math.round(sx(0.25))} x2={Math.round(sx(1.0))} y={sy(100) + 34} label="the gap" tone="accent" below opacity={step === 3 ? 1 : 0} />
        </>
      )}
    </AnimationFrame>
  );
}
