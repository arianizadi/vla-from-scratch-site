"use client";

import { AnimationFrame, Arrow, Dot, Label, Path } from "@/animations";
import { PlantTop } from "./parts";

const CX = 100;
const CY = 126;
const R = 60;

/** From above: the robot's drive, where it ended up, and the expert's moves from there. */
const ROBOT = "M100 300C70 270 58 228 92 226C130 224 168 214 160 188";
const HANDOVER: [number, number] = [160, 188];
/** Backing out of the plant and returning to the lane in front of it: moves the ordinary expert never makes. */
const PREAMBLE = "M160 188L190 236L100 244";
/** Then the expert's ordinary plan: in from the front to the cut. */
const PLAN = "M100 244L100 198";

const STATUS = [
  ["The robot drives", "and ends up somewhere new"],
  ["The expert takes over", "only its part is recorded"],
];

/** The two faults of the first try (step 3) and their fixes (step 4 on), in the same places. */
const FAULTS = [
  { y: 206, bad: "✗ back-out moves", good: "✓ back-out moves left out" },
  { y: 230, bad: "✗ no jaws-shut ending", good: "✓ jaws-shut ending added" },
];

export function Takeover() {
  return (
    <AnimationFrame
      title="Let the expert take over"
      description="Seen from above, the robot drives and ends up beside the plant, somewhere its examples never went. The expert takes over from there and only its part is recorded. In the first try the expert first backed out and returned to the front, moves the normal examples never make, so the same picture got two opposite answers, and the recordings lacked the jaws-shut ending. Training got worse: 0 to 28 plants in 100, against 56 to 79 without. The second try left out the back-out moves and added the ending: no collapse, but no better on average: 83, 24 and 68 against 79, 56 and 78."
      steps={[
        "The robot drives, and ends up somewhere its examples never went.",
        "The expert takes over from there and finishes. Only its part is recorded.",
        "First try: the expert backed out first. Normal examples never do that.",
        "One picture, two opposite answers, and no jaws-shut ending. Training got worse.",
        "Second try: leave out the back-out moves, add the jaws-shut ending.",
        "No collapse now. But on average, no better than without it.",
      ]}
      size={[480, 330]}
      hold={[2600, 2800, 2800, 3400, 2800, 4200]}
    >
      {(step) => {
        const conflict = step === 2 || step === 3;
        return (
          <>
            <PlantTop x={CX} y={CY} r={R} shoots={[{ angle: 40 }, { angle: 200 }]} />

            {/* The robot's drive and where it handed over */}
            <Path d={ROBOT} tone="action" width={2.5} drawn />
            <Dot x={HANDOVER[0]} y={HANDOVER[1]} r={7} tone="action" />
            <Label x={100} y={316} tone="muted" size={13}>
              robot starts here
            </Label>

            {/* The expert's part */}
            <Path d={PREAMBLE} tone="ink" width={2.5} drawn={step === 1} />
            <Path d={PREAMBLE} tone="failure" width={3} drawn={conflict} />
            <Path d={PREAMBLE} tone="faint" width={2.5} dashed drawn={step >= 4} />
            <Path d={PLAN} tone="ink" width={2.5} drawn={step >= 1} />
            <Label x={150} y={264} tone="failure" size={14} weight={700} opacity={conflict ? 1 : 0}>
              back out
            </Label>

            {/* Steps 0-1: who is driving */}
            {STATUS.map(([head, sub], i) => (
              <g key={head}>
                <Label x={216} y={52} tone="ink" size={16} anchor="start" weight={700} opacity={step === i ? 1 : 0}>
                  {head}
                </Label>
                <Label x={216} y={76} tone="muted" size={14} anchor="start" opacity={step === i ? 1 : 0}>
                  {sub}
                </Label>
              </g>
            ))}

            {/* Step 2 on: one picture, two answers */}
            <g className="a-t" style={{ opacity: step >= 2 ? 1 : 0 }}>
              <Label x={216} y={52} tone="ink" size={15} anchor="start" weight={700}>
                One picture, two answers
              </Label>
              <rect x={218} y={97} width={56} height={42} rx={6} className="t-vision a-fill-soft a-stroke" strokeWidth={1.5} />
              <circle cx={240} cy={118} r={11} className="t-muted a-fill-surface a-stroke" strokeWidth={1.5} />
              <line x1={248} y1={124} x2={262} y2={130} className="t-accent a-stroke" strokeWidth={2.5} strokeLinecap="round" />
              <Arrow from={[278, 110]} to={[300, 98]} tone="faint" width={1.5} />
              <Arrow from={[278, 126]} to={[300, 140]} tone="faint" width={1.5} />
              <Label x={306} y={86} tone="muted" size={13} anchor="start">
                normal examples
              </Label>
              <Label x={306} y={106} tone="ink" size={15} anchor="start" weight={700}>
                close in
              </Label>
              <Label x={306} y={140} tone="muted" size={13} anchor="start">
                takeover examples
              </Label>
            </g>
            <Label x={306} y={160} tone="failure" size={15} anchor="start" weight={700} opacity={conflict ? 1 : 0}>
              back out
            </Label>
            <Label x={306} y={160} tone="success" size={15} anchor="start" weight={700} opacity={step >= 4 ? 1 : 0}>
              left out ✓
            </Label>

            {/* The faults, then the fixes */}
            {FAULTS.map((row, i) => (
              <g key={row.y}>
                <Label x={216} y={row.y} tone="failure" size={14} anchor="start" opacity={step === 3 ? 1 : 0} delay={i * 150}>
                  {row.bad}
                </Label>
                <Label x={216} y={row.y} tone="success" size={14} anchor="start" opacity={step >= 4 ? 1 : 0} delay={i * 150}>
                  {row.good}
                </Label>
              </g>
            ))}

            {/* What training on them did */}
            <Label x={216} y={268} tone="failure" size={15} anchor="start" weight={700} opacity={step === 3 ? 1 : 0}>
              worse: 0–28 of 100
            </Label>
            <Label x={216} y={292} tone="muted" size={14} anchor="start" opacity={step === 3 ? 1 : 0}>
              without them: 56–79
            </Label>
            <Label x={216} y={268} tone="success" size={15} anchor="start" weight={700} opacity={step === 4 ? 1 : 0}>
              no collapse now
            </Label>
            <Label x={216} y={268} tone="ink" size={14} anchor="start" weight={700} opacity={step === 5 ? 1 : 0}>
              with takeovers: 83, 24, 68
            </Label>
            <Label x={216} y={292} tone="muted" size={14} anchor="start" opacity={step === 5 ? 1 : 0}>
              without them: 79, 56, 78
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
