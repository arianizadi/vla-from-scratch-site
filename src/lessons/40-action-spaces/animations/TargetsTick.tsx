"use client";

import { AnimationFrame, Arm, Dot, Label, Move, Path, Thing, reach } from "@/animations";

const BASE: [number, number] = [70, 256];
const LENGTHS: [number, number] = [150, 130];
const TABLE = 256;
const CUBE = 330;

/** The arm's pose after each action: home, on the way, above the cube, down at the cube. */
const POSES = [
  reach(BASE, [170, 150], LENGTHS),
  reach(BASE, [250, 160], LENGTHS),
  reach(BASE, [CUBE, 196], LENGTHS),
  reach(BASE, [CUBE, TABLE - 4], LENGTHS),
  reach(BASE, [CUBE, TABLE - 4], LENGTHS),
];
const OPEN = [1, 1, 1, 1, 0];

/** Three dials (one per joint drawn here) and the gripper switch, at the top right. */
const DIALS = [
  { x: 254, name: "joint 1" },
  { x: 318, name: "joint 2" },
  { x: 382, name: "joint 3" },
];
const DIAL_Y = 54;
const DIAL_R = 20;

export function TargetsTick() {
  return (
    <AnimationFrame
      title="An action is a list of targets"
      description="An action is drawn as three dials, one target angle per joint, and a switch for the gripper. Every 50 milliseconds a new action arrives, the dials point somewhere new, and the arm's joints swing to those angles. After a few actions the arm is down at the cube, and the last number flips the gripper to closed."
      steps={[
        "An action is a list of numbers: a target angle for each joint, and open or closed.",
        "Every 50 ms a new action arrives. Motors push each joint toward its target.",
        "Next action, next targets. The arm follows.",
        "Down at the cube. (The real arm has seven joints; this drawing has three.)",
        "The last number flips: the gripper closes.",
      ]}
      size={[480, 290]}
      hold={[2600, 2200, 2000, 2200, 3200]}
    >
      {(step) => {
        const angles = POSES[step];
        return (
          <>
            <Path d={`M0 ${TABLE}H480`} tone="faint" width={2} />
            <Thing kind="cube" x={CUBE} y={TABLE} tone="action" active={step === 4} />

            <Label x={318} y={16} tone="action" size={14} weight={700}>
              {`action ${step + 1}`}
            </Label>
            {DIALS.map((dial, index) => (
              <g key={dial.name}>
                <circle cx={dial.x} cy={DIAL_Y} r={DIAL_R} className="t-action a-fill-soft a-stroke" strokeWidth={1.5} />
                <Move x={dial.x} y={DIAL_Y} rotate={angles[index]} delay={index * 40}>
                  <path d={`M0 0V${-DIAL_R + 4}`} className="t-action a-stroke" strokeWidth={3} strokeLinecap="round" />
                </Move>
                <Dot x={dial.x} y={DIAL_Y} r={3} tone="action" />
                <Label x={dial.x} y={DIAL_Y + 34} tone="muted" size={13}>
                  {dial.name}
                </Label>
              </g>
            ))}
            <rect x={428} y={DIAL_Y - 14} width={36} height={28} rx={14} className="a-t t-action a-fill-soft a-stroke" strokeWidth={1.5} />
            <Dot x={OPEN[step] ? 450 : 442} y={DIAL_Y} r={9} tone={OPEN[step] ? "action" : "ink"} />
            <Label x={446} y={DIAL_Y + 34} tone="muted" size={13}>
              {OPEN[step] ? "open" : "closed"}
            </Label>

            <Arm base={BASE} lengths={LENGTHS} angles={angles} open={OPEN[step]} tone="ink" />

            <Label x={16} y={16} tone="faint" size={13} anchor="start" mono>
              {`${step * 50} ms`}
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
