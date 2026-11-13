"use client";

import { AnimationFrame, Arm, Chip, Label, Path, Thing, reach } from "@/animations";

const BASE: [number, number] = [44, 236];
const LENGTHS: [number, number] = [160, 150];
const TABLE = 236;
const OBJECTS = [
  { kind: "cube" as const, name: "cube", x: 220 },
  { kind: "can" as const, name: "can", x: 316 },
  { kind: "nut" as const, name: "nut", x: 412 },
];
const CAN = OBJECTS[1].x;

const HOME = reach(BASE, [170, 120], LENGTHS);
const DOWN = reach(BASE, [CAN, TABLE - 6], LENGTHS);

export function WhatAndWhere() {
  return (
    <AnimationFrame
      title="A grasp needs what and where"
      description="The instruction says pick up the green can, and three objects stand on the table. Knowing what picks out the can among the three. Knowing where pins down exactly where it stands. With both, the arm goes to the right object at the right spot and closes on it."
      steps={[
        "The instruction names one of three objects.",
        "Knowing what: which of the three is the can.",
        "Knowing where: exactly where it stands.",
        "With both, the hand goes to the right object, at the right spot.",
      ]}
      size={[480, 290]}
    >
      {(step) => (
        <>
          <Chip x={300} y={30} text="pick up the green can" tone="language" size={15} mono={false} />
          <Path d={`M0 ${TABLE}H480`} tone="faint" width={2} />
          {OBJECTS.map((object) => {
            const named = object.name === "can";
            return (
              <g key={object.name}>
                <Thing kind={object.kind} x={object.x} y={TABLE} tone={named && step >= 1 ? "action" : "muted"} active={named && step >= 1} />
                <Label x={object.x} y={TABLE + 22} tone={named && step >= 1 ? "action" : "muted"} size={14} weight={named && step >= 1 ? 700 : 400}>
                  {object.name}
                </Label>
              </g>
            );
          })}

          <Path d={`M${CAN} 64V${TABLE - 40}`} tone="accent" width={1.5} dashed drawn={step === 2} />
          <Path d={`M${CAN - 40} ${TABLE - 16}H${CAN + 40}`} tone="accent" width={1.5} dashed drawn={step === 2} />
          <Label x={CAN + 40} y={92} tone="accent" size={14} weight={700} anchor="start" opacity={step === 2 ? 1 : 0}>
            here
          </Label>

          <Label x={130} y={276} tone="ink" size={14} weight={700} opacity={step >= 1 ? 1 : 0}>
            what ✓
          </Label>
          <Label x={CAN + 48} y={276} tone="ink" size={14} weight={700} opacity={step >= 2 ? 1 : 0}>
            where ✓
          </Label>

          <Arm base={BASE} lengths={LENGTHS} angles={step <= 2 ? HOME : DOWN} open={step >= 3 ? 0.35 : 1} tone="ink" delay={step === 3 ? 200 : 0} />
        </>
      )}
    </AnimationFrame>
  );
}
