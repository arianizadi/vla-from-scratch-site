"use client";

import { AnimationFrame, Arrow, Chip, Gripper, Label } from "@/animations";
import { PlantTop, polar } from "./parts";

const CX = 130;
const CY = 128;
const R = 80;

/** The named shoot starts facing away; the second try turns the plant first. */
const TARGET = -40;
const OTHERS = [160, 215];
const TURN = [0, 0, 0, 130, 130];

/** The "in reach" wedge in front of the plant: 25 degrees either side of straight at the arm. */
const WEDGE = (() => {
  const [ax, ay] = polar(65, R);
  const [bx, by] = polar(115, R);
  const [cx2, cy2] = polar(115, 30);
  const [dx, dy] = polar(65, 30);
  return `M${CX + dx} ${CY + dy}L${CX + ax} ${CY + ay}A${R} ${R} 0 0 1 ${CX + bx} ${CY + by}L${CX + cx2} ${CY + cy2}A30 30 0 0 0 ${CX + dx} ${CY + dy}Z`;
})();

const REST: [number, number] = [CX, 300];
/** The wrist in each step: resting, gone for the shoot without turning, reset, at the shoot, resting after the cut. */
const WRIST: [number, number][] = [REST, [CX + 30, 236], REST, [CX, 224], [CX, 224]];
const OPEN = [1, 0, 1, 0, 0];

const STATUS: [string, string, "ink" | "failure" | "accent"][] = [
  ["Out of reach", "the shoot faces away", "ink"],
  ["A wrong first move", "jaws set, plant not turned", "failure"],
  ["Reset", "back to the start pose", "accent"],
  ["Choose again", "turn first, then cut", "ink"],
];

export function ResetMove() {
  return (
    <AnimationFrame
      title="Back to the start, then choose again"
      description="Seen from above, the sub-goal is to cut the highest shoot, which faces away, out of reach. In about one try in ten the arm goes for it without turning the plant, jaws set to cut. The reset sends the arm back to its start pose; choosing again, it turns the plant first and then cuts. Over 200 tries, the reset raised the score from 169 to 180 with trained wordings and from 148 to 165 with new ones."
      steps={[
        "Sub-goal: cut the highest shoot. It faces away, out of reach.",
        "About one try in ten, the arm goes for it anyway, without turning the plant.",
        "The reset: the arm goes back to its start pose.",
        "Choosing again, it turns the plant first, then cuts.",
        "With the reset: 180 of 200, and 165 of 200 with new wordings.",
      ]}
      size={[480, 330]}
      hold={[2600, 2800, 2400, 3000, 4200]}
    >
      {(step) => {
        const [wx, wy] = WRIST[step];
        return (
          <>
            <PlantTop
              x={CX}
              y={CY}
              r={R}
              turn={TURN[step]}
              shoots={[
                { angle: TARGET, tone: "accent", opacity: step >= 3 ? 0 : 1, delay: step === 3 ? 1500 : 0 },
                ...OTHERS.map((angle) => ({ angle })),
              ]}
            />
            <path
              d={WEDGE}
              fill="none"
              className="t-success a-stroke a-t"
              strokeWidth={2}
              strokeDasharray="5 4"
              strokeLinejoin="round"
            />
            <Label x={CX - 38} y={224} tone="success" size={14} anchor="end" weight={700}>
              in reach
            </Label>

            <Arrow from={[CX + 40, 200]} to={[CX + 50, 112]} tone="failure" dashed opacity={step === 1 ? 1 : 0} drawn={step === 1} />
            <Arrow from={[CX + 46, 252]} to={[CX + 14, 286]} tone="accent" dashed bend={-10} opacity={step === 2 ? 1 : 0} drawn={step === 2} />
            <Gripper x={wx} y={wy} angle={180} open={OPEN[step]} tone={step === 1 ? "failure" : "action"} size={0.8} />

            {/* The sub-goal and what happens now */}
            <Chip x={360} y={36} text="cut the highest shoot" tone="language" variant="solid" mono={false} size={14} />
            {STATUS.map(([head, sub, tone], i) => (
              <g key={head}>
                <Label x={256} y={104} tone={tone} size={17} anchor="start" weight={700} opacity={step === i ? 1 : 0}>
                  {head}
                </Label>
                <Label x={256} y={130} tone="muted" size={14} anchor="start" opacity={step === i ? 1 : 0}>
                  {sub}
                </Label>
              </g>
            ))}

            {/* The result, of 200 tries */}
            <Label x={346} y={96} tone="muted" size={14} opacity={step === 4 ? 1 : 0}>
              trained
            </Label>
            <Label x={424} y={96} tone="muted" size={14} opacity={step === 4 ? 1 : 0}>
              new
            </Label>
            {[
              { name: "no reset", values: ["169", "148"], y: 126, tone: "ink" as const },
              { name: "reset", values: ["180", "165"], y: 156, tone: "accent" as const },
            ].map((row, i) => (
              <g key={row.name}>
                <Label x={256} y={row.y} tone="ink" size={14} anchor="start" opacity={step === 4 ? 1 : 0} delay={i * 150}>
                  {row.name}
                </Label>
                {row.values.map((value, j) => (
                  <Label key={j} x={j === 0 ? 346 : 424} y={row.y} tone={row.tone} size={16} weight={700} opacity={step === 4 ? 1 : 0} delay={i * 150}>
                    {value}
                  </Label>
                ))}
              </g>
            ))}
            <Label x={346} y={186} tone="muted" size={13} opacity={step === 4 ? 1 : 0} delay={300}>
              tries solved of 200, by wording
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
