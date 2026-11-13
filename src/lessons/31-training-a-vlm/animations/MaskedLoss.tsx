"use client";

import { AnimationFrame, Arrow, Box, Chip, Dot, Label, stagger } from "@/animations";

const ROW = 112;
const TOKENS = [
  { text: "img", x: 36, kind: "picture" as const },
  { text: "img", x: 82, kind: "picture" as const },
  { text: "img", x: 128, kind: "picture" as const },
  { text: "the", x: 190, kind: "word" as const },
  { text: "red", x: 242, kind: "word" as const },
  { text: "cube", x: 300, kind: "word" as const },
  { text: "pad", x: 360, kind: "pad" as const },
  { text: "pad", x: 410, kind: "pad" as const },
];
const GRADE: [number, number] = [300, 232];
const ENCODER: [number, number] = [82, 232];

export function MaskedLoss() {
  return (
    <AnimationFrame
      title="Guess the next word, with a picture"
      description="The training row holds picture seats, then the caption, then padding. At every position the model guesses the next token. Only the caption words are graded; picture seats and padding are skipped. Every wrong guess sends a correction back through the model, all the way to the vision encoder."
      steps={[
        "The row: picture seats, then the caption, then padding.",
        "At every position, the model guesses what comes next.",
        "Only caption words are graded. Picture seats and padding are skipped.",
        "Each wrong guess sends a correction back, all the way to the eyes.",
      ]}
      size={[480, 280]}
    >
      {(step) => (
        <>
          {TOKENS.map((token, i) => (
            <Chip
              key={i}
              x={token.x}
              y={ROW}
              text={token.text}
              tone={token.kind === "picture" ? "vision" : token.kind === "word" ? "language" : "faint"}
              variant={token.kind === "picture" ? "solid" : token.kind === "pad" ? "outline" : "soft"}
              size={14}
            />
          ))}
          {TOKENS.slice(1).map((token, i) => {
            const graded = token.kind === "word";
            return (
              <Arrow
                key={`guess-${i}`}
                from={[TOKENS[i].x + 4, ROW - 22]}
                to={[token.x - 4, ROW - 22]}
                bend={-16}
                tone={graded ? "accent" : "faint"}
                width={graded ? 2 : 1.5}
                drawn={step >= 1} opacity={step >= 1 ? 1 : 0}
                delay={step === 1 ? stagger(i, 120) : 0}
              />
            );
          })}
          <Label x={242} y={40} tone="accent" size={14} weight={700} opacity={step === 1 ? 1 : 0}>
            guess the next one
          </Label>

          {TOKENS.map((token, i) =>
            token.kind === "word" ? (
              <Dot key={`dot-${i}`} x={token.x} y={ROW + 34} r={6} tone="accent" opacity={step >= 2 ? 1 : 0} delay={stagger(i)} />
            ) : null,
          )}
          <Label x={242} y={ROW + 58} tone="accent" size={14} weight={700} opacity={step === 2 ? 1 : 0}>
            graded
          </Label>
          <Label x={82} y={ROW + 40} tone="faint" size={14} opacity={step >= 2 ? 1 : 0}>
            skipped
          </Label>
          <Label x={385} y={ROW + 40} tone="faint" size={14} opacity={step >= 2 ? 1 : 0}>
            skipped
          </Label>

          {[190, 242, 300].map((x, i) => (
            <Arrow key={`in-${x}`} from={[x, ROW + 44]} to={[GRADE[0] - 30 + i * 30, GRADE[1] - 22]} tone="accent" width={1.5} drawn={step === 3} opacity={step === 3 ? 1 : 0} delay={stagger(i)} />
          ))}
          <Box x={GRADE[0]} y={GRADE[1]} w={110} h={40} label="grade" tone="ink" active={step === 3} opacity={step === 3 ? 1 : 0} />
          <Arrow from={[GRADE[0] - 58, GRADE[1]]} to={[ENCODER[0] + 58, ENCODER[1]]} tone="accent" drawn={step === 3} opacity={step === 3 ? 1 : 0} flow={step === 3} />
          <Box x={ENCODER[0]} y={ENCODER[1]} w={110} h={40} label="encoder" tone="vision" filled active={step === 3} opacity={step === 3 ? 1 : 0} />
          <Label x={ENCODER[0] + 109} y={GRADE[1] - 16} tone="accent" size={13} opacity={step === 3 ? 1 : 0}>
            correction
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
