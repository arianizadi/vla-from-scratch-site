"use client";

import { AnimationFrame, Arrow, Chip, Label, stagger } from "@/animations";

/** A toy piece of text, one token per word. */
const TEXT = ["the", "red", "cube", "is", "on", "the", "table"];
const SLOT = 62;
const X0 = 54;
const xAt = (index: number) => X0 + index * SLOT;
const TEXT_Y = 40;
const INPUT_Y = 122;
const TARGET_Y = 214;
const SIDE = xAt(6);

export function NextTokenTargets() {
  return (
    <AnimationFrame
      title="The text is its own answer key"
      description="A piece of text is split into tokens. The inputs are every token but the last; the answers are the same tokens shifted by one, every token but the first. Each place is trained to guess the token that follows it, and with the causal mask one pass checks every guess at once."
      steps={[
        "Any piece of text, as tokens.",
        "The inputs: every token but the last.",
        "The answers: the same text shifted by one. Nobody has to write labels.",
        "Each place guesses the next token. With the mask, one pass checks every guess at once.",
      ]}
      size={[480, 250]}
    >
      {(step) => (
        <>
          {TEXT.map((token, index) => (
            <Chip key={`text-${index}`} x={xAt(index)} y={TEXT_Y} text={token} tone="language" size={14} width={59} opacity={step >= 3 ? 0.35 : 1} />
          ))}

          {TEXT.slice(0, 6).map((token, index) => (
            <Chip
              key={`in-${index}`}
              x={xAt(index)}
              y={step >= 1 ? INPUT_Y : TEXT_Y}
              text={token}
              tone="language"
              size={14}
              width={59}
              opacity={step >= 1 ? 1 : 0}
              delay={stagger(index)}
            />
          ))}
          <Label x={SIDE} y={INPUT_Y} tone="muted" size={14} opacity={step >= 1 ? 1 : 0}>
            inputs
          </Label>

          {TEXT.slice(1).map((token, index) => (
            <Chip
              key={`target-${index}`}
              x={step >= 2 ? xAt(index) : xAt(index + 1)}
              y={step >= 2 ? TARGET_Y : TEXT_Y}
              text={token}
              tone="ink"
              variant="outline"
              size={14}
              width={59}
              opacity={step >= 2 ? 1 : 0}
              delay={stagger(index)}
            />
          ))}
          <Label x={SIDE} y={TARGET_Y} tone="muted" size={14} opacity={step >= 2 ? 1 : 0}>
            answers
          </Label>

          {TEXT.slice(0, 6).map((_, index) => (
            <Arrow
              key={`arrow-${index}`}
              from={[xAt(index), INPUT_Y + 20]}
              to={[xAt(index), TARGET_Y - 21]}
              tone="accent"
              width={1.5}
              drawn={step >= 3}
              delay={stagger(index, 70)}
            />
          ))}
          <Label x={SIDE} y={(INPUT_Y + TARGET_Y) / 2} tone="accent" size={14} weight={700} opacity={step >= 3 ? 1 : 0}>
            guesses
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
