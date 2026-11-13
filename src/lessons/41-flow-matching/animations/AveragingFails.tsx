"use client";

import { AnimationFrame, Arm, Dot, Label, Path, Thing, reach } from "@/animations";

const BASE: [number, number] = [46, 252];
const LENGTHS: [number, number] = [170, 150];
const TABLE = 252;
const LEFT = 200;
const RIGHT = 340;
const MIDDLE = (LEFT + RIGHT) / 2;

const HOME = reach(BASE, [190, 140], LENGTHS);
const ABOVE_MIDDLE = reach(BASE, [MIDDLE, 196], LENGTHS);
const DOWN_MIDDLE = reach(BASE, [MIDDLE, TABLE - 4], LENGTHS);

export function AveragingFails() {
  return (
    <AnimationFrame
      title="The average of two good reaches"
      description="Two identical cubes stand on a table and nothing says which to pick. Half of the demonstrations reach for the left cube and half for the right one. A policy trained with squared error learns their average and reaches for the gap between the cubes, where it closes the gripper on empty table: an action no demonstration contains."
      steps={[
        "Two cubes, and nothing in the scene says which one to pick.",
        "Half the demonstrations reach left, half reach right. Both are correct.",
        "Trained to give one answer, the policy settles on the average: the middle.",
        "So the policy closes on the empty gap. No demonstration ever did that.",
      ]}
      size={[480, 290]}
    >
      {(step) => (
        <>
          <Path d={`M0 ${TABLE}H480`} tone="faint" width={2} />
          <Thing kind="cube" x={LEFT} y={TABLE} tone="muted" />
          <Thing kind="cube" x={RIGHT} y={TABLE} tone="muted" />

          <Path d={`M190 140Q${LEFT - 30} 170 ${LEFT} 214`} tone="action" dashed drawn={step >= 1} />
          <Path d={`M190 140Q${RIGHT - 10} 120 ${RIGHT} 214`} tone="action" dashed drawn={step >= 1} delay={200} />
          <Dot x={LEFT} y={212} tone="action" r={5} opacity={step >= 1 ? 1 : 0} delay={300} />
          <Dot x={RIGHT} y={212} tone="action" r={5} opacity={step >= 1 ? 1 : 0} delay={500} />
          <Label x={LEFT - 18} y={182} tone="action" size={14} anchor="end" opacity={step >= 1 ? 1 : 0}>
            demo A
          </Label>
          <Label x={RIGHT + 16} y={182} tone="action" size={14} anchor="start" opacity={step >= 1 ? 1 : 0}>
            demo B
          </Label>

          <Arm
            base={BASE}
            lengths={LENGTHS}
            angles={step <= 1 ? HOME : step === 2 ? ABOVE_MIDDLE : DOWN_MIDDLE}
            open={step >= 3 ? 0 : 1}
            tone="ink"
          />

          <Label x={MIDDLE} y={TABLE + 22} tone="failure" size={14} weight={700} opacity={step >= 3 ? 1 : 0} delay={500}>
            closed on nothing
          </Label>
          <Label x={MIDDLE} y={52} tone="accent" size={14} weight={700} opacity={step === 2 ? 1 : 0}>
            average of A and B
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
