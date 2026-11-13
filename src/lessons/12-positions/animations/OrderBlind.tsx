"use client";

import { AnimationFrame, Chip, Label, stagger } from "@/animations";

/** The chapter's two instructions: the same six words in a different order. */
const A = ["red", "cube", "left", "of", "green", "can"];
const B = ["green", "can", "left", "of", "red", "cube"];
/** The same words as one set, in a fixed order that belongs to neither sentence. */
const SET = ["can", "cube", "green", "left", "of", "red"];

const SLOT = 74;
const X0 = 55;
const xAt = (index: number) => X0 + index * SLOT;
const ROW_A = 52;
const ROW_B = 140;
const ROW_SET = 222;

export function OrderBlind() {
  return (
    <AnimationFrame
      title="A bag of words"
      description="Two instructions, red cube left of green can and green can left of red cube, use the same six words in a different order. Attention compares words by what they are, so without position information it receives the same bag of words from both. Giving each word its place number makes the two differ again."
      steps={[
        "Two instructions: the same six words in a different order.",
        "Attention compares words by what they are. Without positions, both become the same bag of words.",
        "Give each word its place number, counting from 0, and the two differ again.",
      ]}
      still={1}
      size={[480, 260]}
    >
      {(step) => {
        const merged = step === 1;
        return (
          <>
            <Label x={22} y={ROW_A - 32} tone="faint" size={13} anchor="start" opacity={merged ? 0 : 1}>
              instruction 1
            </Label>
            <Label x={22} y={ROW_B - 32} tone="faint" size={13} anchor="start" opacity={merged ? 0 : 1}>
              instruction 2
            </Label>
            <Label x={240} y={ROW_SET - 34} tone="ink" size={14} weight={700} opacity={merged ? 1 : 0}>
              what attention receives from either one
            </Label>

            {A.map((word, index) => (
              <Chip
                key={`a-${word}`}
                x={merged ? xAt(SET.indexOf(word)) : xAt(index)}
                y={merged ? ROW_SET : ROW_A}
                text={word}
                tone="language"
                size={15}
                width={64}
                delay={stagger(index, 60)}
              />
            ))}
            {B.map((word, index) => (
              <Chip
                key={`b-${word}`}
                x={merged ? xAt(SET.indexOf(word)) : xAt(index)}
                y={merged ? ROW_SET : ROW_B}
                text={word}
                tone="language"
                size={15}
                width={64}
                delay={stagger(index, 60) + 120}
              />
            ))}

            {A.map((_, index) => (
              <g key={`pos-${index}`}>
                <Label x={xAt(index)} y={ROW_A + 30} tone="accent" size={14} mono weight={700} opacity={step === 2 ? 1 : 0} delay={stagger(index, 60)}>
                  {String(index)}
                </Label>
                <Label x={xAt(index)} y={ROW_B + 30} tone="accent" size={14} mono weight={700} opacity={step === 2 ? 1 : 0} delay={stagger(index, 60)}>
                  {String(index)}
                </Label>
              </g>
            ))}
            <Label x={240} y={ROW_SET} tone="muted" size={14} opacity={step === 2 ? 1 : 0}>
              red is at 0 in one, at 4 in the other
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
