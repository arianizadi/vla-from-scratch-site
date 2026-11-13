"use client";

import { AnimationFrame, Bracket, Dot, Label, Move, Path } from "@/animations";

/** Top view. 600 drawing units per metre: the 0.50 m lever arm is 300 units, the 45 mm cube 27. */
const BASE: [number, number] = [80, 150];
const LEVER = 300;
const CUBE = 27;
/** The turn is drawn ten times larger than 0.01 rad, or the 5 mm arc would be 3 units long. */
const DRAWN_ANGLE = 0.1;
const DEGREES = (DRAWN_ANGLE * 180) / Math.PI;
const tidy = (value: number) => Math.round(value * 10) / 10;
const TIP: [number, number] = [BASE[0] + LEVER, BASE[1]];
const TURNED: [number, number] = [tidy(BASE[0] + LEVER * Math.cos(DRAWN_ANGLE)), tidy(BASE[1] - LEVER * Math.sin(DRAWN_ANGLE))];

export function LeverArm() {
  return (
    <AnimationFrame
      title="From radians to millimetres"
      description="Seen from above, the base joint turns the whole arm. The gripper is half a metre from that joint: the lever arm. Turning the joint by about half a degree moves the gripper along an arc of 5 millimetres, because the arc is the lever arm times the angle. A grasp forgives only about a centimetre."
      steps={[
        "Seen from above: the base joint turns the whole arm, like a door on its hinge.",
        "The gripper is half a metre from that joint. That distance is the lever arm.",
        "Turn the joint by about half a degree (drawn ten times larger): the gripper sweeps an arc.",
        "Arc = lever arm × angle: 5 mm at the gripper. A grasp forgives about a centimetre.",
      ]}
      size={[480, 284]}
    >
      {(step) => {
        const turned = step >= 2;
        return (
          <>
            <rect
              x={TIP[0] - CUBE / 2}
              y={TIP[1] - CUBE / 2}
              width={CUBE}
              height={CUBE}
              rx={3}
              className="t-muted a-fill-soft a-stroke"
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
            <Label x={TIP[0]} y={TIP[1] + 34} tone="muted" size={13}>
              cube, 45 mm
            </Label>

            <Path d={`M${BASE[0]} ${BASE[1]}H${TIP[0]}`} tone="faint" width={2} dashed drawn={turned} />

            <Move x={BASE[0]} y={BASE[1]} rotate={turned ? -DEGREES : 0}>
              <path d={`M0 0H${LEVER}`} className="t-ink a-stroke" strokeWidth={10} strokeLinecap="round" opacity={0.85} />
              <Dot x={LEVER} y={0} r={7} tone="action" />
            </Move>
            <Dot x={BASE[0]} y={BASE[1]} r={14} tone="ink" hollow />
            <Dot x={BASE[0]} y={BASE[1]} r={4} tone="ink" />
            <Label x={BASE[0]} y={BASE[1] + 32} tone="ink" size={14} weight={700}>
              base joint
            </Label>

            <Bracket x1={BASE[0]} x2={TIP[0]} y={BASE[1] + 62} label="lever arm, half a metre" tone="ink" below opacity={step >= 1 ? 1 : 0} />

            <Path
              d={`M${TIP[0]} ${TIP[1]}A${LEVER} ${LEVER} 0 0 0 ${TURNED[0]} ${TURNED[1]}`}
              tone="accent"
              width={3}
              drawn={turned}
              delay={150}
            />
            <Label x={TIP[0] + 22} y={tidy((TIP[1] + TURNED[1]) / 2)} tone="accent" size={14} weight={700} anchor="start" opacity={step >= 3 ? 1 : 0}>
              5 mm
            </Label>
            <Label x={TIP[0] - 4} y={TURNED[1] - 24} tone="muted" size={13} anchor="end" opacity={turned ? 1 : 0}>
              half a degree, drawn ×10
            </Label>
            <Label x={240} y={262} tone="ink" size={14} opacity={step >= 3 ? 1 : 0} delay={300}>
              a grasp forgives about 10 mm
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
