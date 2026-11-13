"use client";

import { AnimationFrame, Arm, Dot, Label, Path, Thing, lerp, reach } from "@/animations";

/* The mover's plan, drawn as the 15 places the fingertips should pass
   through. It starts as noise and is cleaned up in a few passes. A toy:
   the noise and the passes are drawn, not computed by a model. */

const TABLE = 252;
const BASE: [number, number] = [92, TABLE];
const LENGTHS: [number, number] = [140, 120];
const CUBE = 384;

const START: [number, number] = [176, 126];
const BEND: [number, number] = [330, 96];
const END: [number, number] = [CUBE, TABLE - 42];

/** A smooth reach: 15 points on a curve from the fingertips to the cube. */
const PLAN = Array.from({ length: 15 }, (_, k) => {
  const t = (k + 1) / 15;
  const x = (1 - t) * (1 - t) * START[0] + 2 * (1 - t) * t * BEND[0] + t * t * END[0];
  const y = (1 - t) * (1 - t) * START[1] + 2 * (1 - t) * t * BEND[1] + t * t * END[1];
  return [Math.round(x), Math.round(y)] as [number, number];
});

/** Fixed, made-up noise: where each point starts before any pass. */
const NOISE = PLAN.map(([x, y], k) => [
  Math.round(Math.min(456, Math.max(150, x + (((k * 37) % 23) - 11) * 7))),
  Math.round(Math.min(226, Math.max(40, y + (((k * 53) % 19) - 9) * 9))),
]);

/** How far each step has cleaned the plan: 0 noise, 1 smooth. */
const CLEAN = [0, 0.55, 1, 1];
const EXECUTED = 8;

const HOME = reach(BASE, START, LENGTHS);
const MIDWAY = reach(BASE, PLAN[EXECUTED - 1], LENGTHS);

const STATUS = ["the plan: pure noise", "after one pass", "after a few passes", "8 moves done, look again"];

export function SamplingPass() {
  return (
    <AnimationFrame
      title="From a scribble to a plan"
      description="The mover plans the next 15 moves at once. The plan starts as random points, pure noise. Each pass of the mover nudges every point toward a sensible motion, and after a few passes the points form a smooth reach to the cube. The arm carries out the first 8 moves, then looks again and plans afresh."
      steps={[
        "The plan for the next 15 moves starts as random noise.",
        "Each pass of the mover nudges every point toward a sensible motion.",
        "After a few passes the plan is a smooth reach to the cube.",
        "The arm does the first 8 moves, then looks again and makes a new plan.",
      ]}
      size={[480, 280]}
    >
      {(step) => {
        const t = CLEAN[step];
        const done = step === 3;
        return (
          <>
            <Path d={`M16 ${TABLE}H464`} tone="faint" width={2} />
            <Thing kind="cube" x={CUBE} y={TABLE} tone="action" active />

            <Path
              d={`M${START[0]} ${START[1]}Q${BEND[0]} ${BEND[1]} ${END[0]} ${END[1]}`}
              tone="action"
              width={1.5}
              dashed
              drawn={step >= 2}
            />
            {PLAN.map((point, k) => {
              const x = lerp(NOISE[k][0], point[0], t);
              const y = lerp(NOISE[k][1], point[1], t);
              const executed = done && k < EXECUTED;
              return (
                <Dot
                  key={k}
                  x={x}
                  y={y}
                  r={5}
                  tone={step >= 2 ? "action" : "muted"}
                  opacity={executed ? 0 : done ? 0.45 : 1}
                  delay={k * 30}
                />
              );
            })}

            <Arm base={BASE} lengths={LENGTHS} angles={done ? MIDWAY : HOME} />

            {STATUS.map((text, index) => (
              <Label key={text} x={464} y={28} tone={index >= 2 ? "action" : "muted"} size={14} weight={700} anchor="end" opacity={step === index ? 1 : 0}>
                {text}
              </Label>
            ))}
          </>
        );
      }}
    </AnimationFrame>
  );
}
