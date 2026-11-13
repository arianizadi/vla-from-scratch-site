"use client";

import { AnimationFrame, Arrow, Bar, Dot, Label, Path, stagger } from "@/animations";
import { STEP_SIZES, UPDATES_BY_STEP, VALLEY, WALK, toX, toY } from "./valley";

const BAR_BASE = 300;
const BAR_X = (index: number) => 300 + index * 21;

/** Unit vector pointing downhill along the valley at the start. */
const START = WALK[0];
const SLOPE = (() => {
  const dx = 190;
  const dy = -336 * START;
  const length = Math.hypot(dx, dy);
  return [dx / length, dy / length] as const;
})();

export function GradientSteps() {
  return (
    <AnimationFrame
      title="Walking downhill in fog"
      description="Training is drawn as a walk down a valley whose height is the loss. The walker feels the slope underfoot and steps the other way. The first steps are small, the middle ones big, and the last ones small again, so the walk settles near the bottom instead of overshooting. Toy numbers."
      steps={[
        "Each spot is one setting of the model's numbers. The height is the loss: lower is better.",
        "In fog you can only feel the slope underfoot. Step the other way: downhill.",
        "The first steps are small, while the model finds its feet.",
        "Then bigger strides cover ground fast.",
        "Near the end the steps shrink again, so it settles at the bottom instead of overshooting.",
      ]}
      size={[480, 316]}
    >
      {(step) => {
        const done = UPDATES_BY_STEP[step];
        const here = WALK[done];
        return (
          <>
            <Label x={36} y={44} tone="faint" size={14} anchor="start">
              high loss
            </Label>
            <Label x={240} y={256} tone="faint" size={14}>
              low loss
            </Label>
            <Path d={VALLEY} tone="muted" width={2} />

            <Arrow
              from={[toX(START) + SLOPE[0] * 14, toY(START) + SLOPE[1] * 14]}
              to={[toX(START) + SLOPE[0] * 64, toY(START) + SLOPE[1] * 64]}
              tone="accent"
              width={2.5}
              drawn={step === 1}
              opacity={step === 1 ? 1 : 0}
            />
            <Label x={toX(START) + 44} y={toY(START) + 22} tone="accent" size={14} anchor="start" weight={700} opacity={step === 1 ? 1 : 0}>
              downhill
            </Label>

            {WALK.slice(0, -1).map((u, index) => (
              <Dot key={`print-${index}`} x={toX(u)} y={toY(u)} r={4} tone="faint" opacity={index < done ? 1 : 0} delay={stagger(index, 120)} />
            ))}
            <Dot x={toX(here)} y={toY(here)} r={9} tone="accent" />

            <Label x={284} y={BAR_BASE - 14} tone="faint" size={14} anchor="end" opacity={step >= 2 ? 1 : 0}>
              step size
            </Label>
            {STEP_SIZES.map((size, index) => (
              <Bar
                key={`bar-${index}`}
                x={BAR_X(index)}
                y={BAR_BASE}
                height={44}
                value={index < done ? size / 0.3 : 0}
                width={14}
                tone="accent"
                opacity={index < done ? 1 : 0}
                delay={stagger(index, 120)}
              />
            ))}
          </>
        );
      }}
    </AnimationFrame>
  );
}
