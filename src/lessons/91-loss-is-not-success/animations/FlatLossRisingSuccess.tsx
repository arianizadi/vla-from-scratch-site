"use client";

import { AnimationFrame, Axes, Dot, Label, Line, Path, scale, stagger } from "@/animations";

const PLOT = { x: 52, y: 52, w: 396, h: 168 };
const toX = scale([0, 5], [PLOT.x, PLOT.x + PLOT.w]);
const toY = scale([0, 100], [PLOT.y + PLOT.h, PLOT.y]);

/**
 * One run (4000 demonstrations), averaged weights: success at each tested save
 * point, from the chapter's table (millions of examples seen, percent).
 */
const SUCCESS = [
  { at: 1, value: 1, from: 1 },
  { at: 1.5, value: 2, from: 1 },
  { at: 2, value: 36, from: 2 },
  { at: 2.5, value: 70, from: 2 },
  { at: 5, value: 85, from: 3 },
];

/** A sketch of the loss's shape (not measured values): a quick early drop, then almost flat. */
const LOSS = [0, 0.15, 0.3, 0.5, 0.8, 1.2, 2, 3, 4, 5].map(
  (at) => [toX(at), Math.round(toY(10 + 70 * Math.exp(-at / 0.22) + 4 * Math.exp(-at / 2)))] as [number, number],
);

export function FlatLossRisingSuccess() {
  return (
    <AnimationFrame
      title="Flat loss, rising success"
      description="One training run. The loss drops quickly at the start and then barely moves (a sketch of its shape). Success in the simulator stays near zero at the first save points, then shoots up as the robot learns to use the camera, ending at 85%. Nothing in the loss announced that change."
      steps={[
        "The training loss: a quick early drop, then it barely moves.",
        "Success in the simulator at the first save points: still near zero.",
        "Then the robot learns to use the camera, and success shoots up.",
        "It ends at 85%. Nothing in the loss announced the change.",
      ]}
      size={[480, 280]}
    >
      {(step) => (
        <>
          <Axes x={PLOT.x} y={PLOT.y} w={PLOT.w} h={PLOT.h} xTicks={["0", "1M", "2M", "3M", "4M", "5M"]} xLabel="examples seen" />
          <Label x={PLOT.x - 8} y={toY(100)} tone="faint" size={13} anchor="end">
            100%
          </Label>
          <Label x={PLOT.x - 8} y={toY(0)} tone="faint" size={13} anchor="end">
            0%
          </Label>

          <Line points={LOSS} tone="muted" width={2.5} dashed />
          <Label x={toX(3.2)} y={toY(26)} tone="muted" size={14} weight={700} anchor="start">
            loss (shape only)
          </Label>

          <Path
            d={SUCCESS.map((s, i) => `${i === 0 ? "M" : "L"}${toX(s.at)} ${toY(s.value)}`).join("")}
            tone="success"
            width={2.5}
            drawn={step >= 3}
          />
          {SUCCESS.map((s, i) => (
            <Dot key={s.at} x={toX(s.at)} y={toY(s.value)} r={6} tone="success" opacity={step >= s.from ? 1 : 0} delay={stagger(i, 120)} />
          ))}
          <Label x={toX(2.5) + 14} y={toY(70) + 20} tone="success" size={14} weight={700} anchor="start" opacity={step >= 2 ? 1 : 0}>
            success
          </Label>
          <Label x={toX(5) - 4} y={toY(85) - 22} tone="success" size={15} weight={700} anchor="end" opacity={step >= 3 ? 1 : 0}>
            85%
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
