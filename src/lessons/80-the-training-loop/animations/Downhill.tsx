"use client";

import { AnimationFrame, Arrow, Dot, Label, Path } from "@/animations";
import { descend, loss, slope, valleyPath } from "./valley";

const LIMIT = 2.2;
const toX = (w: number) => 240 + 95 * w;
const toY = (l: number) => 232 - 36 * l;
const VALLEY = valleyPath(toX, toY, LIMIT);

/** The toy's path: start at w = -1.8, stride 0.3, so each step keeps 40% of the distance to the bottom. */
const PATH = descend(-1.8, 0.3, 5);
/** Which point of the path each animation step shows. */
const AT = [0, 0, 1, 3, 5];

const R = 9;
function ball(w: number): [number, number] {
  return [Math.round(toX(w) * 10) / 10, Math.round((toY(loss(w)) - R - 1) * 10) / 10];
}

/** The gradient arrow: downhill along the curve, as long as the slope is steep. */
function arrowFrom(w: number): { from: [number, number]; to: [number, number]; length: number } {
  const [x, y] = ball(w);
  const dx = 95;
  const dy = -36 * slope(w);
  const norm = Math.hypot(dx, dy);
  const length = Math.min(70, 18 * Math.abs(slope(w)));
  const sign = w < 0 ? 1 : -1;
  return {
    from: [x, y],
    to: [Math.round((x + (sign * dx * length) / norm) * 10) / 10, Math.round((y + (sign * dy * length) / norm) * 10) / 10],
    length,
  };
}

export function Downhill() {
  return (
    <AnimationFrame
      title="Walking downhill"
      description="A toy valley: the height is the loss for each value of one weight. A ball stands on the slope. An arrow shows the downhill direction, the gradient. The ball takes a step that way, then another; the slope gets gentler near the bottom, so the steps shrink, and the ball settles at the lowest loss."
      steps={[
        "Height is the loss: how wrong the model is for each value of one weight (a toy).",
        "The slope underfoot points downhill. That direction is the gradient.",
        "Take one small step downhill.",
        "Feel the slope again, step again.",
        "Near the bottom the slope is gentle, so the steps shrink. The loss is as low as it gets.",
      ]}
      size={[480, 280]}
    >
      {(step) => {
        const index = AT[step];
        const w = PATH[index];
        const [bx, by] = ball(w);
        const arrow = arrowFrom(w);
        const showArrow = step >= 1 && step <= 3 && arrow.length > 14;
        return (
          <>
            <Path d={VALLEY} tone="ink" width={2.5} />
            <Label x={22} y={40} tone="muted" size={14} anchor="start">
              loss ↑
            </Label>
            <Label x={458} y={262} tone="muted" size={14} anchor="end">
              one weight →
            </Label>

            {PATH.slice(0, -1).map((p, i) => {
              const [tx, ty] = ball(p);
              return <Dot key={`trail-${i}`} x={tx} y={ty} r={4} tone="accent" opacity={i < index ? 0.45 : 0} delay={i * 80} />;
            })}

            <Arrow from={arrow.from} to={arrow.to} tone="ink" width={3} drawn={showArrow} opacity={showArrow ? 1 : 0} />
            <Label x={arrow.to[0] + 10} y={arrow.to[1] + 4} tone="ink" size={14} weight={700} anchor="start" opacity={step === 1 ? 1 : 0}>
              gradient
            </Label>

            <Dot x={bx} y={by} r={R} tone="accent" />

            <Label x={toX(0)} y={256} tone="success" size={14} weight={700} opacity={step === 4 ? 1 : 0}>
              lowest loss
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
