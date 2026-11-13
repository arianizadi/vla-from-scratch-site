"use client";

import { AnimationFrame, Arrow, Chip, Label, stagger } from "@/animations";

/** The tokens and ids of the instruction, from the tokenizer used here (the full chapter lists them). */
const TOKENS = [
  { text: "pick", id: "18188" },
  { text: "␣up", id: "614" },
  { text: "␣the", id: "260" },
  { text: "␣red", id: "2382" },
  { text: "␣cube", id: "20636" },
];

const SENTENCE = "pick up the red cube";
const SIZE = 16;
const CHAR = SIZE * 0.6;

/** Centre of each token inside the whole sentence, so the pieces start where they were. */
const inSentence = (() => {
  const left = 240 - (SENTENCE.length * CHAR) / 2;
  let offset = 0;
  return TOKENS.map((token) => {
    const centre = left + (offset + token.text.length / 2) * CHAR;
    offset += token.text.length;
    return centre;
  });
})();

/** Spread out, with gaps between the chips. */
const spread = (() => {
  const widths = TOKENS.map((token) => token.text.length * CHAR + SIZE * 1.2);
  const gap = 14;
  const total = widths.reduce((sum, width) => sum + width, 0) + gap * (widths.length - 1);
  let x = 240 - total / 2;
  return widths.map((width) => {
    const centre = x + width / 2;
    x += width + gap;
    return centre;
  });
})();

export function SplitIntoTokens() {
  return (
    <AnimationFrame
      title="From a string to ids"
      description="The instruction pick up the red cube is one string. The tokenizer cuts it into five tokens, each space kept at the front of the word after it, and replaces each token with its id: 18188, 614, 260, 2382 and 20636. The model receives only those five numbers."
      steps={[
        "An instruction is one string of characters.",
        "The tokenizer cuts it into tokens. A space stays at the front of the next word (shown as ␣).",
        "Each token becomes its id: its number in a fixed list.",
        "The model never sees the letters, only these numbers.",
      ]}
      size={[480, 260]}
    >
      {(step) => (
        <>
          <Chip x={240} y={70} text={SENTENCE} tone="ink" variant="outline" size={SIZE} opacity={step === 0 ? 1 : 0} />
          <Label x={240} y={26} tone="faint" opacity={step === 0 ? 1 : 0}>
            text
          </Label>
          <Label x={240} y={26} tone="language" opacity={step >= 1 ? 1 : 0}>
            tokens
          </Label>

          {TOKENS.map((token, index) => (
            <Chip
              key={token.text}
              x={step === 0 ? inSentence[index] : spread[index]}
              y={70}
              text={token.text}
              tone="language"
              size={SIZE}
              width={token.text.length * CHAR + SIZE * 1.2}
              opacity={step === 0 ? 0 : step === 3 ? 0.35 : 1}
              delay={stagger(index, 60)}
            />
          ))}

          {TOKENS.map((token, index) => (
            <Arrow
              key={`arrow-${token.text}`}
              from={[spread[index], 96]}
              to={[spread[index], 128]}
              tone="faint"
              width={1.5}
              drawn={step === 2}
              opacity={step === 2 ? 1 : 0}
              delay={stagger(index, 80)}
            />
          ))}

          {TOKENS.map((token, index) => (
            <Chip
              key={`id-${token.text}`}
              x={spread[index]}
              y={step >= 3 ? 196 : 150}
              text={token.id}
              tone="ink"
              variant="outline"
              size={15}
              opacity={step >= 2 ? 1 : 0}
              delay={stagger(index, 80) + (step === 2 ? 250 : 0)}
            />
          ))}
          <Label x={240} y={240} tone="muted" opacity={step >= 3 ? 1 : 0}>
            what the model receives
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
