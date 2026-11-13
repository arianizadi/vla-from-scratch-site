"use client";

import { AnimationFrame, Arrow, Chip, Label, Path, lerp } from "@/animations";
import { CloseMark, TopGripper, TopObject } from "./topdown";

const START: [number, number] = [64, 64];
const OLD: [number, number] = [300, 112];
const NEW: [number, number] = [236, 214];
const along = (t: number): [number, number] => [lerp(START[0], OLD[0], t), lerp(START[1], OLD[1], t)];

/** How far along its reach the gripper is in each step. */
const REACH = [0.4, 0.55, 1, 1];

export function MoveTest() {
  return (
    <AnimationFrame
      title="The test: slide the object mid-reach"
      description="Seen from above: three objects, and the instruction names the can. The robot reaches for it. Mid-reach the can is slid to a new place. The robot keeps going to where the can was and closes its gripper on empty table, because it chose its target at the first look and then followed its own arm."
      steps={[
        "From above: three objects. The instruction names the can, and the robot reaches for it.",
        "Mid-reach, the can is slid about 8 cm to a new place.",
        "The robot keeps going to where the can was, and closes on empty table.",
        "It chose its target at the first look, then followed its own arm.",
      ]}
      size={[480, 290]}
      hold={[2400, 2400, 2600, 3400]}
    >
      {(step) => {
        const [gx, gy] = along(REACH[step]);
        const moved = step >= 1;
        return (
          <>
            <Chip x={360} y={26} text="pick up the can" tone="language" size={14} mono={false} />

            <TopObject kind="cube" x={128} y={200} />
            <TopObject kind="nut" x={392} y={226} />
            <TopObject kind="can" x={OLD[0]} y={OLD[1]} ghost tone="muted" opacity={moved ? 1 : 0} />
            <TopObject kind="can" x={moved ? NEW[0] : OLD[0]} y={moved ? NEW[1] : OLD[1]} tone="action" />
            <Arrow from={[OLD[0] - 12, OLD[1] + 22]} to={[NEW[0] + 18, NEW[1] - 22]} tone="action" dashed drawn={step === 1} />
            <Label x={moved ? NEW[0] : OLD[0]} y={(moved ? NEW[1] : OLD[1]) + 32} tone="action" size={14} weight={700}>
              {moved ? "the can, now" : "the can"}
            </Label>
            <Label x={OLD[0] + 26} y={OLD[1] - 4} tone="muted" size={14} anchor="start" opacity={moved ? 1 : 0}>
              where it was
            </Label>

            <Path d={`M${START[0]} ${START[1]}L${OLD[0]} ${OLD[1]}`} tone="faint" width={2} dashed />
            <TopGripper x={gx} y={gy} closed={step >= 2} />
            <CloseMark x={OLD[0]} y={OLD[1]} opacity={step >= 2 ? 1 : 0} delay={300} />
            <Label x={OLD[0] + 26} y={OLD[1] + 18} tone="failure" size={14} weight={700} anchor="start" opacity={step >= 2 ? 1 : 0} delay={300}>
              closed on nothing
            </Label>

            <circle cx={START[0]} cy={START[1]} r={22} fill="none" className="a-t t-accent a-stroke" strokeWidth={2.5} style={{ opacity: step === 3 ? 1 : 0 }} />
            <Label x={START[0]} y={START[1] + 38} tone="accent" size={14} weight={700} opacity={step === 3 ? 1 : 0}>
              decided here
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
