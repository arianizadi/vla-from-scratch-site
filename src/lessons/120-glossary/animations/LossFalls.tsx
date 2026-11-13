"use client";

import { AnimationFrame, Axes, Dot, Label, Line, scale } from "@/animations";

const PLOT = { x: 58, y: 44, w: 384, h: 164 };
const X = scale([0, 1], [PLOT.x, PLOT.x + PLOT.w]);
const Y = scale([0, 1], [PLOT.y + PLOT.h, PLOT.y]);

/** A sketch of a loss curve: fast drop, then a slow tail. */
function loss(t: number): number {
  return 0.08 + 0.84 * Math.exp(-t * 5.5);
}
const CURVE: [number, number][] = Array.from({ length: 41 }, (_, i) => {
  const t = i / 40;
  return [Math.round(X(t) * 10) / 10, Math.round(Y(loss(t)) * 10) / 10];
});
const FIRST: [number, number][] = CURVE.slice(0, 9);
const CHECKPOINTS = [0.25, 0.5, 0.75, 1];

export function LossFalls() {
  return (
    <AnimationFrame
      title="Loss, training steps and checkpoints"
      description="A sketch of the loss, the gap between the model's guesses and the demonstrations, falling over training steps. Each step nudges the model a little. Along the way the model is saved as checkpoints."
      steps={[
        "At first the guesses are far from the demonstrations: the loss is high.",
        "Each training step nudges the model, and the loss falls.",
        "Along the way, copies of the model are saved: checkpoints.",
      ]}
      size={[480, 270]}
    >
      {(step) => (
        <>
          <Axes x={PLOT.x} y={PLOT.y} w={PLOT.w} h={PLOT.h} xLabel="training steps →" yLabel="loss (the gap)" />
          <Dot x={CURVE[0][0]} y={CURVE[0][1]} r={6} tone="accent" />
          <Label x={CURVE[0][0] + 14} y={CURVE[0][1]} tone="accent" size={14} weight={700} anchor="start" opacity={step === 0 ? 1 : 0}>
            far off
          </Label>
          <Line points={FIRST} tone="accent" width={3} drawn={step >= 1} opacity={step >= 1 ? 1 : 0} />
          <Line points={CURVE.slice(8)} tone="accent" width={3} drawn={step >= 1} opacity={step >= 1 ? 1 : 0} delay={500} />
          <Label x={X(0.5)} y={Y(0.5)} tone="accent" size={14} weight={700} opacity={step === 1 ? 1 : 0} delay={400}>
            falls step by step
          </Label>
          {CHECKPOINTS.map((t, index) => (
            <g key={t} className="a-t t-ink" style={{ transform: `translate(${X(t)}px, ${Y(loss(t))}px)`, opacity: step >= 2 ? 1 : 0, transitionDelay: `${index * 120}ms` }}>
              <path className="a-stroke" d="M0 0V-26" strokeWidth={1.5} />
              <path className="a-fill" d="M0 -26H13L9 -21L13 -16H0Z" />
            </g>
          ))}
          <Label x={X(0.625)} y={Y(loss(0.75)) - 54} tone="ink" size={14} weight={700} opacity={step >= 2 ? 1 : 0}>
            checkpoints
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
