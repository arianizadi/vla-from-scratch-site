"use client";

import { AnimationFrame, Arrow, Box, Chip, Label } from "@/animations";

const ROWS = [
  { name: "in training", y: 92 },
  { name: "on the robot", y: 218 },
];
const SLOT_X = 92;
const POLICY_X = 252;
const OUT_X = 396;

/** A move that heads for the target: an arrow inside the slot. */
function MoveIcon({ y, opacity }: { y: number; opacity: number }) {
  return (
    <g className="a-t t-action" style={{ opacity }}>
      <path d={`M${SLOT_X - 16} ${y + 12}L${SLOT_X + 14} ${y - 12}M${SLOT_X + 2} ${y - 13}H${SLOT_X + 15}V${y}`} className="a-stroke" strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

/** "Stay still": a pause sign inside the slot. */
function HoldIcon({ y, opacity }: { y: number; opacity: number }) {
  return (
    <g className="a-t t-muted" style={{ opacity }}>
      <rect x={SLOT_X - 11} y={y - 13} width={7} height={26} rx={2} className="a-fill" />
      <rect x={SLOT_X + 4} y={y - 13} width={7} height={26} rx={2} className="a-fill" />
    </g>
  );
}

export function HiddenAnswer() {
  return (
    <AnimationFrame
      title="An answer hidden in the input"
      description="A policy with memory gets its previous move as an input slot. In training, the first slot of an example was filled with a copy of the expert's first move, which already points at the target, so the policy learned to follow that hint. On the robot the same slot says stay still, the hint is gone, and the policy does not know where to go."
      steps={[
        "A policy with memory gets its previous move as an input.",
        "A training example that starts at the beginning has no previous move. A copy of the expert's first move fills the gap.",
        "That copy already points at the target. The policy learns to follow the hint.",
        "On the robot, the slot says ‘stay still’. No hint, and the policy is lost.",
      ]}
      hold={[2400, 3000, 2600, 3200]}
      size={[480, 290]}
    >
      {(step) => (
        <>
          {ROWS.map((row, index) => {
            const robot = index === 1;
            const shown = robot ? step >= 3 : step >= 1;
            return (
              <g key={row.name} style={{ opacity: robot && step < 3 ? 0.35 : 1 }} className="a-t">
                <Label x={16} y={row.y - 52} tone="muted" size={14} weight={700} anchor="start">
                  {row.name}
                </Label>
                <Box x={SLOT_X} y={row.y} w={76} h={56} tone="ink" active={!robot && step === 2} />
                <Label x={SLOT_X} y={row.y + 44} tone="muted" size={13}>
                  previous move
                </Label>
                {robot ? <HoldIcon y={row.y} opacity={shown ? 1 : 0} /> : <MoveIcon y={row.y} opacity={shown ? 1 : 0} />}

                <Arrow from={[SLOT_X + 44, row.y]} to={[POLICY_X - 42, row.y]} tone={shown ? "accent" : "faint"} flow={shown && (robot ? step === 3 : step === 2)} />
                <Box x={POLICY_X} y={row.y} w={80} h={48} label="policy" tone="ink" filled />
                <Arrow from={[POLICY_X + 44, row.y]} to={[OUT_X - 52, row.y]} tone="faint" drawn={robot ? step >= 3 : step >= 2} />
              </g>
            );
          })}

          <Label x={SLOT_X + 54} y={ROWS[0].y - 40} tone="ink" size={14} weight={700} anchor="start" opacity={step === 2 ? 1 : 0}>
            the answer, sitting in the input
          </Label>
          <Label x={SLOT_X + 54} y={ROWS[0].y - 40} tone="action" size={14} weight={700} anchor="start" opacity={step === 1 ? 1 : 0}>
            copied from the expert’s first move
          </Label>
          <Chip x={OUT_X + 14} y={ROWS[0].y} text="to the target" tone="success" variant="soft" mono={false} size={14} opacity={step >= 2 ? 1 : 0} />
          <Chip x={OUT_X + 14} y={ROWS[1].y} text="no idea" tone="failure" variant="soft" mono={false} size={14} opacity={step >= 3 ? 1 : 0} />
        </>
      )}
    </AnimationFrame>
  );
}
