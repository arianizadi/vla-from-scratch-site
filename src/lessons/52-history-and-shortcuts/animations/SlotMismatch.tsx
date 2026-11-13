"use client";

import { Arrow, AnimationFrame, Box, Chip, Label } from "@/animations";

const ROWS = [
  { y: 96, title: "in training", slot: "→ toward the cube", slotTone: "action" as const, out: "finds the cube", outTone: "success" as const, at: 0 },
  { y: 216, title: "on the robot", slot: "· at rest", slotTone: "muted" as const, out: "goes anywhere", outTone: "failure" as const, at: 2 },
];

export function SlotMismatch() {
  return (
    <AnimationFrame
      title="Trained on the expert, run on itself"
      description="In training, the last action fed to the policy is the expert's, and even the very first one already points toward the target. The policy learns to read the target from it. On the robot, the first last action is the arm at rest, which points nowhere, so the policy has nothing to read and its reach goes anywhere."
      steps={[
        "In training, the last action is the expert's. Even the first one already points at the target.",
        "So the policy learns a shortcut: read the target from the last action.",
        "On the robot, the first last action is the arm at rest. It points nowhere.",
        "The policy has nothing to read, and the reach goes anywhere.",
      ]}
      size={[480, 280]}
    >
      {(step) => (
        <>
          {ROWS.map((row, index) => {
            const shown = step >= row.at;
            const result = index === 0 ? step >= 1 : step >= 3;
            return (
              <g key={row.title}>
                <Label x={16} y={row.y - 50} tone="ink" size={14} anchor="start" weight={700} opacity={shown ? 1 : 0.35}>
                  {row.title}
                </Label>
                <Chip x={98} y={row.y} text={row.slot} tone={row.slotTone} size={14} width={164} opacity={shown ? 1 : 0} mono={false} />
                <Label x={98} y={row.y + 32} tone="faint" size={13} opacity={shown ? 1 : 0}>
                  last action
                </Label>
                <Arrow from={[184, row.y]} to={[214, row.y]} tone="muted" drawn={shown} opacity={shown ? 1 : 0} />
                <Box x={262} y={row.y} w={88} h={44} label="policy" tone="accent" opacity={shown ? 1 : 0} active={index === 0 && step === 1} />
                <Arrow from={[310, row.y]} to={[338, row.y]} tone="muted" drawn={result} opacity={result ? 1 : 0} />
                <Label x={346} y={row.y} tone={row.outTone} size={14} anchor="start" weight={700} opacity={result ? 1 : 0}>
                  {row.out}
                </Label>
              </g>
            );
          })}
          <Label x={262} y={ROWS[0].y + 40} tone="accent" size={13} opacity={step === 1 ? 1 : 0}>
            reads the target here
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
