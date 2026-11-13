"use client";

import { AnimationFrame, Dot, Label, Path } from "@/animations";
import { TARGETS, noise, tidy, trajectory } from "./toy";

/** The chapter's table: share of 10,000 toy draws within 0.1 of a target, by number of flow steps. */
const ROWS = [
  { steps: 1, landed: "0%" },
  { steps: 2, landed: "13.9%" },
  { steps: 4, landed: "89.6%" },
  { steps: 10, landed: "100%" },
];

const UNIT = 72;
const CX = 255;
const ROW_Y = [74, 132, 190, 248];
const toX = (x: number) => tidy(CX + Math.max(-2, Math.min(2, x)) * UNIT);
const jitter = (y: number) => tidy(Math.max(-1, Math.min(1, y)) * 12);

const STARTS = noise(30, 5, 2);
const ENDS = ROWS.map((row) => STARTS.map((start) => trajectory(start, row.steps).at(-1) ?? start));

export function StepCount() {
  return (
    <AnimationFrame
      title="How many flow steps?"
      description="The same random starting points are run through the sampler with 1, 2, 4 and 10 flow steps. With 1 step every draw lands in the middle, on the average. With 2, most still end between the targets. With 4, most land on a target, and with 10 all of them do. In the full toy, 0%, 13.9%, 89.6% and 100% of 10,000 draws land within 0.1 of a target."
      steps={[
        "The same noise, run through four samplers.",
        "1 flow step is one jump, aimed at the average: nothing lands on a target.",
        "2 steps: the side is chosen mid-path, too late. Most draws end in between.",
        "4 steps: most draws reach a target.",
        "10 steps: all of them. Fewer steps are faster but can fall short.",
      ]}
      size={[480, 290]}
    >
      {(step) => (
        <>
          <Label x={470} y={24} tone="muted" size={13} anchor="end">
            on a target
          </Label>
          {ROWS.map((row, rowIndex) => {
            const done = step >= rowIndex + 1;
            const y = ROW_Y[rowIndex];
            return (
              <g key={row.steps}>
                <Label x={16} y={y} tone={done ? "ink" : "muted"} size={14} anchor="start" weight={done ? 700 : 400}>
                  {`${row.steps} ${row.steps === 1 ? "step" : "steps"}`}
                </Label>
                <Path d={`M${toX(-2)} ${y}H${toX(2)}`} tone="faint" width={1.5} />
                {TARGETS.map(([tx]) => (
                  <Dot key={tx} x={toX(tx)} y={y} r={11} tone="ink" hollow />
                ))}
                {STARTS.map((start, index) => {
                  const [x, yy] = done ? ENDS[rowIndex][index] : start;
                  return <Dot key={index} x={toX(x)} y={y - jitter(yy)} r={3.5} tone="action" delay={index * 8} opacity={0.9} />;
                })}
                <Label x={470} y={y} tone="ink" size={16} anchor="end" weight={700} opacity={done ? 1 : 0}>
                  {row.landed}
                </Label>
              </g>
            );
          })}
        </>
      )}
    </AnimationFrame>
  );
}
