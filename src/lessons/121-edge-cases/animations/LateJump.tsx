"use client";

import { AnimationFrame, Axes, Dot, Label, Line, Path, scale } from "@/animations";

const PLOT = { x: 56, y: 46, w: 388, h: 164 };
const X = scale([0, 1], [PLOT.x, PLOT.x + PLOT.w]);
const Y = scale([0, 1], [PLOT.y + PLOT.h, PLOT.y]);

/** The shape we saw (a sketch): near zero for a long time, then a fast rise to about 85%. */
function success(t: number): number {
  return 0.85 / (1 + Math.exp(-(t - 0.55) * 20));
}
function points(from: number, to: number): [number, number][] {
  const out: [number, number][] = [];
  for (let t = from; t <= to + 1e-9; t += 0.025) out.push([Math.round(X(t) * 10) / 10, Math.round(Y(success(t)) * 10) / 10]);
  return out;
}
const STOP = 0.2;
const EARLY = points(0, STOP);
const LATER = points(STOP, 1);

export function LateJump() {
  return (
    <AnimationFrame
      title="Learning arrives late, all at once"
      description="A sketch of success over training. For a long time success stays near zero; a run stopped a fifth of the way through scores nothing and looks broken. The same run, trained on, suddenly rises to about 85 percent."
      steps={[
        "Success over a long training run.",
        "Stop a fifth of the way through: nearly zero. The design looks broken.",
        "Keep going: still flat for a while…",
        "…then it learns to look, and success jumps to about 85%.",
      ]}
      size={[480, 270]}
    >
      {(step) => (
        <>
          <Axes x={PLOT.x} y={PLOT.y} w={PLOT.w} h={PLOT.h} xLabel="training →" yLabel="success" />
          <Line points={EARLY} tone="accent" width={3} drawn={step >= 1} opacity={step >= 1 ? 1 : 0} />
          <Path d={`M${X(STOP)} ${PLOT.y + 20}V${PLOT.y + PLOT.h}`} tone="failure" width={1.5} dashed drawn={step >= 1} />
          <Dot x={X(STOP)} y={Y(success(STOP))} r={6} tone="failure" opacity={step >= 1 ? 1 : 0} />
          <Label x={X(STOP) + 10} y={PLOT.y + 18} tone="failure" size={14} weight={700} anchor="start" opacity={step >= 1 ? 1 : 0}>
            stopped here: 0%
          </Label>
          <Line points={LATER.slice(0, 13)} tone="accent" width={3} drawn={step >= 2} opacity={step >= 2 ? 1 : 0} />
          <Line points={LATER.slice(12)} tone="accent" width={3} drawn={step >= 3} opacity={step >= 3 ? 1 : 0} />
          <Dot x={X(1)} y={Y(success(1))} r={6} tone="success" opacity={step >= 3 ? 1 : 0} delay={700} />
          <Label x={X(0.88)} y={Y(success(1)) + 24} tone="success" size={14} weight={700} opacity={step >= 3 ? 1 : 0} delay={700}>
            about 85%
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
