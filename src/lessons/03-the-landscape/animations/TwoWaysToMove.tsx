"use client";

import { AnimationFrame, Chip, Label, Line, Path, stagger } from "@/animations";

/* Left: a move rounded to a notch and written as a number. Right: a scribble cleaned into a smooth motion. */

const RULER_X = 34;
const RULER_W = 176;
const RULER_Y = 128;
const TICKS = 16;
const SPOKEN = [
  { value: "112", tick: 7 },
  { value: "87", tick: 5 },
  { value: "203", tick: 13 },
];
const CHIP_Y = 196;

/** Fixed offsets for the scribble (a toy, the same on every load). */
const OFFSETS = [0, 34, -28, 40, -36, 22, -44, 30, -18, 38, -30, 26, -40, 18, -24, 36, -32, 20, -14, 0];
const LEVELS = [1, 0.45, 0];

function curve(level: number): [number, number][] {
  return OFFSETS.map((offset, index) => {
    const x = 266 + index * 10;
    const smooth = 150 - 52 * Math.sin(((x - 266) / 190) * Math.PI);
    return [x, Math.round((smooth + offset * level) * 10) / 10];
  });
}

export function TwoWaysToMove() {
  return (
    <AnimationFrame
      title="Two ways to produce a move"
      description="One family rounds each joint's move to one of 256 notches and writes the notch numbers one after another, like words in a sentence. The other starts from a random scribble and cleans it up over a few steps until it is one smooth motion."
      steps={[
        "Way 1: round a joint's move to the nearest of 256 notches.",
        "Write the notch's number, like a word.",
        "Then the next number, and the next: one at a time.",
        "Way 2: start from a random scribble.",
        "Clean it up a little at each step…",
        "…until it is one smooth motion.",
      ]}
      size={[480, 260]}
    >
      {(step) => {
        const left = step <= 2;
        const marker = SPOKEN[step >= 2 ? 2 : 0].tick;
        return (
          <>
            <Path d="M240 20V240" tone="faint" width={1} dashed />
            <Label x={122} y={34} tone={left ? "ink" : "muted"} size={15} weight={700}>
              like writing words
            </Label>
            <Label x={362} y={34} tone={left ? "muted" : "ink"} size={15} weight={700}>
              like cleaning a sketch
            </Label>

            <path className="t-faint a-stroke" d={`M${RULER_X} ${RULER_Y}H${RULER_X + RULER_W}`} strokeWidth={2} />
            {Array.from({ length: TICKS + 1 }, (_, index) => (
              <path
                key={index}
                className="t-faint a-stroke"
                d={`M${RULER_X + (index / TICKS) * RULER_W} ${RULER_Y - 7}v14`}
                strokeWidth={1.5}
              />
            ))}
            <Label x={RULER_X + RULER_W / 2} y={RULER_Y + 26} tone="muted" size={13}>
              256 notches (16 drawn)
            </Label>
            <g
              className="a-t t-action"
              style={{ transform: `translate(${RULER_X + (marker / TICKS) * RULER_W}px, ${RULER_Y - 22}px)`, opacity: left ? 1 : 0.35 }}
            >
              <path className="a-fill" d="M-7 -8H7L0 4Z" />
            </g>
            {SPOKEN.map((word, index) => (
              <Chip
                key={word.value}
                x={60 + index * 62}
                y={CHIP_Y}
                text={word.value}
                tone="action"
                variant="outline"
                size={15}
                opacity={step >= (index === 0 ? 1 : 2) ? 1 : 0}
                delay={stagger(index, 60)}
              />
            ))}

            {LEVELS.map((level, index) => (
              <Line
                key={level}
                points={curve(level)}
                tone={index === 2 ? "action" : "faint"}
                width={index === 2 ? 3.5 : 2.5}
                drawn={step >= 3 + index}
                opacity={step === 3 + index ? 1 : step > 3 + index ? 0.22 : 0}
              />
            ))}
            <Label x={362} y={226} tone="muted" size={13} opacity={step >= 3 ? 1 : 0}>
              {step === 3 ? "random scribble" : step === 4 ? "cleaner" : "one smooth motion"}
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
