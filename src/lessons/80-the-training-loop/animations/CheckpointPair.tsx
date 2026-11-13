"use client";

import { AnimationFrame, Bar, Dot, Label, Path, stagger } from "@/animations";

/**
 * One run's checkpoints (the chapter's example: 4000 demonstrations), success on
 * 100 unseen scenes for the trained and the averaged weights, in percent.
 */
const SAVES = [
  { at: "1M", trained: 0, averaged: 1, from: 1 },
  { at: "1.5M", trained: 4, averaged: 2, from: 1 },
  { at: "2M", trained: 4, averaged: 36, from: 2 },
  { at: "2.5M", trained: 56, averaged: 70, from: 3 },
  { at: "5M", trained: 83, averaged: 85, from: 3 },
];
const X = [76, 164, 252, 340, 428];
const BASE = 210;
const H = 140;
const HIGHLIGHT = 2;

export function CheckpointPair() {
  return (
    <AnimationFrame
      title="Save both, test both"
      description="Five save points of one run. At each, the trained weights and the averaged copy are tested on 100 new scenes. Early on both fail. At the middle save, while the robot learns to use the camera, the averaged copy succeeds 36% of the time and the trained weights 4%. Later both reach about 85%."
      steps={[
        "Five save points along one run. Each keeps both copies of the weights.",
        "Test both on 100 new scenes. Early on, both fail.",
        "Midway, while the robot learns to use the camera, the averaged copy is far ahead.",
        "Later the two catch up with each other.",
      ]}
      size={[480, 270]}
    >
      {(step) => (
        <>
          <rect className="t-ink a-fill" x={36} y={18} width={12} height={12} rx={3} />
          <Label x={54} y={24} tone="ink" size={14} anchor="start">
            trained
          </Label>
          <rect className="t-accent a-fill" x={130} y={18} width={12} height={12} rx={3} />
          <Label x={148} y={24} tone="accent" size={14} anchor="start" weight={700}>
            averaged
          </Label>
          <Label x={452} y={24} tone="muted" size={14} anchor="end">
            success
          </Label>

          <Path d={`M30 ${BASE}H458`} tone="faint" width={1.5} />
          {SAVES.map((save, i) => {
            const on = step >= save.from;
            const lit = step === 2 && i === HIGHLIGHT;
            return (
              <g key={save.at}>
                <Dot x={X[i]} y={BASE} r={5} tone="ink" delay={stagger(i, 60)} />
                <Label x={X[i]} y={BASE + 22} tone="muted" size={14}>
                  {save.at}
                </Label>
                <Bar x={X[i] - 15} y={BASE - 1} height={H} value={on ? Math.max(0.015, save.trained / 100) : 0} width={24} tone="ink" opacity={on ? (step === 2 && !lit ? 0.4 : 1) : 0} delay={stagger(i, 60)} />
                <Bar x={X[i] + 15} y={BASE - 1} height={H} value={on ? Math.max(0.015, save.averaged / 100) : 0} width={24} tone="accent" opacity={on ? (step === 2 && !lit ? 0.4 : 1) : 0} delay={stagger(i, 60) + 40} />
              </g>
            );
          })}
          <Label x={X[HIGHLIGHT] - 15} y={BASE - 20} tone="ink" size={14} weight={700} opacity={step >= 2 ? 1 : 0}>
            4%
          </Label>
          <Label x={X[HIGHLIGHT] + 15} y={BASE - 1 - H * 0.36 - 14} tone="accent" size={14} weight={700} opacity={step >= 2 ? 1 : 0}>
            36%
          </Label>
          <Label x={452} y={BASE + 42} tone="muted" size={14} anchor="end">
            examples seen →
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
