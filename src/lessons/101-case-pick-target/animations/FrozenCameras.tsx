"use client";

import { AnimationFrame, Label, Move, Path, lerp } from "@/animations";
import { TopGripper, TopObject } from "./topdown";

/* Top: the pictures the robot gets while it reaches, as a strip. Bottom: the
   reach, seen from above. Freezing the pictures on the first one does not
   change where it goes. */

const FRAMES = 6;
const FW = 60;
const FH = 44;
const frameX = (i: number) => 40 + i * 70;
const STRIP_Y = 34;

const START: [number, number] = [72, 168];
const CAN: [number, number] = [344, 232];
/** The gripper inside frame i (frame-local coordinates): it gets closer to the can. */
const inFrame = (i: number): [number, number] => [Math.round(lerp(10, 40, i / (FRAMES - 1))), Math.round(lerp(10, 30, i / (FRAMES - 1)))];

export function FrozenCameras() {
  return (
    <AnimationFrame
      title="The frozen-camera test"
      description="Top: the pictures the robot receives while it reaches, one after another, each showing the hand closer to the can. In the test, every picture after the first is replaced by the first one. Bottom, seen from above: the robot still heads for the can and closes near it. It chose its target at the first picture and then followed its own arm."
      steps={[
        "While it reaches, the robot gets a fresh picture many times a second.",
        "The test: freeze the pictures on the very first one.",
        "It still heads for the right object. It never needed the later pictures.",
        "It chose at the first glance, then followed its own arm.",
      ]}
      size={[480, 290]}
      hold={[2400, 2600, 2800, 3400]}
    >
      {(step) => {
        const frozen = step >= 1;
        const reached = step >= 2;
        return (
          <>
            <Label x={40} y={18} tone="muted" size={13} anchor="start">
              {"what the camera shows, picture by picture →"}
            </Label>
            {Array.from({ length: FRAMES }, (_, i) => {
              const [gx, gy] = inFrame(frozen ? 0 : i);
              const stale = frozen && i > 0;
              return (
                <g key={i} transform={`translate(${frameX(i)} ${STRIP_Y})`}>
                  <rect width={FW} height={FH} rx={6} className={`a-t ${stale ? "t-accent" : "t-faint"} a-fill-surface a-stroke`} strokeWidth={stale ? 2 : 1.5} />
                  <circle cx={46} cy={32} r={6} className="t-action a-fill-soft a-stroke" strokeWidth={1.5} />
                  <Move x={gx} y={gy} delay={i * 40}>
                    <circle r={4} className="t-ink a-fill" />
                  </Move>
                </g>
              );
            })}
            <rect x={frameX(0) - 5} y={STRIP_Y - 5} width={FW + 10} height={FH + 10} rx={8} fill="none" className="a-t t-mark a-stroke" strokeWidth={3} style={{ opacity: step === 3 ? 1 : 0 }} />
            <Label x={frameX(3) + FW / 2} y={STRIP_Y + FH + 16} tone="accent" size={14} weight={700} opacity={frozen ? 1 : 0}>
              frozen: always the first picture
            </Label>

            <Path d={`M${START[0]} ${START[1]}L${CAN[0]} ${CAN[1]}`} tone="faint" width={2} dashed />
            <TopObject kind="cube" x={196} y={250} />
            <TopObject kind="nut" x={410} y={150} />
            <TopObject kind="can" x={CAN[0]} y={CAN[1]} tone="action" />
            <TopGripper x={reached ? CAN[0] - 6 : START[0]} y={reached ? CAN[1] - 2 : START[1]} closed={reached} />
            <Label x={CAN[0]} y={CAN[1] + 30} tone="success" size={14} weight={700} opacity={reached ? 1 : 0} delay={400}>
              still at the can
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
