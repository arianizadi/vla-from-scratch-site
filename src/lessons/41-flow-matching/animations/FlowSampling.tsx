"use client";

import { AnimationFrame, Dot, Label } from "@/animations";
import { TARGETS, noise, tidy, trajectory } from "./toy";

const UNIT = 62;
const CX = 240;
const CY = 150;
const toX = (x: number) => tidy(CX + x * UNIT);
const toY = (y: number) => tidy(CY - y * UNIT);

/** 44 noise points and where each is after every one of the 10 flow steps. */
const PATHS = noise(44, 11, 2.2).map((start) => trajectory(start, 10));
/** Which flow step each animation step shows. */
const FRAMES = [0, 2, 5, 7, 10];

export function FlowSampling() {
  return (
    <AnimationFrame
      title="Sampling: from noise to actions in 10 steps"
      description="Forty-four random points are moved by the sampler in ten flow steps toward two demonstrated actions on the left and right. In the first steps every point heads for the middle, the average of the two. Around halfway the paths bend, and by the last step every point sits on one of the two actions and none is left in the middle."
      steps={[
        "Start from pure noise: random points.",
        "First steps: everything drifts toward the middle, the average.",
        "Halfway, each point's best guess picks a side and the paths bend.",
        "The points commit to the nearest demonstrated action.",
        "After 10 flow steps every draw sits on a real action. None is left in the gap.",
      ]}
      size={[480, 300]}
      hold={[1800, 1800, 1800, 1800, 3400]}
    >
      {(step) => {
        const k = FRAMES[step];
        return (
          <>
            <rect x={toX(-0.5)} y={12} width={UNIT} height={276} rx={10} className="t-failure a-fill-soft" opacity={0.7} />
            <Label x={CX} y={26} tone="failure" size={13}>
              the gap
            </Label>

            {TARGETS.map(([tx, ty], index) => (
              <g key={index}>
                <Dot x={toX(tx)} y={toY(ty)} r={14} tone="ink" hollow />
                <Label x={toX(tx)} y={toY(ty) + 30} tone="ink" size={14} weight={700}>
                  {index === 0 ? "demo A" : "demo B"}
                </Label>
              </g>
            ))}

            {PATHS.map((path, index) => {
              const [x, y] = path[k];
              return <Dot key={index} x={toX(x)} y={toY(y)} r={4.5} tone="action" delay={index * 6} />;
            })}

            <Label x={470} y={284} tone="muted" size={13} anchor="end" mono>
              {`flow step ${k} of 10`}
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
