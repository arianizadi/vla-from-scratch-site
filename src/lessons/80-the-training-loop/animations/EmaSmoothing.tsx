"use client";

import { AnimationFrame, Axes, Bracket, Label, Line, Path, scale } from "@/animations";
import { EMA, RAW, STEPS, WINDOW } from "./ema";

const PLOT = { x: 30, y: 64, w: 420, h: 150 };
const toX = scale([0, STEPS - 1], [PLOT.x + 8, PLOT.x + PLOT.w]);
const toY = scale([0, 1], [PLOT.y + PLOT.h, PLOT.y]);
const RAW_POINTS = RAW.map((v, i) => [toX(i), toY(v)] as [number, number]);
const EMA_POINTS = EMA.map((v, i) => [toX(i), toY(v)] as [number, number]);

export function EmaSmoothing() {
  return (
    <AnimationFrame
      title="A calmer copy"
      description="A toy: one weight during training, jolted up and down by every batch while it drifts toward its final value. Its moving average moves only a small fraction toward it after each step, so it follows the trend and smooths out the shake. In the toy it remembers about the last 7 steps; a real run remembers thousands."
      steps={[
        "One weight during training (a toy). Every batch of examples jolts it a little.",
        "The averaged copy moves only a small fraction of the way toward it, each step.",
        "It follows the trend and leaves out the shake.",
        "Here it remembers about the last 7 steps. A real run remembers thousands.",
      ]}
      size={[480, 260]}
    >
      {(step) => (
        <>
          <Axes x={PLOT.x} y={PLOT.y} w={PLOT.w} h={PLOT.h} xLabel="training steps →" />

          <Path d="M36 24H56" tone="ink" width={2} opacity={step <= 1 ? 1 : 0.4} />
          <Label x={64} y={24} tone="ink" size={14} anchor="start">
            trained weight
          </Label>
          <Path d="M196 24H216" tone="accent" width={3} opacity={step >= 1 ? 1 : 0} />
          <Label x={224} y={24} tone="accent" size={14} anchor="start" weight={700} opacity={step >= 1 ? 1 : 0}>
            averaged copy
          </Label>

          <Line points={RAW_POINTS} tone="ink" width={1.75} opacity={step <= 1 ? 1 : 0.35} />
          <Line points={EMA_POINTS} tone="accent" width={3} drawn={step >= 1} />

          <Bracket x1={toX(STEPS - WINDOW)} x2={toX(STEPS - 1)} y={PLOT.y - 6} tone="accent" opacity={step >= 3 ? 1 : 0} />
          <Label x={toX(STEPS - WINDOW) - 8} y={PLOT.y - 6} tone="accent" size={14} anchor="end" weight={700} opacity={step >= 3 ? 1 : 0}>
            {`remembers about ${WINDOW} steps`}
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
