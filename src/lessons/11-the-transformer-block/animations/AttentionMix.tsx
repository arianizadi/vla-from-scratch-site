"use client";

import { AnimationFrame, Bar, Chip, Label, stagger } from "@/animations";

/** The chapter's worked example: invented scores of cube's query against each key, and the softmax weights. */
const TOKENS = [
  { text: "pick", score: "0.5", weight: 0.117, share: "0.12" },
  { text: "up", score: "0.1", weight: 0.078, share: "0.08" },
  { text: "the", score: "0.2", weight: 0.087, share: "0.09" },
  { text: "red", score: "2.0", weight: 0.525, share: "0.52" },
  { text: "cube", score: "1.0", weight: 0.193, share: "0.19" },
];
const READER = 4;
const RED = 3;

const X0 = 108;
const SLOT = 80;
const xAt = (index: number) => X0 + index * SLOT;
const TOKEN_Y = 50;
const SCORE_Y = 92;
const BASE_Y = 202;
const BAR_MAX = 74;

const MIX_LEFT = 80;
const MIX_W = 376;
const MIX_Y = 246;
/** Left edge of each token's share of the mix. */
const MIX_START = TOKENS.reduce<number[]>((starts, _, index) => {
  starts.push(index === 0 ? MIX_LEFT : starts[index - 1] + TOKENS[index - 1].weight * MIX_W);
  return starts;
}, []);

export function AttentionMix() {
  return (
    <AnimationFrame
      title="Who cube listens to"
      description="In pick up the red cube, the question cube asks is matched against the label of every word, giving the made-up scores 0.5, 0.1, 0.2, 2.0 and 1.0. The scores become shares that add up to 1: about 0.12, 0.08, 0.09, 0.52 and 0.19. cube then takes in a mix of what the words offer, about half of it from red."
      steps={[
        "cube asks a question. Every word, cube included, holds up a label.",
        "Each label gets a match score (made-up numbers).",
        "The scores become shares that add up to 1. A big score wins a big share.",
        "cube takes in a mix of what the words offer: about half of it from red.",
      ]}
      size={[480, 270]}
    >
      {(step) => (
        <>
          <Label x={xAt(READER)} y={18} tone="accent" size={14} weight={700}>
            asks
          </Label>
          {TOKENS.map((token, index) => (
            <Chip
              key={token.text}
              x={xAt(index)}
              y={TOKEN_Y}
              text={token.text}
              tone="language"
              size={15}
              width={64}
              active={index === READER || (step >= 3 && index === RED)}
            />
          ))}

          <Label x={14} y={SCORE_Y} tone="faint" size={13} anchor="start" opacity={step >= 1 ? 1 : 0}>
            match
          </Label>
          {TOKENS.map((token, index) => (
            <g key={`score-${token.text}`}>
              <Label x={xAt(index)} y={SCORE_Y} tone="faint" size={13} opacity={step === 0 ? 1 : 0}>
                label
              </Label>
              <Label x={xAt(index)} y={SCORE_Y} tone="ink" size={15} mono opacity={step >= 1 ? 1 : 0} delay={stagger(index, 70)}>
                {token.score}
              </Label>
            </g>
          ))}

          <Label x={14} y={BASE_Y - 30} tone="faint" size={13} anchor="start" opacity={step >= 2 ? 1 : 0}>
            share
          </Label>
          <path d={`M${xAt(0) - 32} ${BASE_Y}H${xAt(4) + 32}`} className="a-t t-faint a-stroke" strokeWidth={1.5} style={{ opacity: step >= 2 ? 1 : 0 }} />
          {TOKENS.map((token, index) => (
            <Bar
              key={`bar-${token.text}`}
              x={xAt(index)}
              y={BASE_Y}
              height={BAR_MAX}
              value={step >= 2 ? token.weight / 0.525 : 0}
              width={30}
              tone={index === RED && step >= 3 ? "mark" : "accent"}
              label={step >= 2 ? token.share : undefined}
              opacity={step >= 2 ? 1 : 0}
              delay={stagger(index, 70)}
            />
          ))}

          <Label x={14} y={MIX_Y} tone="faint" size={13} anchor="start" opacity={step >= 3 ? 1 : 0}>
            takes
          </Label>
          {TOKENS.map((token, index) => (
            <rect
              key={`mix-${token.text}`}
              x={MIX_START[index] + 1}
              y={MIX_Y - 10}
              width={token.weight * MIX_W - 2}
              height={20}
              rx={3}
              className={`a-t ${index === RED ? "t-mark" : "t-language"} a-fill`}
              style={{ opacity: step >= 3 ? (index === RED ? 1 : 0.45) : 0, fillOpacity: index === RED ? 0.55 : 1, transitionDelay: `${stagger(index, 70)}ms` }}
            />
          ))}
          <Label x={MIX_START[RED] + (TOKENS[RED].weight * MIX_W) / 2} y={MIX_Y} tone="ink" size={14} weight={700} opacity={step >= 3 ? 1 : 0} delay={400}>
            red
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
