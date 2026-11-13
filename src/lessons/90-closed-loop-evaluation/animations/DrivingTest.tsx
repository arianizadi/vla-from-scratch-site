"use client";

import { AnimationFrame, Arm, Arrow, Box, Chip, Label, Path, Thing, reach } from "@/animations";

const BASE: [number, number] = [64, 238];
const CUBE_X = 196;
const POLICY: [number, number] = [396, 132];

/** Fingertip targets for each step: rest, rest, part way, above the cube, on it, lifted. */
const TARGETS: [number, number][] = [
  [118, 128],
  [118, 128],
  [160, 172],
  [CUBE_X, 196],
  [CUBE_X, 234],
  [CUBE_X, 168],
];
const POSES = TARGETS.map((target) => reach(BASE, target));
const CUBE_Y = [238, 238, 238, 238, 238, 172];

export function DrivingTest() {
  return (
    <AnimationFrame
      title="The policy drives"
      description="A robot arm beside a cube and a can, and the policy beside them. The policy reads the instruction and the camera picture and answers with the next few moves. The arm makes them, which changes the picture, and the new picture goes back to the policy. After a few rounds the gripper closes on the cube and lifts it: a success."
      steps={[
        "The policy reads the instruction and the camera picture.",
        "It answers with the next few moves.",
        "The arm makes them, and the scene changes.",
        "The new picture goes back in. Again and again.",
        "Its own moves bring it to the cube. It grips.",
        "Success: the named object lifted and held.",
      ]}
      size={[480, 280]}
    >
      {(step) => {
        const seeing = step === 0 || step === 3;
        const acting = step === 1 || step === 2;
        return (
          <>
            <Chip x={POLICY[0]} y={34} text="pick up the cube" tone="language" mono={false} size={14} />
            <Arrow from={[POLICY[0], 52]} to={[POLICY[0], POLICY[1] - 38]} tone="language" />

            <Box x={POLICY[0]} y={POLICY[1]} w={112} h={64} label="policy" active={seeing || acting} />

            <Arrow from={[250, 108]} to={[POLICY[0] - 62, POLICY[1] - 16]} bend={-10} tone="vision" width={seeing ? 3 : 2} flow={seeing} />
            <Label x={300} y={88} tone="vision" size={14} weight={seeing ? 700 : 400}>
              picture
            </Label>
            <Arrow from={[POLICY[0] - 62, POLICY[1] + 18]} to={[256, 172]} bend={-10} tone="action" width={acting ? 3 : 2} flow={acting} />
            <Label x={316} y={190} tone="action" size={14} weight={acting ? 700 : 400}>
              moves
            </Label>

            <Path d="M16 238H300" tone="faint" width={2} />
            <Thing kind="can" x={252} y={238} size={28} />
            <Thing kind="cube" x={CUBE_X} y={CUBE_Y[step]} size={30} tone="action" active={step < 4} />
            <Arm base={BASE} angles={POSES[step]} open={step >= 4 ? 0.25 : 1} />

            <Label x={CUBE_X + 46} y={150} tone="success" size={14} weight={700} opacity={step === 5 ? 1 : 0}>
              ✓ held
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
