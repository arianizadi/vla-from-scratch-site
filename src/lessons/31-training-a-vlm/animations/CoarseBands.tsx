"use client";

import { AnimationFrame, Bracket, Chip, Label, Path, Thing } from "@/animations";

const FRAME = { x: 60, y: 36, w: 360, h: 128 };
const BAND = FRAME.w / 3;
const FLOOR = FRAME.y + FRAME.h - 22;
const BANDS = ["left", "middle", "right"];
const CUBE_X = 236;

export function CoarseBands() {
  return (
    <AnimationFrame
      title="What captions cannot teach"
      description="A caption places objects in three bands of the picture: left, middle or right. On the table one band is about 30 cm wide, while a grasp has to land within about 1 cm. So captions teach the model which object is which, and the last centimetre has to come from robot demonstrations."
      steps={[
        "Captions say left, middle or right: three bands of the picture.",
        "On the table, one band is about 30 cm wide.",
        "A grasp must land within about 1 cm.",
        "Captions teach which object is which. The exact spot comes from robot demonstrations.",
      ]}
      size={[480, 280]}
    >
      {(step) => (
        <>
          <rect x={FRAME.x} y={FRAME.y} width={FRAME.w} height={FRAME.h} rx={8} className="t-vision a-fill-soft a-stroke" strokeWidth={1.5} />
          <Path d={`M${FRAME.x + 10} ${FLOOR}H${FRAME.x + FRAME.w - 10}`} tone="faint" width={1.5} />
          {[1, 2].map((k) => (
            <Path key={k} d={`M${FRAME.x + k * BAND} ${FRAME.y + 6}V${FRAME.y + FRAME.h - 6}`} tone="accent" width={1.5} dashed drawn />
          ))}
          {BANDS.map((band, i) => (
            <Label key={band} x={FRAME.x + BAND * (i + 0.5)} y={FRAME.y + 22} tone="accent" size={14} weight={700}>
              {band}
            </Label>
          ))}
          <Thing kind="can" x={110} y={FLOOR} size={24} tone="muted" />
          <Thing kind="cube" x={CUBE_X} y={FLOOR} size={24} tone="action" active={step === 2} />
          <Thing kind="nut" x={372} y={FLOOR} size={24} tone="muted" />

          <Bracket x1={FRAME.x + BAND} x2={FRAME.x + 2 * BAND} y={FRAME.y + FRAME.h + 18} label="about 30 cm" tone="ink" below opacity={step >= 1 ? 1 : 0} />
          <Bracket x1={CUBE_X - 7} x2={CUBE_X + 7} y={FLOOR - 40} tone="action" opacity={step === 2 ? 1 : 0} />
          <Label x={FRAME.x + FRAME.w / 2} y={232} tone="action" size={14} weight={700} opacity={step === 2 ? 1 : 0}>
            a grasp must land within about 1 cm (orange mark)
          </Label>

          <Chip x={140} y={250} text="captions: which object" tone="language" size={13} mono={false} opacity={step === 3 ? 1 : 0} />
          <Chip x={352} y={250} text="demonstrations: exact spot" tone="action" size={13} mono={false} opacity={step === 3 ? 1 : 0} />
        </>
      )}
    </AnimationFrame>
  );
}
