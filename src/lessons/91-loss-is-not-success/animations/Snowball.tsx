"use client";

import { AnimationFrame, Dot, Label, Line, Path } from "@/animations";

/** A toy: the demonstrated path and a policy whose small first error grows by half again each step. */
const STEPS = 8;
const X0 = 48;
const X1 = 400;
const centre = (x: number) => Math.round(200 - ((x - X0) * 112) / (X1 - X0));
const xAt = (k: number) => Math.round(X0 + ((X1 - X0) * k) / STEPS);
const DEVIATION = Array.from({ length: STEPS + 1 }, (_, k) => Math.round(3 * (1.5 ** k - 1)));
const POLICY = DEVIATION.map((d, k) => [xAt(k), centre(xAt(k)) + d] as [number, number]);
const DEMO = `M${X0} ${centre(X0)}L${X1 + 30} ${centre(X1 + 30)}`;

/** How much of the policy's path each step shows. */
const SHOWN = [0, 1, 3, STEPS];

export function Snowball() {
  return (
    <AnimationFrame
      title="Small misses snowball"
      description="A toy. The demonstrations all travel inside a narrow corridor toward the object. The policy's first move is a little off. Outside the corridor it sees views no demonstration showed, so its next move is worse, and the error grows step by step until the arm ends far from the object."
      steps={[
        "The demonstrations travel inside a narrow corridor of views.",
        "The policy's first move is a little off (a toy).",
        "Outside the corridor it sees views no demonstration showed. Its next guess is worse.",
        "The error grows with every step. Recorded data never shows this: there the demonstrator always drove.",
      ]}
      size={[480, 270]}
    >
      {(step) => {
        const upto = SHOWN[step];
        return (
          <>
            <Path d={DEMO} tone="vision" width={34} opacity={0.18} />
            <Path d={DEMO} tone="vision" width={2} dashed />
            <Label x={X0 + 120} y={centre(X0 + 120) - 34} tone="vision" size={14} weight={700}>
              demonstrations
            </Label>
            <Dot x={X1 + 30} y={centre(X1 + 30)} r={14} tone="action" hollow />
            <Label x={X1 + 30} y={centre(X1 + 30) - 28} tone="action" size={14} weight={700}>
              object
            </Label>

            <Line points={POLICY.slice(0, 2)} tone="ink" width={3} drawn={step >= 1} />
            <Line points={POLICY.slice(1, 4)} tone="ink" width={3} drawn={step >= 2} />
            <Line points={POLICY.slice(3)} tone="failure" width={3} drawn={step >= 3} />
            {POLICY.map(([x, y], k) => (
              <Dot key={k} x={x} y={y} r={k === 0 ? 7 : 4.5} tone={k >= 4 ? "failure" : "ink"} opacity={k <= upto ? 1 : 0} delay={k * 60} />
            ))}

            <Label x={POLICY[3][0] + 10} y={POLICY[3][1] + 26} tone="ink" size={14} weight={700} anchor="start" opacity={step === 2 ? 1 : 0}>
              never seen in training
            </Label>
            <Label x={POLICY[STEPS][0] + 10} y={POLICY[STEPS][1] + 26} tone="failure" size={14} weight={700} anchor="middle" opacity={step >= 3 ? 1 : 0}>
              far off
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
