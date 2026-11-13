"use client";

import { AnimationFrame, Arrow, Chip, Label, Path, Thing, stagger, type ThingKind } from "@/animations";

const TABLE = 196;
const OBJECTS: { kind: ThingKind; name: string; x: number }[] = [
  { kind: "cube", name: "red cube", x: 100 },
  { kind: "can", name: "green can", x: 240 },
  { kind: "nut", name: "blue nut", x: 380 },
];

export function CaptionCheck() {
  return (
    <AnimationFrame
      title="Captions that say where things are"
      description="A picture of one of the robot's scenes shows a red cube, a green can and a blue nut from left to right. Its caption uses the same words as the robot's instructions and lists the objects in that order. Tested on scenes it never saw, the trained model listed the order right in 85% of them and named the leftmost object right in 95%."
      steps={[
        "A picture of one of the robot's scenes.",
        "Its caption says what is where, in the instructions' own words: left to right.",
        "Test it on new scenes: what is the order, and which object is leftmost?",
        "It got the order right in 85% of new scenes, the leftmost in 95%.",
      ]}
      size={[480, 300]}
    >
      {(step) => (
        <>
          <Path d={`M30 ${TABLE}H450`} tone="faint" width={2} />
          {OBJECTS.map((object, index) => (
            <g key={object.name}>
              <Thing kind={object.kind} x={object.x} y={TABLE} tone="muted" active={step === 2 && index === 0} />
              <Label x={object.x} y={TABLE + 20} tone="muted" size={14}>
                {object.name}
              </Label>
            </g>
          ))}

          <Label x={240} y={28} tone="language" size={14} opacity={step >= 1 ? 1 : 0}>
            caption: “from left to right: …”
          </Label>
          {OBJECTS.map((object, index) => (
            <g key={`caption-${object.name}`}>
              <Chip x={object.x} y={74} text={`${index + 1}. ${object.name}`} tone="language" size={14} opacity={step >= 1 ? 1 : 0} delay={stagger(index, 150)} />
              <Arrow from={[object.x, 94]} to={[object.x, TABLE - 46]} tone="language" width={1.5} drawn={step >= 1} delay={stagger(index, 150) + 200} />
            </g>
          ))}

          <Label x={130} y={252} tone="ink" size={28} weight={700} opacity={step >= 3 ? 1 : 0}>
            85%
          </Label>
          <Label x={130} y={278} tone="muted" size={14} opacity={step >= 2 ? 1 : 0}>
            {step >= 3 ? "order right" : "the order?"}
          </Label>
          <Label x={350} y={252} tone="ink" size={28} weight={700} opacity={step >= 3 ? 1 : 0} delay={200}>
            95%
          </Label>
          <Label x={350} y={278} tone="muted" size={14} opacity={step >= 2 ? 1 : 0}>
            {step >= 3 ? "leftmost right" : "the leftmost?"}
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
