"use client";

import { AnimationFrame, Bracket, Chip, Label, stagger } from "@/animations";

const SLOT = 62;
const X0 = 54;
const xAt = (slot: number) => X0 + slot * SLOT;
const ROW_TRAIN = 92;
const ROW_SERVE = 196;

interface Token {
  key: string;
  text: string;
  tone: "language" | "action" | "faint";
  /** Slot of the token in each step, per row; undefined hides it. */
  train: (number | undefined)[];
  serve: (number | undefined)[];
}

/** Conditioning C1 to C3, then action-step tokens A1 and A2; two padding slots appear in a padded batch. */
const TOKENS: Token[] = [
  { key: "c1", text: "pick", tone: "language", train: [0, 0, 0], serve: [undefined, 0, 0] },
  { key: "c2", text: "red", tone: "language", train: [1, 1, 1], serve: [undefined, 1, 1] },
  { key: "c3", text: "cube", tone: "language", train: [2, 2, 2], serve: [undefined, 2, 2] },
  { key: "p1", text: "pad", tone: "faint", train: [undefined, 3, 3], serve: [undefined, undefined, 3] },
  { key: "p2", text: "pad", tone: "faint", train: [undefined, 4, 4], serve: [undefined, undefined, 4] },
  { key: "a1", text: "A1", tone: "action", train: [3, 5, 5], serve: [undefined, 3, 5] },
  { key: "a2", text: "A2", tone: "action", train: [4, 6, 6], serve: [undefined, 4, 6] },
];

function Row({ step, row, y }: { step: number; row: "train" | "serve"; y: number }) {
  return (
    <>
      {TOKENS.map((token, index) => {
        const slot = token[row][step];
        const last = token[row].reduce<number>((found, value) => value ?? found, 0);
        return (
          <Chip
            key={`${row}-${token.key}`}
            x={xAt(slot ?? last)}
            y={y}
            text={token.text}
            tone={token.tone}
            variant={token.tone === "faint" ? "outline" : "soft"}
            size={15}
            width={56}
            opacity={slot === undefined ? 0 : 1}
            scale={slot === undefined ? 0.7 : 1}
            delay={stagger(index, 40)}
          />
        );
      })}
    </>
  );
}

export function OffsetGap() {
  return (
    <AnimationFrame
      title="Same seats, same gaps"
      description="The words pick, red and cube are followed by the robot's action steps A1 and A2, so A1 sits 1 place after cube. In training, two blank pads sit between them and the gap becomes 3, while the same prompt used alone gives a gap of 1. The fix gives every prompt the same number of seats, so training and use put every word in the same place."
      steps={[
        "Words, then the robot's action steps (orange). A1 sits 1 place after cube.",
        "In training, blank pads sit in between: 3 places apart. Used alone, the same prompt gives 1.",
        "The fix: every prompt gets the same number of seats. Training and use now line up.",
      ]}
      size={[480, 260]}
    >
      {(step) => (
        <>
          <Label x={22} y={ROW_TRAIN - 52} tone="faint" size={13} anchor="start" opacity={step === 0 ? 1 : 0}>
            one prompt
          </Label>
          <Label x={22} y={ROW_TRAIN - 52} tone="faint" size={13} anchor="start" opacity={step >= 1 ? 1 : 0}>
            in training
          </Label>
          <Label x={22} y={ROW_SERVE - 52} tone="faint" size={13} anchor="start" opacity={step >= 1 ? 1 : 0}>
            in use, one prompt alone
          </Label>

          <Bracket x1={xAt(2)} x2={xAt(3)} y={ROW_TRAIN - 28} label="gap 1" tone="ink" opacity={step === 0 ? 1 : 0} />
          <Bracket x1={xAt(2)} x2={xAt(5)} y={ROW_TRAIN - 28} label="gap 3" tone={step === 1 ? "failure" : "ink"} opacity={step >= 1 ? 1 : 0} />
          <Bracket x1={xAt(2)} x2={xAt(3)} y={ROW_SERVE - 28} label="gap 1" tone="failure" opacity={step === 1 ? 1 : 0} />
          <Bracket x1={xAt(2)} x2={xAt(5)} y={ROW_SERVE - 28} label="gap 3" tone="ink" opacity={step === 2 ? 1 : 0} />

          <Row step={step} row="train" y={ROW_TRAIN} />
          <Row step={step} row="serve" y={ROW_SERVE} />

          <Label x={240} y={244} tone="accent" size={14} weight={700} opacity={step === 2 ? 1 : 0}>
            same seats, same gaps
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
