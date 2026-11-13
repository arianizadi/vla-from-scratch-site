"use client";

import { AnimationFrame, Chip, Dot, Label, Path, stagger } from "@/animations";

const WORDS = ["pick", "up", "the", "red", "cube"];
const SIZE = 16;
const ROW_Y = 176;
const GAP = 14;

const widths = WORDS.map((word) => word.length * SIZE * 0.6 + SIZE * 1.2);
const XS = (() => {
  const total = widths.reduce((sum, width) => sum + width, 0) + GAP * (WORDS.length - 1);
  let x = 240 - total / 2;
  return widths.map((width) => {
    const centre = x + width / 2;
    x += width + GAP;
    return centre;
  });
})();

/** How much "cube" draws from each earlier word: a toy picture, "red" matters most. */
const WEIGHTS = [0.35, 0.2, 0.12, 1];
const FROM = XS[4];
const MEMORY: [number, number] = [240, 70];

function arc(toX: number): string {
  const height = 30 + (FROM - toX) * 0.28;
  return `M${FROM} ${ROW_Y - 20}C${FROM} ${ROW_Y - 20 - height} ${toX} ${ROW_Y - 20 - height} ${toX} ${ROW_Y - 20}`;
}

export function LookAtEveryWord() {
  return (
    <AnimationFrame
      title="One memory, or a look at every word"
      description="Older translators read a sentence one word at a time and squeezed it into one small memory, so details got lost. Attention keeps every word: the word cube looks back at all the others and draws most from red, the word that tells which cube."
      steps={[
        "A sentence, one word at a time.",
        "The old way: squeeze every word into one small memory.",
        "Long sentences lose details in the squeeze.",
        "Attention keeps every word. Each one looks back at all the others…",
        "…and takes the most from the words that matter: “red” says which cube.",
      ]}
      size={[480, 260]}
    >
      {(step) => {
        const squeezed = step === 1 || step === 2;
        return (
          <>
            {WORDS.map((word, index) => (
              <Chip
                key={word}
                x={squeezed ? MEMORY[0] : XS[index]}
                y={squeezed ? MEMORY[1] : ROW_Y}
                text={word}
                tone="language"
                size={SIZE}
                width={widths[index]}
                scale={squeezed ? 0.3 : 1}
                opacity={squeezed ? 0 : index === 4 && step >= 3 ? 1 : step >= 3 ? 0.85 : 1}
                active={index === 4 && step >= 3}
                delay={stagger(index, 90)}
              />
            ))}

            {WORDS.map((word, index) => (
              <Chip
                key={`ghost-${word}`}
                x={XS[index]}
                y={ROW_Y}
                text={word}
                tone="faint"
                variant="outline"
                size={SIZE}
                width={widths[index]}
                opacity={squeezed ? 0.5 : 0}
              />
            ))}
            <Dot x={MEMORY[0]} y={MEMORY[1]} r={squeezed ? 16 : 4} tone="ink" opacity={squeezed ? 1 : 0} delay={300} />
            <Label x={MEMORY[0]} y={MEMORY[1] + 36} tone="muted" size={14} opacity={squeezed ? 1 : 0}>
              one small memory
            </Label>
            <Label x={MEMORY[0]} y={MEMORY[1] + 96} tone="failure" size={15} weight={700} opacity={step === 2 ? 1 : 0}>
              which cube was it? lost
            </Label>

            {WEIGHTS.map((weight, index) => (
              <Path
                key={index}
                d={arc(XS[index])}
                tone="accent"
                width={1.5 + weight * 5}
                drawn={step >= 3}
                opacity={step >= 3 ? (step === 4 ? 0.25 + weight * 0.75 : 0.6) : 0}
                delay={stagger(index, 120)}
              />
            ))}
            <Label x={XS[3]} y={ROW_Y + 40} tone="accent" size={14} weight={700} opacity={step === 4 ? 1 : 0}>
              matters most
            </Label>
            <Label x={240} y={236} tone="muted" size={14} opacity={step === 0 ? 1 : 0}>
              read left to right
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
