"use client";

import { AnimationFrame, Chip, Gripper, Label } from "@/animations";
import { PlantTop, polar } from "./parts";

const CX = 130;
const CY = 130;
const R = 80;

/** The stand's total turn in each step (clockwise on screen), and which button is held (1 clockwise, 0 none). */
const TURN = [0, 130, 130, 130, 130];
const HELD = [0, 1, 0, 0, 0];
/** Shoot A starts pointing away; shoot B (a new plant, step 3 on) already faces the arm once the stand has turned. */
const SHOOT_A = -40;
const SHOOT_B = 95 - 130;

/** The "in reach" wedge in front of the plant: 25 degrees either side of straight at the arm. */
const WEDGE = (() => {
  const [ax, ay] = polar(65, R);
  const [bx, by] = polar(115, R);
  const [cx2, cy2] = polar(115, 30);
  const [dx, dy] = polar(65, 30);
  return `M${CX + dx} ${CY + dy}L${CX + ax} ${CY + ay}A${R} ${R} 0 0 1 ${CX + bx} ${CY + by}L${CX + cx2} ${CY + cy2}A30 30 0 0 0 ${CX + dx} ${CY + dy}Z`;
})();

const STATUS = [
  ["Out of reach", "the shoot points away"],
  ["Holds ↻", "the short way round"],
  ["Lets go, then cuts", "the shoot faces the arm"],
  ["No press at all", "already facing the arm"],
];

const CHECKS = [
  { y: 112, tag: "shoot out of reach", value: "pressed for 43 of 46" },
  { y: 162, tag: "shoot facing the arm", value: "no press" },
  { y: 212, tag: "at the cut", value: "about 3° off" },
  { y: 262, tag: "buttons switched", value: "never" },
];

export function TurnOnPurpose() {
  return (
    <AnimationFrame
      title="Turning on purpose, seen from above"
      description="Seen from above, a shoot points away from the arm, outside the zone it can reach. The robot holds the clockwise button, the short way, until the shoot faces the arm, lets go and cuts it. On a plant whose shoot already faces the arm it presses nothing. Recorded on 60 new plants: it pressed for 43 of 46 shoots out of reach, never for one facing it, never switched buttons, and stopped with the shoot about 3 degrees off."
      steps={[
        "From above: the arm waits in front. This shoot points away, out of reach.",
        "It holds the button that turns the shoot toward the arm, the short way.",
        "It lets go once the shoot faces the arm, then reaches in and cuts.",
        "A shoot that already faces the arm: no button at all.",
        "Every press was recorded on 60 new plants. It turns only when it has to.",
      ]}
      size={[480, 320]}
      hold={[2600, 2800, 2600, 2600, 4200]}
    >
      {(step) => {
        const reaching = step === 2;
        return (
          <>
            <PlantTop
              x={CX}
              y={CY}
              r={R}
              turn={TURN[step]}
              shoots={[
                { angle: SHOOT_A, opacity: step >= 2 ? 0 : 1, delay: step === 2 ? 700 : 0 },
                { angle: SHOOT_B, opacity: step >= 3 ? 1 : 0 },
              ]}
            />
            {/* The "in reach" zone in front, outlined on top so the shoots stay visible */}
            <path
              d={WEDGE}
              fill="none"
              className="t-success a-stroke a-t"
              strokeWidth={2}
              strokeDasharray="5 4"
              strokeLinejoin="round"
              style={{ opacity: step <= 3 ? 1 : 0.5 }}
            />
            <Label x={CX + 52} y={232} tone="success" size={14} anchor="start" weight={700} opacity={step <= 1 ? 1 : 0}>
              in reach
            </Label>

            {/* The hand */}
            <Gripper x={CX} y={reaching ? 206 : 300} angle={180} open={reaching ? 0 : 1} tone="ink" size={0.8} />
            <Label x={CX + 30} y={292} tone="muted" size={14} anchor="start">
              arm
            </Label>

            {/* The two buttons */}
            <Label x={50} y={262} tone="muted" size={14}>
              buttons
            </Label>
            <Chip x={30} y={292} text="↺" mono={false} tone="muted" size={16} />
            <Chip
              x={70}
              y={292}
              text="↻"
              mono={false}
              tone={HELD[step] ? "accent" : "muted"}
              variant={HELD[step] ? "solid" : "soft"}
              size={16}
            />

            {/* What happens now (steps 0-3) */}
            {STATUS.map(([head, sub], i) => (
              <g key={head}>
                <Label x={252} y={112} tone={i === 1 ? "accent" : "ink"} size={17} anchor="start" weight={700} opacity={step === i ? 1 : 0}>
                  {head}
                </Label>
                <Label x={252} y={138} tone="muted" size={14} anchor="start" opacity={step === i ? 1 : 0}>
                  {sub}
                </Label>
              </g>
            ))}

            {/* The check (step 4) */}
            <Label x={252} y={60} tone="ink" size={15} anchor="start" weight={700} opacity={step === 4 ? 1 : 0}>
              On 60 new plants:
            </Label>
            {CHECKS.map((row, i) => (
              <g key={row.tag}>
                <Label x={252} y={row.y} tone="muted" size={14} anchor="start" opacity={step === 4 ? 1 : 0} delay={i * 120}>
                  {row.tag}
                </Label>
                <Label x={252} y={row.y + 20} tone="ink" size={15} anchor="start" weight={700} opacity={step === 4 ? 1 : 0} delay={i * 120}>
                  {row.value}
                </Label>
              </g>
            ))}
          </>
        );
      }}
    </AnimationFrame>
  );
}
