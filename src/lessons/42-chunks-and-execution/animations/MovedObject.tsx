"use client";

import { AnimationFrame, Arm, Dot, Label, Path, Thing, Timeline, reach } from "@/animations";

const BASE: [number, number] = [46, 262];
const LENGTHS: [number, number] = [170, 150];
const TABLE = 262;
/** One drawing unit per millimetre: the cube is moved 80 mm. */
const OLD = 250;
const NEW = 330;

const HOME = reach(BASE, [170, 150], LENGTHS);
const ABOVE_OLD = reach(BASE, [OLD, 196], LENGTHS);
const DOWN_OLD = reach(BASE, [OLD, TABLE - 4], LENGTHS);

const TRACK = { x: 70, y: 46, w: 340 };
const atStep = (controlStep: number) => TRACK.x + (controlStep / 40) * TRACK.w;
/** Where the clock is in each animation step: control step 10, 20, 32, 40. */
const CLOCK = [10, 20, 32, 40];

export function MovedObject() {
  return (
    <AnimationFrame
      title="Re-planning is not looking"
      description="A policy reaches for the cube. Halfway through the reach the cube is moved 8 centimetres. The policy re-plans twice from images that show the new place, but it keeps heading for the old place and closes its gripper there. It never succeeded in those trials."
      steps={[
        "The policy looks, plans, and reaches for the cube.",
        "Halfway there, someone moves the cube 8 cm.",
        "It re-plans twice, from images that clearly show the new place.",
        "It still closes at the old place. It never once succeeded.",
      ]}
      size={[480, 300]}
      hold={[2000, 2200, 2400, 3600]}
    >
      {(step) => {
        const moved = step >= 1;
        return (
          <>
            <Timeline x={TRACK.x} y={TRACK.y} w={TRACK.w} ticks={["0", "10", "20", "30", "40"]} marker={CLOCK[step] / 40} tone="accent" />
            <Label x={TRACK.x - 12} y={TRACK.y} tone="muted" size={13} anchor="end">
              tick
            </Label>
            <Dot x={atStep(20)} y={TRACK.y - 20} r={5} tone="action" opacity={moved ? 1 : 0} />
            <Label x={atStep(20) - 10} y={TRACK.y - 20} tone="action" size={13} anchor="end" opacity={moved ? 1 : 0}>
              moved
            </Label>
            {[24, 32].map((at, index) => (
              <Dot key={at} x={atStep(at)} y={TRACK.y - 20} r={5} tone="vision" opacity={step >= 2 ? 1 : 0} delay={index * 400} />
            ))}
            <Label x={atStep(32) + 12} y={TRACK.y - 20} tone="vision" size={13} anchor="start" opacity={step >= 2 ? 1 : 0} delay={400}>
              re-plans
            </Label>

            <Path d={`M0 ${TABLE}H480`} tone="faint" width={2} />
            <rect
              x={OLD - 15}
              y={TABLE - 30}
              width={30}
              height={30}
              rx={4}
              className="a-t t-muted a-stroke"
              fill="none"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              style={{ opacity: moved ? 1 : 0 }}
            />
            <Thing kind="cube" x={moved ? NEW : OLD} y={TABLE} tone="action" active />
            <Path d={`M${OLD + 20} ${TABLE - 15}H${NEW - 26}`} tone="action" width={1.5} dashed drawn={moved} />

            <Arm
              base={BASE}
              lengths={LENGTHS}
              angles={step === 0 ? HOME : step <= 2 ? ABOVE_OLD : DOWN_OLD}
              open={step >= 3 ? 0 : 1}
              tone="ink"
            />

            <Label x={NEW} y={TABLE + 22} tone="action" size={14} weight={700} opacity={moved ? 1 : 0}>
              new place
            </Label>
            <Label x={OLD + 18} y={TABLE + 22} tone="muted" size={14} anchor="end" opacity={moved && step < 3 ? 1 : 0}>
              old place
            </Label>
            <Label x={OLD + 18} y={TABLE + 22} tone="failure" size={14} anchor="end" weight={700} opacity={step >= 3 ? 1 : 0} delay={500}>
              closed at the old place
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
