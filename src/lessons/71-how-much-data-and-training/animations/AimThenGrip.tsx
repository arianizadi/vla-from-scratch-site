"use client";

import { AnimationFrame, Axes, Dot, Label, Line, Path, scale } from "@/animations";

/* The chapter's 4000-demonstration run (trained weights): two scores at each
   checkpoint. From 3M to 5M success stayed between 81% and 86%. */

const PLOT = { x: 64, y: 50, w: 360, h: 170 };
const sx = scale([0, 5], [PLOT.x, PLOT.x + PLOT.w]);
const sy = scale([0, 100], [PLOT.y + PLOT.h, PLOT.y]);
const pt = (m: number, v: number): [number, number] => [Math.round(sx(m)), Math.round(sy(v))];

const AIMED = [pt(1, 35), pt(1.5, 61), pt(2, 95), pt(2.5, 98), pt(3, 100), pt(5, 100)];
const LIFTED = [pt(1, 0), pt(1.5, 4), pt(2, 4), pt(2.5, 56)];

export function AimThenGrip() {
  return (
    <AnimationFrame
      title="Aim first, grip last"
      description="Two scores checked through training on 4000 demonstrations. Closing the gripper at the named object climbs from 35% at 1 million examples to 95% at 2 million. Picking the object up stays at 4% at 2 million, reaches 56% at 2.5 million, and settles between 81% and 86% from 3 million on."
      steps={[
        "Two scores, checked as training goes on.",
        "Aiming at the named object rises first.",
        "Picking it up rises last.",
        "At 2M it aimed right 95% of the time, yet picked up only 4%.",
      ]}
      size={[480, 280]}
    >
      {(step) => (
        <>
          <Axes x={PLOT.x} y={PLOT.y} w={PLOT.w} h={PLOT.h} xTicks={["0", "1M", "2M", "3M", "4M", "5M"]} xLabel="training examples seen" />
          {[0, 50, 100].map((value) => (
            <Label key={value} x={PLOT.x - 10} y={sy(value)} tone="faint" size={13} anchor="end" mono>
              {`${value}%`}
            </Label>
          ))}

          <rect className="a-t t-accent a-fill" x={PLOT.x} y={16} width={14} height={14} rx={3} />
          <Label x={PLOT.x + 22} y={23} tone="ink" size={14} anchor="start">
            aimed at the named object
          </Label>
          <rect className="a-t t-action a-fill" x={PLOT.x + 232} y={16} width={14} height={14} rx={3} style={{ opacity: step >= 2 ? 1 : 0.35 }} />
          <Label x={PLOT.x + 254} y={23} tone="ink" size={14} anchor="start" opacity={step >= 2 ? 1 : 0.35}>
            picked it up
          </Label>

          <Line points={AIMED} tone="accent" drawn={step >= 1} dots />
          <Line points={LIFTED} tone="action" drawn={step >= 2} dots delay={200} />
          <rect
            className="a-t t-action a-fill"
            x={sx(3)}
            y={sy(86)}
            width={Math.round(sx(5) - sx(3))}
            height={Math.round(sy(81) - sy(86))}
            rx={3}
            style={{ opacity: step >= 2 ? 0.55 : 0, transitionDelay: "700ms" }}
          />
          <Path d={`M${pt(2.5, 56)[0]} ${pt(2.5, 56)[1]}L${Math.round(sx(3))} ${Math.round(sy(83))}`} tone="action" width={2} dashed drawn={step >= 2} delay={700} />

          <Path d={`M${sx(2)} ${PLOT.y}V${PLOT.y + PLOT.h}`} tone="mark" width={2} dashed drawn={step >= 3} />
          <Dot x={sx(2)} y={sy(95)} r={9} tone="accent" hollow opacity={step >= 3 ? 1 : 0} />
          <Dot x={sx(2)} y={sy(4)} r={9} tone="action" hollow opacity={step >= 3 ? 1 : 0} />
          <Label x={sx(2) + 14} y={sy(95) + 22} tone="accent" size={14} weight={700} anchor="start" opacity={step >= 3 ? 1 : 0}>
            95% aimed
          </Label>
          <Label x={sx(2) + 14} y={sy(4) - 20} tone="action" size={14} weight={700} anchor="start" opacity={step >= 3 ? 1 : 0}>
            4% picked up
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
