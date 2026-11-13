"use client";

import { AnimationFrame, Arm, Chip, Label, Path, Thing, reach } from "@/animations";
import type { ThingKind } from "@/animations";

const BASE: [number, number] = [46, 262];
const LENGTHS: [number, number] = [170, 150];
const TABLE = 262;
const OBJECTS: { kind: ThingKind; x: number; name: string }[] = [
  { kind: "cube", x: 196, name: "red cube" },
  { kind: "can", x: 266, name: "green can" },
  { kind: "nut", x: 336, name: "blue nut" },
];
const HOME = reach(BASE, [150, 170], LENGTHS);
const ABOVE = OBJECTS.map((o) => reach(BASE, [o.x, 214], LENGTHS));

export function WhichObject() {
  return (
    <AnimationFrame
      title="Only the words say which"
      description="Three objects stand on a table: a red cube, a green can and a blue nut. The camera view never changes. When the instruction says pick up the red cube, the arm should head for the cube; when it says the green can, for the can; when it says the blue nut, for the nut. Only the sentence tells them apart."
      steps={[
        "Three objects on the table. The picture alone cannot say which one to lift.",
        "“Pick up the red cube”: the arm should head here.",
        "“Pick up the green can”: same table, same picture, a different target.",
        "“Pick up the blue nut.” Only the sentence says which object.",
      ]}
      size={[480, 290]}
    >
      {(step) => {
        const target = step - 1;
        return (
          <>
            <Path d={`M0 ${TABLE}H480`} tone="faint" width={2} />
            {OBJECTS.map((object, i) => (
              <g key={object.kind}>
                <Thing kind={object.kind} x={object.x} y={TABLE} tone={i === target ? "action" : "muted"} active={i === target} />
                <Label x={object.x} y={TABLE + 20} tone={i === target ? "ink" : "faint"} size={13} weight={i === target ? 700 : 400}>
                  {object.name.split(" ")[1]}
                </Label>
              </g>
            ))}
            {OBJECTS.map((object, i) => (
              <Chip
                key={`say-${object.kind}`}
                x={290}
                y={34}
                text={`pick up the ${object.name}`}
                tone="language"
                size={15}
                opacity={i === target ? 1 : 0}
              />
            ))}
            <Label x={290} y={34} tone="faint" size={14} opacity={step === 0 ? 1 : 0}>
              which one?
            </Label>
            <Arm base={BASE} lengths={LENGTHS} angles={target >= 0 ? ABOVE[target] : HOME} open={1} tone="ink" />
          </>
        );
      }}
    </AnimationFrame>
  );
}
