"use client";

import { AnimationFrame, Axes, Bracket, Label, Line, scale } from "@/animations";

const PLOT = { x: 56, y: 48, w: 384, h: 160 };
const X = scale([0, 1], [PLOT.x, PLOT.x + PLOT.w]);
const Y = scale([0, 1], [PLOT.y + PLOT.h, PLOT.y]);

/** A sketch, not data: success rises late and fast; the pretrained curve rises sooner. */
function sketch(onset: number, top: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= 40; i += 1) {
    const t = i / 40;
    const v = top / (1 + Math.exp(-(t - onset) * 18));
    out.push([Math.round(X(t) * 10) / 10, Math.round(Y(v) * 10) / 10]);
  }
  return out;
}

const SCRATCH = sketch(0.62, 0.84);
const PRETRAINED = sketch(0.36, 0.86);
const HALF = 0.43;

export function HeadStart() {
  return (
    <AnimationFrame
      title="Starting with a model that knows"
      description="A sketch of success over training for two policies. The one built from scratch stays near zero for a long time, then rises. The one that starts from a pretrained model rises sooner. Both end close together."
      steps={[
        "Success over training: a sketch of what we saw.",
        "From scratch: nothing for a long time, then it learns to look.",
        "Starting from a model that already reads and sees: it learns to look sooner.",
        "A head start, but both end close together on our simple task.",
      ]}
      size={[480, 270]}
    >
      {(step) => (
        <>
          <Axes x={PLOT.x} y={PLOT.y} w={PLOT.w} h={PLOT.h} xLabel="training →" yLabel="success" />
          <Line points={SCRATCH} tone="ink" width={3} drawn={step >= 1} opacity={step >= 1 ? 1 : 0} />
          <Label x={X(0.7) + 10} y={Y(0.32)} tone="ink" size={14} weight={700} anchor="start" opacity={step >= 1 ? 1 : 0} delay={500}>
            from scratch
          </Label>
          <Line points={PRETRAINED} tone="accent" width={3} drawn={step >= 2} opacity={step >= 2 ? 1 : 0} />
          <Label x={X(0.33) - 10} y={Y(0.62)} tone="accent" size={14} weight={700} anchor="end" opacity={step >= 2 ? 1 : 0} delay={500}>
            pretrained
          </Label>
          <Bracket x1={X(0.36)} x2={X(0.62)} y={Y(HALF)} label="head start" tone="ink" opacity={step >= 3 ? 1 : 0} />
          <Label x={X(0.88)} y={Y(0.98)} tone="muted" size={13} opacity={step >= 3 ? 1 : 0}>
            both end close
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
