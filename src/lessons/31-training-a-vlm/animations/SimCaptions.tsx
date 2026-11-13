"use client";

import { AnimationFrame, Chip, Dot, Label, Path, Thing, stagger } from "@/animations";

/** Seen from above: a camera at the bottom looking up the table, its picture drawn as a line in front of it. */
const CAM: [number, number] = [240, 262];
const LINE = 214;
const OBJECTS = [
  { kind: "can" as const, name: "green can", x: 108, y: 126 },
  { kind: "cube" as const, name: "red cube", x: 296, y: 168 },
  { kind: "nut" as const, name: "blue nut", x: 410, y: 96 },
];
/** Where each object lands on the picture line: follow the ray from the object to the camera. */
const projected = OBJECTS.map((o) => {
  const t = (CAM[1] - LINE) / (CAM[1] - o.y);
  return { ...o, u: Math.round((CAM[0] + (o.x - CAM[0]) * t) * 10) / 10 };
});
const sorted = [...projected].sort((a, b) => a.u - b.u);
const SLOTS = [116, 240, 364];

export function SimCaptions() {
  return (
    <AnimationFrame
      title="The simulator writes the captions"
      description="Seen from above, three objects stand on the table and a camera looks up the table. The simulator knows where every object is. It follows a straight line from each object to the camera to find where it lands in the camera picture, sorts the objects left to right, and fills a sentence: left to right, green can, red cube, blue nut."
      steps={[
        "Seen from above: the simulator knows exactly where every object is.",
        "It follows a line from each object to the camera: where it lands in the picture.",
        "Sort them left to right in the picture.",
        "Fill in a sentence: a correct caption, free, for every scene.",
      ]}
      size={[480, 290]}
    >
      {(step) => (
        <>
          <Label x={22} y={252} tone="faint" size={13} anchor="start">
            table, from above
          </Label>
          {projected.map((o, i) => (
            <g key={o.kind}>
              <Path d={`M${o.x} ${o.y - 12}L${CAM[0]} ${CAM[1] - 8}`} tone="vision" width={1.5} dashed drawn={step >= 1} delay={stagger(i, 120)} />
              <Thing kind={o.kind} x={o.x} y={o.y} size={26} tone="vision" />
              <Dot x={o.u} y={LINE} r={6} tone="vision" opacity={step >= 1 ? 1 : 0} delay={stagger(i, 120) + 400} />
            </g>
          ))}

          <Path d={`M170 ${LINE}H310`} tone="ink" width={3} />
          <Label x={340} y={LINE + 2} tone="muted" size={13} anchor="start">
            camera picture
          </Label>
          <Path d={`M${CAM[0] - 14} ${CAM[1] + 8}L${CAM[0]} ${CAM[1] - 10}L${CAM[0] + 14} ${CAM[1] + 8}Z`} tone="ink" width={2} fill />
          <Label x={CAM[0] + 26} y={CAM[1] + 2} tone="muted" size={13} anchor="start">
            camera
          </Label>

          {sorted.map((o, i) => (
            <Chip
              key={`chip-${o.kind}`}
              x={step >= 2 ? SLOTS[i] : o.u}
              y={28}
              text={`${i + 1}. ${o.name}`}
              tone="language"
              size={14}
              mono={false}
              opacity={step === 2 ? 1 : 0}
              delay={stagger(i, 120)}
            />
          ))}
          <Chip x={240} y={28} text="left to right: green can, red cube, blue nut" tone="language" size={14} mono={false} opacity={step === 3 ? 1 : 0} />
        </>
      )}
    </AnimationFrame>
  );
}
