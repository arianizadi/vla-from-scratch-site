"use client";

import { AnimationFrame, Bar, Chip, Dot, Gripper, Label, Path } from "@/animations";

/** Named stem cut, per 100 tries, at each of 11 checkpoints of one training run (lab notebook, step 5, twice the budget). */
const CUT = [21, 19, 26, 65, 76, 80, 79, 84, 84, 82, 87];
/** How many checkpoints each animation step has revealed. */
const SHOWN = [0, 2, 3, 4, 11];
/** Which flower the robot goes for in each step: -1 none yet. */
const CHOICE = [-1, 0, 2, 1, 1];

const FLOWERS = [
  { word: "red", x: 140 },
  { word: "orange", x: 240 },
  { word: "pink", x: 340 },
];
const NAMED = 1;
const HEAD_Y = 110;
const GROUND = 166;

const BASE = 304;
const BAR_H = 76;
const barX = (i: number) => 88 + i * 30;

export function LateClick() {
  return (
    <AnimationFrame
      title="Look-alikes: the colour word clicks late"
      description="Three flowers of one shape, called red, orange and pink; the instruction asks for the orange one. Early in training the robot goes for a flower at random and cuts the named stem in about one try in five. Within one checkpoint it starts to read the colour word, and from then on it cuts the named stem in most tries, up to 87 in 100 at the end of the run."
      steps={[
        "Three flowers of one shape. Only the colour word says which one to cut.",
        "Early in training it goes for a flower at random: wrong most of the time.",
        "Another checkpoint, still guessing. It looks stuck.",
        "Then, within one checkpoint, it starts reading the colour word.",
        "From then on it cuts the named flower in most tries.",
      ]}
      size={[480, 330]}
      hold={[2400, 2200, 2200, 2600, 3400]}
    >
      {(step) => {
        const choice = CHOICE[step];
        const target = choice >= 0 ? FLOWERS[choice].x : 240;
        const right = choice === NAMED;
        return (
          <>
            <Chip x={240} y={20} text="cut the orange flower" tone="language" size={14} mono={false} />

            <Path d={`M60 ${GROUND}H420`} tone="faint" width={2} />
            {FLOWERS.map((flower, i) => (
              <g key={flower.word}>
                <Path d={`M${flower.x} ${GROUND}V${HEAD_Y + 12}`} tone="muted" width={3} />
                <Dot x={flower.x} y={HEAD_Y} r={20} tone={i === NAMED ? "success" : "failure"} hollow opacity={choice === i ? 1 : 0} />
                <Dot x={flower.x} y={HEAD_Y} r={13} tone="muted" />
                <Label x={flower.x} y={GROUND + 16} tone={i === NAMED && right ? "ink" : "muted"} size={14} weight={i === NAMED && right ? 700 : 400}>
                  {flower.word}
                </Label>
              </g>
            ))}
            <Gripper x={target} y={46} open={choice >= 0 ? 0.4 : 1} tone="ink" size={0.8} />
            <Label x={target + 34} y={60} tone={right ? "success" : "failure"} size={14} weight={700} anchor="start" opacity={choice >= 0 ? 1 : 0}>
              {right ? "right" : "wrong"}
            </Label>

            <Label x={60} y={BASE - BAR_H - 20} tone="muted" size={13} anchor="start">
              named flower cut, per 100 tries, at each checkpoint
            </Label>
            <Path d={`M72 ${BASE}H408`} tone="faint" width={1.5} />
            {CUT.map((value, i) => (
              <Bar
                key={i}
                x={barX(i)}
                y={BASE}
                height={BAR_H}
                value={i < SHOWN[step] ? value / 100 : 0}
                width={18}
                tone={value >= 50 ? "success" : "muted"}
                delay={i * 40}
              />
            ))}
            <Label x={408} y={BASE + 16} tone="muted" size={13} anchor="end">
              {"training →"}
            </Label>
            <Label x={barX(10)} y={BASE - BAR_H * 0.87 - 14} tone="ink" size={14} weight={700} opacity={step === 4 ? 1 : 0}>
              87
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
