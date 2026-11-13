"use client";

import { AnimationFrame, Arm, Arrow, Label, Thing, reach } from "@/animations";

const TABLE = 250;
const BASE: [number, number] = [84, TABLE];
const LENGTHS: [number, number] = [150, 132];
const OLD = 222;
const NEW = 340;

const HOME = reach(BASE, [190, 120], LENGTHS);
const HALFWAY = reach(BASE, [OLD - 30, 170], LENGTHS);
const DOWN_OLD = reach(BASE, [OLD, TABLE - 6], LENGTHS);
const DOWN_NEW = reach(BASE, [NEW, TABLE - 6], LENGTHS);

export function MoveTarget() {
  return (
    <AnimationFrame
      title="Slide the can aside"
      description="Side view. The arm reaches for the can. Halfway there, the can is slid to the side. A policy that looked once closes its gripper where the can used to be, on nothing. A policy that keeps looking would turn and follow the can to its new place."
      steps={[
        "The arm sets off toward the can.",
        "Halfway there, the can is slid aside.",
        "A policy that looked once closes where the can used to be.",
        "One that keeps looking would turn and follow it.",
      ]}
      size={[480, 290]}
    >
      {(step) => {
        const moved = step >= 1;
        const solid = step === 0 ? HOME : step === 1 ? HALFWAY : DOWN_OLD;
        return (
          <>
            <line x1={12} y1={TABLE} x2={468} y2={TABLE} className="t-faint a-stroke" strokeWidth={2} />

            {/* Where the can was: a dashed outline once it has moved. */}
            <rect
              x={OLD - 12}
              y={TABLE - 34}
              width={24}
              height={34}
              rx={8}
              className="a-t t-faint a-stroke"
              fill="none"
              strokeWidth={2}
              strokeDasharray="4 4"
              style={{ opacity: moved ? 1 : 0 }}
            />
            <Label x={OLD} y={TABLE + 22} tone="muted" size={14} opacity={moved ? 1 : 0}>
              was here
            </Label>
            <Thing kind="can" x={moved ? NEW : OLD} y={TABLE} tone="action" size={30} />
            <Label x={moved ? NEW : OLD} y={TABLE + 22} tone="action" size={14} weight={700}>
              can
            </Label>
            <Arrow from={[OLD + 24, TABLE - 50]} to={[NEW - 24, TABLE - 50]} tone="action" dashed drawn={step === 1} />

            {/* The policy that keeps looking: a ghost that splits off in the last step. */}
            <Arm base={BASE} lengths={LENGTHS} angles={step >= 3 ? DOWN_NEW : solid} open={step >= 3 ? 0.35 : 1} tone="accent" opacity={step >= 3 ? 0.55 : 0} />
            <Arm base={BASE} lengths={LENGTHS} angles={solid} open={step >= 2 ? 0 : 1} tone="ink" />

            <Label x={OLD} y={74} tone="failure" size={15} weight={700} opacity={step >= 2 ? 1 : 0}>
              closes on nothing
            </Label>
            <Label x={NEW + 20} y={110} tone="accent" size={15} weight={700} anchor="end" opacity={step >= 3 ? 1 : 0}>
              keeps looking
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
