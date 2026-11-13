"use client";

import { Arrow, AnimationFrame, Arm, Chip, Label, Path, Thing, reach } from "@/animations";

const BASE: [number, number] = [56, 262];
const LENGTHS: [number, number] = [160, 140];
const TABLE = 262;
const CUBE = 360;
const BEFORE: [number, number] = [190, 176];
const NOW: [number, number] = [240, 186];
const NEXT: [number, number] = [292, 196];

export function TwoFrames() {
  return (
    <AnimationFrame
      title="A memory of the moment before"
      description="One camera frame shows the arm partway to a cube, but cannot say whether it is still or moving. Adding the frame from a moment before, drawn faintly, shows the arm was further back, so it is moving toward the cube. History also passes the last action, so a new plan can carry on the motion already under way."
      steps={[
        "One frame: is the arm still, or on its way somewhere?",
        "Add the frame from a moment before: now the motion shows.",
        "History also passes the last action sent, so a new plan can carry on from it.",
      ]}
      size={[480, 290]}
      hold={[2600, 2600, 3400]}
    >
      {(step) => (
        <>
          <Path d={`M0 ${TABLE}H480`} tone="faint" width={2} />
          <Thing kind="cube" x={CUBE} y={TABLE} tone="action" />
          <Arm base={BASE} lengths={LENGTHS} angles={reach(BASE, BEFORE, LENGTHS)} open={1} tone="faint" opacity={step >= 1 ? 0.6 : 0} />
          <Arm base={BASE} lengths={LENGTHS} angles={reach(BASE, NOW, LENGTHS)} open={1} tone="ink" />
          <Label x={NOW[0]} y={NOW[1] + 32} tone="muted" size={14} weight={700} opacity={step === 0 ? 1 : 0}>
            still or moving?
          </Label>
          <Label x={BEFORE[0] - 30} y={BEFORE[1] + 32} tone="faint" size={13} opacity={step >= 1 ? 1 : 0}>
            a moment before
          </Label>
          <Label x={NOW[0] + 26} y={NOW[1] + 32} tone="ink" size={13} opacity={step >= 1 ? 1 : 0}>
            now
          </Label>
          <Arrow from={[BEFORE[0] + 4, BEFORE[1] - 64]} to={[NOW[0] - 4, NOW[1] - 64]} tone="accent" width={2.5} drawn={step >= 1} opacity={step >= 1 ? 1 : 0} />
          <Label x={(BEFORE[0] + NOW[0]) / 2} y={BEFORE[1] - 84} tone="accent" size={14} weight={700} opacity={step >= 1 ? 1 : 0}>
            moving
          </Label>
          <Arrow from={[NOW[0] + 8, NOW[1] - 64]} to={[NEXT[0] + 10, NEXT[1] - 64]} tone="action" width={2.5} dashed drawn={step >= 2} opacity={step >= 2 ? 1 : 0} />
          <Chip x={392} y={60} text="last action" tone="action" size={14} opacity={step >= 2 ? 1 : 0} />
          <Label x={392} y={92} tone="action" size={13} opacity={step >= 2 ? 1 : 0}>
            carry on this way
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
