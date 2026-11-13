"use client";

import { AnimationFrame, Arm, Label, Path, Thing, reach } from "@/animations";

const TABLE = 250;
const BASE: [number, number] = [140, TABLE];
const LENGTHS: [number, number] = [130, 120];
const FIRST = 290;
const MOVED = 380;
const LIFT = 54;

const TIPS: [number, number][] = [
  [250, 160],
  [262, 176],
  [FIRST, TABLE - 6],
  [MOVED, 196],
  [MOVED, TABLE - 6 - LIFT],
];

export function MovedObject() {
  return (
    <AnimationFrame
      title="It only looked once"
      description="A policy trained on clean demonstrations reaches for a cube. Halfway, the cube is moved. The arm keeps going to where it first saw the cube and closes on air. A policy trained with demonstrations that include recoveries turns, follows the cube and lifts it."
      steps={[
        "Trained on clean demonstrations, the arm reaches for the cube.",
        "Halfway, someone moves the cube.",
        "The arm keeps going to where the cube was, and closes on air.",
        "Trained with recovery examples too, it turns and follows the cube…",
        "…and lifts it.",
      ]}
      hold={[2000, 2000, 2600, 2200, 3200]}
      size={[480, 280]}
    >
      {(step) => {
        const moved = step >= 1;
        const lifted = step >= 4;
        return (
          <>
            <Path d={`M20 ${TABLE}H460`} tone="faint" width={2} />
            <Thing kind="cube" x={FIRST} y={TABLE} tone="faint" size={28} opacity={moved && step <= 3 ? 0.55 : 0} />
            <Thing kind="cube" x={moved ? MOVED : FIRST} y={lifted ? TABLE - LIFT : TABLE} tone="action" size={28} active={!lifted} delay={lifted ? 120 : 0} />
            <Label x={(FIRST + MOVED) / 2} y={TABLE + 16} tone="ink" size={14} weight={700} opacity={step === 1 ? 1 : 0}>
              moved →
            </Label>
            <Arm base={BASE} lengths={LENGTHS} angles={reach(BASE, TIPS[step], LENGTHS)} open={step === 2 ? 0 : lifted ? 0.6 : 1} tone="ink" />
            <Label x={FIRST} y={TABLE + 16} tone="failure" size={14} weight={700} opacity={step === 2 ? 1 : 0}>
              closed on air
            </Label>
            <Label x={330} y={36} tone="muted" size={14} opacity={step <= 2 ? 1 : 0}>
              clean demonstrations only
            </Label>
            <Label x={330} y={36} tone="success" size={14} weight={700} opacity={step >= 3 ? 1 : 0}>
              with recovery examples
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
