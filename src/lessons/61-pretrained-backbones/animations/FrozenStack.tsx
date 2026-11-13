"use client";

import { AnimationFrame, Arrow, Box, Label, Path, type Tone } from "@/animations";

const X = 150;
const W = 220;

/** The borrowed reader, bottom to top, and the step from which each part learns (never: -1). */
const PARTS = [
  { key: "eyes", label: "seeing part", x: X - 56, w: 108, y: 254, h: 34, learnsFrom: -1, reader: true },
  { key: "words", label: "word table", x: X + 56, w: 108, y: 254, h: 34, learnsFrom: -1, reader: true },
  { key: "lower", label: "lower blocks", sub: "reading words and pictures", x: X, w: W, y: 192, h: 62, learnsFrom: -1, reader: true },
  { key: "top", label: "top 4 blocks", x: X, w: W, y: 132, h: 40, learnsFrom: 2, reader: true },
  { key: "mover", label: "mover", sub: "the action head", x: X, w: W, y: 58, h: 48, learnsFrom: 3, reader: false },
];

function toneFor(part: (typeof PARTS)[number], step: number): Tone {
  if (part.learnsFrom >= 0 && step >= part.learnsFrom) return part.reader ? "accent" : "action";
  if (step >= 1 && part.reader) return "faint";
  return part.reader ? "ink" : "action";
}

export function FrozenStack() {
  return (
    <AnimationFrame
      title="Freeze most, train the top"
      description="The borrowed reader has about 2.2 billion adjustable numbers in blocks stacked on its seeing part and its word table. All of them are frozen, so training will not change them. Then the top 4 blocks are unfrozen and trained together with the mover: about 306 million numbers learn, the rest stay as they were."
      steps={[
        "The borrowed reader: about 2.2 billion adjustable numbers.",
        "Freeze it all: training will not change these numbers.",
        "Unfreeze only the top 4 blocks.",
        "Train them with the mover. About 306 million numbers learn.",
      ]}
      size={[480, 290]}
    >
      {(step) => (
        <>
          {PARTS.map((part) => {
            const learns = part.learnsFrom >= 0 && step >= part.learnsFrom;
            return (
              <Box
                key={part.key}
                x={part.x}
                y={part.y}
                w={part.w}
                h={part.h}
                label={part.label}
                sub={part.sub}
                tone={toneFor(part, step)}
                filled={learns}
                active={learns && step === part.learnsFrom}
                opacity={part.reader ? (step >= 1 && !learns ? 0.7 : 1) : step >= 3 ? 1 : 0}
              />
            );
          })}
          <Arrow from={[X, 112]} to={[X, 84]} tone="action" width={2} drawn={step >= 3} />

          <Path d={`M${X + W / 2 + 14} 164V270`} tone="faint" width={2} drawn={step >= 1} />
          <Label x={X + W / 2 + 24} y={216} tone="muted" size={14} anchor="start" opacity={step >= 1 ? 1 : 0}>
            frozen
          </Label>
          <Path d={`M${X + W / 2 + 14} 34V152`} tone="accent" width={2} drawn={step >= 2} />
          <Label x={X + W / 2 + 24} y={132} tone="accent" size={14} weight={700} anchor="start" opacity={step >= 2 ? 1 : 0}>
            learns
          </Label>

          <Label x={414} y={210} tone="ink" size={30} weight={700}>
            2.2B
          </Label>
          <Label x={414} y={238} tone="muted" size={14}>
            numbers in all
          </Label>
          <Label x={414} y={72} tone="accent" size={30} weight={700} opacity={step >= 3 ? 1 : 0}>
            306M
          </Label>
          <Label x={414} y={100} tone="muted" size={14} opacity={step >= 3 ? 1 : 0}>
            numbers learn
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
