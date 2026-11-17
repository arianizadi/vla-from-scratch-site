"use client";

import { AnimationFrame, Chip, Dot, Gripper, Label, Path, scale } from "@/animations";
import { PlantTop } from "./parts";

const CX = 130;
const CY = 126;
const R = 74;

/** Where the hand goes, from above: its fingertips, the clockwise button, and the cut point in front. */
const EXPERT = "M130 214L80 230L130 170L80 230L130 170";
const GOOD = "M130 214C112 238 88 240 80 230C96 204 150 200 130 170C118 200 72 250 80 230C104 212 146 198 130 170";
const WANDER = "M130 214C190 252 230 196 212 150C196 104 150 70 104 84C62 98 40 150 66 190C90 226 168 240 196 212C220 190 206 162 180 172";

/** The episode clock: 0 to 1000 control steps along the bottom. */
const CLOCK = scale([0, 1000], [40, 440]);
const TRACK_Y = 294;
/** Where the robot's clock marker stands in each step. */
const ROBOT_AT = [0, 640, 1000, 1000, 1000];
/** The step that adds a memory: a second picture, taken one second earlier. */
const MEMORY = 4;

const STATUS = [
  ["The expert", "turn, cut, turn, cut"],
  ["Robot, good try", "the same job, slower"],
  ["Robot, wandering", "near no shoot or button"],
];

/** Final scores out of 100 of three training runs each, with and without the memory (averaged weights). */
const MEMORY_ROWS = [
  { y: 196, text: "with it: 70, 89, 90", tone: "success" as const, weight: 700 as const },
  { y: 220, text: "without: 79, 56, 78", tone: "muted" as const, weight: 400 as const },
  { y: 250, text: "fails less often, not faster", tone: "ink" as const, weight: 400 as const },
];

const SUMMARY = [
  { y: 104, text: "pruned: about 80", tone: "success" as const },
  { y: 134, text: "most misses: out of time", tone: "ink" as const },
  { y: 164, text: "flower damaged: 2 to 7", tone: "failure" as const },
];

export function Wander() {
  return (
    <AnimationFrame
      title="Slow, and sometimes lost"
      description="Seen from above, the expert's hand goes straight from button to shoot and back, finishing in about 515 of the 1000 steps allowed. The robot does the same job more slowly, about 640 steps when it succeeds. Sometimes it wanders around the plant, near no shoot or button, until the clock runs out. Of 100 plants it prunes about 80; most misses run out of time, and the flower is damaged in 2 to 7. Given a second picture, taken one second earlier, three training runs prune 70, 89 and 90 plants in 100 against 79, 56 and 78 without it: it fails less often, but is no faster."
      steps={[
        "The expert goes straight: button, shoot, button, shoot. About 515 steps.",
        "The robot does the same job more slowly: about 640 steps when it succeeds.",
        "Sometimes it wanders, near no shoot or button, until the clock runs out.",
        "Most misses run out of time. The flower is damaged in only 2 to 7 of 100.",
        "Add a picture from one second earlier: it fails less often, but no faster.",
      ]}
      size={[480, 330]}
      hold={[2800, 2800, 3200, 3600, 4200]}
    >
      {(step) => (
        <>
          <PlantTop x={CX} y={CY} r={R} shoots={[{ angle: -20 }, { angle: 200 }]} />

          <Path d={EXPERT} tone="ink" width={2.5} drawn={step === 0} />
          <Path d={GOOD} tone="action" width={2.5} drawn={step === 1} />
          <Path d={WANDER} tone="action" width={2.5} drawn={step >= 2} />

          {/* The hand and the buttons */}
          <Gripper x={CX} y={250} angle={180} open={1} tone="ink" size={0.8} />
          <Chip x={40} y={240} text="↺" mono={false} tone="muted" size={15} />
          <Chip x={80} y={240} text="↻" mono={false} tone="muted" size={15} />
          <Label x={60} y={268} tone="muted" size={14}>
            buttons
          </Label>

          {/* Who is driving, and how it goes */}
          {STATUS.map(([head, sub], i) => (
            <g key={head}>
              <Label x={244} y={64} tone="ink" size={16} anchor="start" weight={700} opacity={step === i ? 1 : 0}>
                {head}
              </Label>
              <Label x={244} y={88} tone="muted" size={14} anchor="start" opacity={step === i ? 1 : 0}>
                {sub}
              </Label>
            </g>
          ))}
          <Label x={244} y={64} tone="ink" size={16} anchor="start" weight={700} opacity={step === 3 ? 1 : 0}>
            Out of 100 plants
          </Label>

          {/* Step 4: a memory, one picture from a second earlier beside the one from now */}
          <g className="a-t" style={{ opacity: step === MEMORY ? 1 : 0 }}>
            <Label x={244} y={64} tone="ink" size={16} anchor="start" weight={700}>
              A memory: two pictures
            </Label>
            {[
              { x: 246, label: "1 s ago", turn: -18 },
              { x: 326, label: "now", turn: 0 },
            ].map((frame) => (
              <g key={frame.label}>
                <rect x={frame.x} y={92} width={60} height={44} rx={6} className="t-vision a-fill-soft a-stroke" strokeWidth={1.5} />
                <circle cx={frame.x + 26} cy={114} r={11} className="t-muted a-fill-surface a-stroke" strokeWidth={1.5} />
                <line
                  x1={frame.x + 34}
                  y1={120 + frame.turn / 6}
                  x2={frame.x + 50}
                  y2={126 + frame.turn / 3}
                  className="t-accent a-stroke"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
                <Label x={frame.x + 30} y={154} tone="muted" size={13}>
                  {frame.label}
                </Label>
              </g>
            ))}
          </g>
          {MEMORY_ROWS.map((row, i) => (
            <Label
              key={row.text}
              x={244}
              y={row.y}
              tone={row.tone}
              size={14}
              anchor="start"
              weight={row.weight}
              opacity={step === MEMORY ? 1 : 0}
              delay={i * 150}
            >
              {row.text}
            </Label>
          ))}
          {SUMMARY.map((row, i) => (
            <Label key={row.text} x={244} y={row.y} tone={row.tone} size={14} anchor="start" weight={700} opacity={step === 3 ? 1 : 0} delay={i * 150}>
              {row.text}
            </Label>
          ))}

          {/* The clock */}
          <Path d={`M${CLOCK(0)} ${TRACK_Y}H${CLOCK(1000)}`} tone="faint" width={3} />
          <Path d={`M${CLOCK(515)} ${TRACK_Y - 7}V${TRACK_Y + 7}`} tone="ink" width={2} />
          <Label x={CLOCK(515)} y={TRACK_Y + 18} tone="ink" size={13}>
            expert: about 515
          </Label>
          <Path d={`M${CLOCK(1000)} ${TRACK_Y - 7}V${TRACK_Y + 7}`} tone="failure" width={2} />
          <Label x={CLOCK(1000)} y={TRACK_Y + 18} tone="muted" size={13} anchor="end">
            limit: 1000
          </Label>
          <Dot x={CLOCK(ROBOT_AT[step])} y={TRACK_Y} r={6} tone="action" opacity={step === 0 || step === MEMORY ? 0 : 1} />
          <Label x={CLOCK(640)} y={TRACK_Y - 20} tone="ink" size={14} weight={700} opacity={step === 1 ? 1 : 0}>
            robot: about 640
          </Label>
          <Label x={CLOCK(1000)} y={TRACK_Y - 20} tone="failure" size={14} anchor="end" weight={700} opacity={step === 2 || step === 3 ? 1 : 0}>
            out of time ✗
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
