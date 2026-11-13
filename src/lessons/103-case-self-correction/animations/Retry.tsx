"use client";

import { AnimationFrame, Arm, Label, Path, Thing, reach } from "@/animations";

const BASE: [number, number] = [56, 262];
const LENGTHS: [number, number] = [170, 150];
const TABLE = 262;
const FIRST = 214;
const SECOND = 352;
const GRASP = TABLE - 14;
const LIFTED = 96;

/** Where the fingertips are in each step, and whether the jaws are shut. */
const POSES: { at: [number, number]; open: number }[] = [
  { at: [FIRST, TABLE - 70], open: 1 },
  { at: [FIRST, GRASP], open: 0 },
  { at: [FIRST, TABLE - 110], open: 1 },
  { at: [SECOND, GRASP], open: 1 },
  { at: [SECOND, GRASP - LIFTED], open: 0 },
];

export function Retry() {
  return (
    <AnimationFrame
      title="A missed grasp, and a second try"
      description="Side view. The hand comes down over the can. As the jaws close, the can is slid away, so they close on nothing. The robot trained with recoveries opens, rises straight up, moves over the can's new place, comes down, closes and lifts it: a second try that works."
      steps={[
        "The hand comes down over the can.",
        "As the jaws close, the can is slid away: they close on nothing.",
        "The robot notices. It opens and rises straight up.",
        "It moves over the can's new place and comes down again.",
        "It closes and lifts: a second try that works.",
      ]}
      size={[480, 300]}
      hold={[2000, 2600, 2200, 2400, 3600]}
    >
      {(step) => {
        const pose = POSES[step];
        const moved = step >= 1;
        const lifted = step >= 4;
        return (
          <>
            <Path d={`M0 ${TABLE}H480`} tone="faint" width={2} />
            <g className="a-t" style={{ opacity: moved ? 1 : 0 }}>
              <rect x={FIRST - 12} y={TABLE - 34.5} width={24} height={34.5} rx={9} fill="none" className="t-faint a-stroke" strokeWidth={1.5} strokeDasharray="4 4" />
            </g>
            <Thing kind="can" x={moved ? SECOND : FIRST} y={lifted ? TABLE - LIFTED : TABLE} tone="action" delay={lifted ? 120 : 0} />
            <Arm base={BASE} lengths={LENGTHS} angles={reach(BASE, pose.at, LENGTHS)} open={pose.open} tone="ink" />

            <Label x={FIRST} y={TABLE + 20} tone="failure" size={14} weight={700} opacity={step >= 1 ? 1 : 0}>
              1st try: missed
            </Label>
            <Label x={SECOND} y={TABLE + 20} tone="success" size={14} weight={700} opacity={lifted ? 1 : 0}>
              {"2nd try ✓"}
            </Label>
            <Label x={FIRST + 40} y={TABLE - 140} tone="accent" size={14} weight={700} anchor="start" opacity={step === 2 ? 1 : 0}>
              up first, clear of everything
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
