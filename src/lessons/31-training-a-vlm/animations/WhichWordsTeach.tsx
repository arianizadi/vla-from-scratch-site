"use client";

import { AnimationFrame, Arrow, Chip, Label, Thing, stagger } from "@/animations";

const PANEL = { x: 16, y: 140, w: 176, h: 88 };
const FLOOR = PANEL.y + PANEL.h - 14;
const OBJECTS = [
  { kind: "cube" as const, x: 58, word: "red cube", wy: 160 },
  { kind: "can" as const, x: 104, word: "green can", wy: 204 },
  { kind: "nut" as const, x: 150, word: "blue nut", wy: 248 },
];

export function WhichWordsTeach() {
  return (
    <AnimationFrame
      title="Only some words need the picture"
      description="A caption for one scene reads: robot arm over a table, from left to right: a red cube, a green can and a blue nut. The opening words are the same for every scene, so the model can guess them without looking. Which object comes next is written only in the picture, so those few words are the ones that teach the model to see."
      steps={[
        "A caption written for one scene.",
        "The opening words never change: guessable without looking.",
        "Which object comes next is written only in the picture.",
        "Those few words are what teach the model to see.",
      ]}
      size={[480, 290]}
    >
      {(step) => {
        const blind = step >= 1;
        return (
          <>
            <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx={8} className="t-vision a-fill-soft a-stroke" strokeWidth={1.5} />
            <path d={`M${PANEL.x + 10} ${FLOOR}H${PANEL.x + PANEL.w - 10}`} className="t-faint a-stroke" strokeWidth={1.5} />
            {OBJECTS.map((object) => (
              <Thing key={object.kind} kind={object.kind} x={object.x} y={FLOOR} size={22} tone={step >= 2 ? "vision" : "muted"} />
            ))}
            <Label x={PANEL.x + PANEL.w / 2} y={PANEL.y - 16} tone="vision" size={13}>
              the picture
            </Label>

            <Chip x={340} y={30} text="robot arm over a table." tone={blind ? "faint" : "language"} size={15} mono={false} />
            <Chip x={340} y={76} text="from left to right:" tone={blind ? "faint" : "language"} size={15} mono={false} />
            <Label x={340} y={110} tone="muted" size={14} opacity={blind ? 1 : 0}>
              same every time
            </Label>

            {OBJECTS.map((object, i) => (
              <g key={object.word}>
                <Arrow from={[object.x + 8, FLOOR - 32]} to={[282, object.wy]} bend={-12 + i * 4} tone="vision" width={1.5} drawn={step >= 2} opacity={step >= 2 ? 1 : 0} delay={stagger(i, 120)} />
                <Chip x={340} y={object.wy} text={object.word} tone="language" size={15} mono={false} active={step >= 2} delay={stagger(i, 120)} />
              </g>
            ))}
            <Label x={110} y={256} tone="vision" size={14} weight={700} opacity={step === 3 ? 1 : 0}>
              these teach seeing →
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
