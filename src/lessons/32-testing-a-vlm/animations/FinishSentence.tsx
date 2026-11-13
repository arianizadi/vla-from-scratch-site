"use client";

import { AnimationFrame, Chip, Label, Thing, stagger } from "@/animations";

const PANEL = { x: 16, y: 22, w: 176, h: 90 };
const FLOOR = PANEL.y + PANEL.h - 14;
const ORDER = [
  { kind: "cube" as const, x: 58, word: "red cube", at: 130 },
  { kind: "can" as const, x: 104, word: "green can", at: 250 },
  { kind: "nut" as const, x: 150, word: "blue nut", at: 370 },
];
const MODEL_Y = 158;
const TRUTH_Y = 214;

export function FinishSentence() {
  return (
    <AnimationFrame
      title="Ask what only the picture knows"
      description="The model is shown a scene it has never seen and a caption cut off at from left to right. It finishes the sentence, naming the objects in order. The simulator computes the true order, and the two are compared. Guessing the order of three objects out of four is right about 1 time in 24."
      steps={[
        "A scene the model has never seen.",
        "Cut the caption right where the answer starts.",
        "The model finishes it, one object at a time.",
        "Compare with the true order from the simulator. Guessing is right about 1 time in 24.",
      ]}
      size={[480, 280]}
    >
      {(step) => (
        <>
          <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx={8} className="t-vision a-fill-soft a-stroke" strokeWidth={1.5} />
          <path d={`M${PANEL.x + 10} ${FLOOR}H${PANEL.x + PANEL.w - 10}`} className="t-faint a-stroke" strokeWidth={1.5} />
          {ORDER.map((object) => (
            <Thing key={object.kind} kind={object.kind} x={object.x} y={FLOOR} size={22} tone="vision" />
          ))}
          <Label x={PANEL.x + PANEL.w / 2} y={PANEL.y + PANEL.h + 16} tone="vision" size={13}>
            new scene
          </Label>

          <Chip x={336} y={66} text="… from left to right:" tone="language" size={15} mono={false} opacity={step >= 1 ? 1 : 0} />

          <Label x={20} y={MODEL_Y} tone="muted" size={14} anchor="start" opacity={step >= 2 ? 1 : 0}>
            model
          </Label>
          <Label x={20} y={TRUTH_Y} tone="muted" size={14} anchor="start" opacity={step === 3 ? 1 : 0}>
            truth
          </Label>
          {ORDER.map((object, i) => (
            <g key={object.word}>
              <Chip x={object.at} y={MODEL_Y} text={object.word} tone="language" size={15} mono={false} opacity={step >= 2 ? 1 : 0} delay={step === 2 ? stagger(i, 400) : 0} />
              <Chip x={object.at} y={TRUTH_Y} text={object.word} tone="ink" variant="outline" size={15} mono={false} opacity={step === 3 ? 1 : 0} delay={stagger(i, 120)} />
              <Label x={object.at + 64} y={(MODEL_Y + TRUTH_Y) / 2} tone="success" size={16} weight={700} opacity={step === 3 ? 1 : 0} delay={stagger(i, 120) + 300}>
                ✓
              </Label>
            </g>
          ))}
          <Label x={250} y={258} tone="muted" size={14} opacity={step === 3 ? 1 : 0}>
            by luck: about 1 in 24
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
