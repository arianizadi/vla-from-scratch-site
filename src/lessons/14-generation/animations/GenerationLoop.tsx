"use client";

import { AnimationFrame, Arrow, Bar, Box, Chip, Label, stagger } from "@/animations";

const SIZE = 14;
const chipWidth = (text: string) => text.length * SIZE * 0.6 + SIZE * 1.2;

/** A toy prompt and the three tokens the loop adds, then the end token. */
const PROMPT = ["the", "red", "cube", "is"];
const ADDED = ["on", "the", "table", "end"];
const ROW = [...PROMPT, ...ADDED];
const ROW_X = (() => {
  let x = 34;
  return ROW.map((text) => {
    const centre = x + chipWidth(text) / 2;
    x += chipWidth(text) + 8;
    return centre;
  });
})();
const ROW_Y = 44;

/** Made-up chances for the next token at each pass, highest first. */
const CANDIDATES = [
  [
    { text: "on", p: 0.62 },
    { text: "in", p: 0.2 },
    { text: "near", p: 0.1 },
    { text: "big", p: 0.08 },
  ],
  [
    { text: "the", p: 0.7 },
    { text: "a", p: 0.18 },
    { text: "top", p: 0.08 },
    { text: "it", p: 0.04 },
  ],
  [
    { text: "table", p: 0.55 },
    { text: "floor", p: 0.25 },
    { text: "box", p: 0.12 },
    { text: "red", p: 0.08 },
  ],
  [
    { text: "end", p: 0.8 },
    { text: "and", p: 0.1 },
    { text: "with", p: 0.06 },
    { text: "now", p: 0.04 },
  ],
];
/** Which set of chances each step shows, and how many tokens have been added by then. */
const PASS = [0, 0, 1, 2, 3];
const ADDED_BY = [0, 1, 2, 3, 4];

const BAR_X = (index: number) => 290 + index * 50;
const BAR_BASE = 216;
const BAR_H = 84;

export function GenerationLoop() {
  return (
    <AnimationFrame
      title="One token at a time"
      description="The text the red cube is goes into the model, which gives a chance to every possible next token. The most likely one, on, is added to the text. The longer text goes back in for new chances, and the, then table, are added the same way. Finally the model's top pick is a special end token, and the loop stops. Made-up chances."
      steps={[
        "The text so far goes in. The model gives every possible next token a chance (made-up).",
        "The top pick joins the end of the text.",
        "The longer text goes back in: new chances, a new pick.",
        "Again: one token per pass through the model.",
        "When the top pick is the special end token, the loop stops.",
      ]}
      size={[480, 260]}
    >
      {(step) => {
        const set = CANDIDATES[PASS[step]];
        const added = ADDED_BY[step];
        return (
          <>
            {PROMPT.map((text, index) => (
              <Chip key={`p-${index}`} x={ROW_X[index]} y={ROW_Y} text={text} tone="language" size={SIZE} />
            ))}
            {ADDED.map((text, index) => {
              const shown = index < added;
              const isEnd = text === "end";
              return (
                <Chip
                  key={`a-${index}`}
                  x={shown ? ROW_X[PROMPT.length + index] : BAR_X(0)}
                  y={shown ? ROW_Y : BAR_BASE - BAR_H}
                  text={text}
                  tone={isEnd ? "faint" : "language"}
                  variant={isEnd ? "outline" : "soft"}
                  size={SIZE}
                  active={shown && index === added - 1}
                  opacity={shown ? 1 : 0}
                />
              );
            })}

            <Arrow from={[96, ROW_Y + 22]} to={[96, 120]} tone={step === 0 || step === 2 ? "accent" : "faint"} width={2} flow={step === 2} />
            <Box x={96} y={158} w={136} h={64} label="model" active={step === 0 || step >= 2} />
            <Arrow from={[168, 158]} to={[256, 158]} tone="faint" width={1.5} />

            <Label x={365} y={100} tone="muted" size={14}>
              chance of each next token
            </Label>
            {set.map((candidate, index) => (
              <Bar
                key={`bar-${index}`}
                x={BAR_X(index)}
                y={BAR_BASE}
                height={BAR_H}
                value={candidate.p / 0.8}
                width={28}
                tone={index === 0 ? "accent" : "faint"}
                name={candidate.text}
                delay={stagger(index)}
              />
            ))}
          </>
        );
      }}
    </AnimationFrame>
  );
}
