"use client";

import { AnimationFrame, Chip, Label, Thing, stagger } from "@/animations";

const PANEL = { x: 16, y: 28, w: 150, h: 84 };
const FLOOR = PANEL.y + PANEL.h - 14;
const TEMPLATE = [
  { text: "robot arm over a table.", y: 42, words: 5 },
  { text: "from left to right:", y: 92, words: 4 },
];
const ANSWERS = [
  { text: "red cube", x: 120 },
  { text: "green can", x: 240 },
  { text: "blue nut", x: 360 },
];
/** 9 opening words guessed right, 3 object words wrong (one per answer chip shown, a toy count). */
const SQUARES = Array.from({ length: 12 }, (_, i) => i < 9);

export function BlindGuess() {
  return (
    <AnimationFrame
      title="A good score with eyes shut"
      description="With the picture covered, a model can still guess the opening words of a caption, because they are the same every time. Only the object names need the picture, and blind, it gets them wrong. Since most words were right, its training score looks fine even though it never looked."
      steps={[
        "Cover the picture and read a caption.",
        "The opening words are easy to guess anyway: they never change.",
        "The object names need the picture. Blind, they come out wrong.",
        "Most words were right, so the score looks fine. It never looked.",
      ]}
      size={[480, 290]}
    >
      {(step) => (
        <>
          <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx={8} className="t-vision a-fill-soft a-stroke" strokeWidth={1.5} />
          <Thing kind="cube" x={52} y={FLOOR} size={20} tone="vision" />
          <Thing kind="can" x={92} y={FLOOR} size={20} tone="vision" />
          <Thing kind="nut" x={132} y={FLOOR} size={20} tone="vision" />
          <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx={8} className="t-faint a-stroke" strokeWidth={1.5} style={{ fill: "var(--surface-2)" }} />
          <Label x={PANEL.x + PANEL.w / 2} y={PANEL.y + PANEL.h / 2} tone="muted" size={14} weight={700}>
            picture covered
          </Label>

          {TEMPLATE.map((chip, i) => (
            <g key={chip.text}>
              <Chip x={318} y={chip.y} text={chip.text} tone="language" size={15} mono={false} />
              <Label x={452} y={chip.y} tone="success" size={18} weight={700} opacity={step >= 1 ? 1 : 0} delay={stagger(i, 150)}>
                ✓
              </Label>
            </g>
          ))}
          {ANSWERS.map((answer, i) => (
            <g key={answer.text}>
              <Chip x={answer.x} y={150} text={answer.text} tone={step >= 2 ? "faint" : "language"} size={15} mono={false} variant={step >= 2 ? "outline" : "soft"} />
              <Label x={answer.x} y={182} tone="failure" size={14} weight={700} opacity={step >= 2 ? 1 : 0} delay={stagger(i, 150)}>
                ✗ a guess
              </Label>
            </g>
          ))}

          {SQUARES.map((right, i) => (
            <rect
              key={i}
              x={120 + i * 20}
              y={222}
              width={16}
              height={16}
              rx={3}
              className={`a-t ${right ? "t-success" : "t-failure"} a-fill`}
              style={{ opacity: step === 3 ? 1 : 0, transitionDelay: step === 3 ? `${i * 40}ms` : undefined }}
            />
          ))}
          <Label x={240} y={260} tone="ink" size={14} weight={700} opacity={step === 3 ? 1 : 0}>
            most words right: the score looks fine
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
