"use client";

import { AnimationFrame, Label } from "@/animations";
import { PlantTop, Ring, polar } from "./parts";

const CX = 120;
const CY = 134;
const R = 80;

/** The stand's total turn in each step: read the card (180), then bring the named shoot round (90). */
const TURN = [0, 180, 90, 90, 90];
/** The card starts facing away from the camera (up); the named shoot starts pointing right. */
const CARD = -90;
const TARGET = 0;
const OTHERS = [130, 235];

/** The camera's view: a wedge from the front toward the plant. */
const CAM: [number, number] = [CX, 268];
const VIEW = (() => {
  const [ax, ay] = polar(62, R + 6);
  const [bx, by] = polar(118, R + 6);
  return `M${CAM[0]} ${CAM[1]}L${CX + ax} ${CY + ay}M${CAM[0]} ${CAM[1]}L${CX + bx} ${CY + by}`;
})();

const ROWS = [
  { field: "label", y: 74, values: ["not seen", "cyan", "out of view, read cyan", "out of view, read cyan"] },
  { field: "so", y: 134, values: ["read the label first", "cyan names the highest", "cyan names the highest", "cyan names the highest"] },
  { field: "next", y: 194, values: ["show the label", "cut the highest shoot", "cut the highest shoot", "cut the highest shoot"] },
];

const TIP = polar(90, R * 0.8);

export function HiddenLabel() {
  return (
    <AnimationFrame
      title="The note remembers the label"
      description="Seen from above, a card in the pot names the shoot to cut, but it faces away from the front camera, so the note says label not seen. The robot turns the plant until the card faces the camera and the note records cyan, which names the highest shoot. Turning the highest shoot into reach hides the card again, but the note still says read cyan, so the robot cuts the highest shoot. With the card out of view at the cut, the note-writing robot solved 26 of 33, the plain policy 1 of 11."
      steps={[
        "From above: the card in the pot faces away. The camera cannot read it.",
        "The robot turns the plant until the card faces the camera, and the note records it.",
        "It turns the named shoot into reach. That hides the card again.",
        "The camera has lost the card; the note has not. It cuts the highest shoot.",
        "Card out of view at the cut: 26 of 33 solved with a note, 1 of 11 without.",
      ]}
      size={[480, 340]}
      hold={[2600, 3000, 2800, 2800, 4200]}
    >
      {(step) => {
        const seen = step === 1;
        const cut = step >= 3;
        return (
          <>
            <path d={VIEW} className="t-faint a-stroke" strokeWidth={2} strokeDasharray="5 5" fill="none" />
            <PlantTop
              x={CX}
              y={CY}
              r={R}
              turn={TURN[step]}
              card={CARD}
              shoots={[
                { angle: TARGET, tone: step >= 1 ? "accent" : "ink", opacity: cut ? 0 : 1, delay: step === 3 ? 600 : 0 },
                ...OTHERS.map((angle) => ({ angle })),
              ]}
            />
            <Ring x={CX + TIP[0]} y={CY + TIP[1]} r={14} tone="accent" opacity={step === 2 ? 1 : 0} />
            <Label x={CX + 58} y={CY + 72} tone="accent" size={14} anchor="start" weight={700} opacity={step === 3 ? 1 : 0} delay={600}>
              cut
            </Label>

            {/* The camera at the front */}
            <rect x={CAM[0] - 14} y={CAM[1] - 2} width={28} height={16} rx={3} className="t-vision a-fill-soft a-stroke" strokeWidth={1.5} />
            <circle cx={CAM[0]} cy={CAM[1] + 6} r={4} className="t-vision a-stroke a-fill-surface" strokeWidth={1.5} />
            <Label x={CAM[0]} y={CAM[1] + 28} tone="vision" size={14}>
              camera
            </Label>
            <Label x={CAM[0]} y={CAM[1] + 50} tone={seen ? "success" : "muted"} size={14} weight={seen ? 700 : 400}>
              {seen ? "card in view" : "card out of view"}
            </Label>

            {/* The note */}
            <rect x={258} y={34} width={210} height={198} rx={10} className="t-language a-fill-soft a-stroke" strokeWidth={1.5} />
            <Label x={270} y={50} tone="muted" size={13} anchor="start">
              the note
            </Label>
            {ROWS.map((row) => (
              <g key={row.field}>
                <Label x={270} y={row.y} tone="muted" size={14} anchor="start" weight={700}>
                  {row.field}
                </Label>
                {row.values.map((value, i) => (
                  <Label
                    key={i}
                    x={270}
                    y={row.y + 24}
                    tone={row.field === "label" && i >= 1 ? "language" : "ink"}
                    size={14}
                    anchor="start"
                    weight={row.field === "label" && i >= 1 ? 700 : 400}
                    opacity={Math.min(step, 3) === i ? 1 : 0}
                  >
                    {value}
                  </Label>
                ))}
              </g>
            ))}

            {/* The measurement */}
            <Label x={363} y={262} tone="muted" size={14} opacity={step >= 4 ? 1 : 0}>
              card out of view at the cut
            </Label>
            <Label x={363} y={290} tone="success" size={15} weight={700} opacity={step >= 4 ? 1 : 0} delay={150}>
              with a note: 26 of 33
            </Label>
            <Label x={363} y={316} tone="failure" size={15} weight={700} opacity={step >= 4 ? 1 : 0} delay={300}>
              without: 1 of 11
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
