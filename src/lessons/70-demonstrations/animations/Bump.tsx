"use client";

import { AnimationFrame, Arm, Arrow, Label, Path, Thing, reach } from "@/animations";

const TABLE = 250;
const BASE: [number, number] = [86, TABLE];
const LENGTHS: [number, number] = [150, 130];
const OLD = 250;
const NEW = 360;

const HOME = reach(BASE, [150, 130], LENGTHS);
const MIDWAY = reach(BASE, [214, 150], LENGTHS);
const AT_OLD = reach(BASE, [OLD, TABLE - 8], LENGTHS);
const AT_NEW = reach(BASE, [NEW, TABLE - 8], LENGTHS);

export function Bump() {
  return (
    <AnimationFrame
      title="When the cube moves"
      description="The arm reaches for the cube and someone moves the cube aside. An expert that planned only once closes on the empty spot where the cube used to be. An expert that looks again turns and grasps the cube in its new place. Only demonstrations that contain such moves show a robot how to recover."
      steps={[
        "The arm reaches for the cube.",
        "Mid-reach, the cube is moved aside.",
        "An expert that planned once closes on the empty spot.",
        "An expert that looks again turns and follows it.",
      ]}
      size={[480, 290]}
    >
      {(step) => {
        const moved = step >= 1;
        const angles = step === 0 ? HOME : step === 1 ? MIDWAY : step === 2 ? AT_OLD : AT_NEW;
        return (
          <>
            <Path d={`M24 ${TABLE}H456`} tone="faint" width={2} />
            <rect
              className="a-t t-faint a-stroke"
              x={OLD - 15}
              y={TABLE - 30}
              width={30}
              height={30}
              rx={4}
              fill="none"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              style={{ opacity: moved ? 1 : 0 }}
            />
            <Thing kind="cube" x={moved ? NEW : OLD} y={TABLE} tone="action" active={step === 3} />
            <Arrow from={[OLD + 22, TABLE - 46]} to={[NEW - 22, TABLE - 46]} tone="muted" width={1.5} drawn={step === 1} />

            <Arm base={BASE} lengths={LENGTHS} angles={angles} open={step === 2 ? 0 : step === 3 ? 0.75 : 1} tone={step === 2 ? "failure" : "ink"} />

            <Label x={OLD} y={TABLE + 22} tone="failure" size={14} weight={700} opacity={step === 2 ? 1 : 0}>
              closed on nothing
            </Label>
            <Label x={NEW} y={TABLE + 22} tone="success" size={14} weight={700} opacity={step === 3 ? 1 : 0}>
              looked again: got it
            </Label>
            <Label x={456} y={32} tone="muted" size={14} anchor="end" opacity={step === 2 ? 1 : 0}>
              plans once
            </Label>
            <Label x={456} y={32} tone="muted" size={14} anchor="end" opacity={step === 3 ? 1 : 0}>
              plans again after every look
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
