"use client";

import { AnimationFrame, Arrow, Chip, Label, Move, Path, Thing, stagger, type ThingKind } from "@/animations";

const TABLE = 220;
const OBJECTS: { kind: ThingKind; name: string; x: number; named: boolean }[] = [
  { kind: "cube", name: "red cube", x: 100, named: false },
  { kind: "can", name: "green can", x: 240, named: true },
  { kind: "nut", name: "blue nut", x: 380, named: false },
];
const PHOTOS = ["a green can on a desk", "two green cans", "a can of green paint"];

export function WordToObject() {
  return (
    <AnimationFrame
      title="Words that already point"
      description="The instruction names the green can. A reader trained from nothing has no idea yet which object the words mean, so all three look equally likely. A pretrained reader has seen many captioned photos, so the words green can already point at the can."
      steps={[
        "The instruction names the green can.",
        "A fresh reader: the words mean nothing yet. Any object could be it.",
        "A pretrained reader has already seen many captioned photos…",
        "…so “green can” already points at the can.",
      ]}
      size={[480, 300]}
    >
      {(step) => {
        const fresh = step === 1;
        return (
          <>
            <Chip x={240} y={40} text="pick up the green can" tone="language" size={15} mono={false} />

            {PHOTOS.map((caption, index) => (
              <Move key={caption} x={0} y={step === 2 ? 88 + index * 36 : 70 + index * 36} opacity={step === 2 ? 1 : 0} delay={stagger(index, 140)}>
                <rect className="t-vision a-fill-soft a-stroke" x={128} y={-14} width={40} height={28} rx={4} strokeWidth={1.5} />
                {Array.from({ length: index === 1 ? 2 : 1 }, (_, k) => (
                  <rect key={k} className="t-vision a-fill" x={(index === 1 ? 136 : 143) + k * 14} y={-8} width={10} height={16} rx={4} />
                ))}
                <Chip x={282} y={0} text={caption} tone="vision" size={13} mono={false} />
              </Move>
            ))}
            <Label x={66} y={124} tone="vision" size={13} weight={700} opacity={step === 2 ? 1 : 0}>
              web photos
            </Label>

            <Path d={`M24 ${TABLE}H456`} tone="faint" width={2} />
            {OBJECTS.map((object, index) => (
              <g key={object.name}>
                <Thing kind={object.kind} x={object.x} y={TABLE} tone={object.named && step >= 3 ? "language" : "muted"} active={object.named && step >= 3} />
                <Label x={object.x} y={TABLE + 22} tone={object.named && step >= 3 ? "ink" : "muted"} size={14} weight={object.named && step >= 3 ? 700 : 400}>
                  {object.name}
                </Label>
                <Arrow
                  from={[240, 62]}
                  to={[object.x, TABLE - 50]}
                  bend={object.x < 240 ? 16 : object.x > 240 ? -16 : 0}
                  tone={object.named && step >= 3 ? "language" : "faint"}
                  width={object.named && step >= 3 ? 2.5 : 1.5}
                  dashed={fresh}
                  drawn={fresh || (step >= 3 && object.named)}
                  delay={stagger(index, 120)}
                />
                <Label x={object.x} y={TABLE - 70} tone="muted" size={15} weight={700} opacity={fresh ? 1 : 0}>
                  ?
                </Label>
              </g>
            ))}

            <Label x={240} y={282} tone="muted" size={14} opacity={fresh ? 1 : 0}>
              fresh reader: no idea which
            </Label>
            <Label x={240} y={282} tone="language" size={14} weight={700} opacity={step >= 3 ? 1 : 0}>
              pretrained reader: it is this one
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
