"use client";

import { AnimationFrame, Dot, Label, Path, stagger } from "@/animations";

const START: [number, number] = [64, 150];
const OBJECTS = [
  { name: "cube", at: [392, 56] as [number, number], named: true },
  { name: "can", at: [404, 126] as [number, number], named: false },
  { name: "nut", at: [384, 194] as [number, number], named: false },
];
const TARGET = OBJECTS[0].at;
const DOTS = 12;
const along = (i: number): [number, number] => {
  const t = i / DOTS;
  return [Math.round(START[0] + (TARGET[0] - 30 - START[0]) * t), Math.round(START[1] + (TARGET[1] + 8 - START[1]) * t)];
};
const POINTS = Array.from({ length: DOTS }, (_, i) => along(i));

/** One demonstration is about 66 moments (frames); one of them chooses the object. */
const MOMENTS = 66;
const CELL = 5;
const STRIP_X = 24;
const STRIP_Y = 268;

export function EasyMoments() {
  return (
    <AnimationFrame
      title="Most moments are easy"
      description="A demonstration seen from above: the arm's path from its start to the named cube, one dot per moment. Once the arm is moving, each next move is almost the previous one again. Only the first moment needs the camera and the instruction, to choose between the cube, the can and the nut. Of about 66 moments in a demonstration, that is one."
      steps={[
        "A demonstration from above: one dot per moment, from the start to the named cube.",
        "Once moving, each next move is almost the last one again. Easy to guess.",
        "Only the first moment needs the camera and the instruction: which object?",
        "The loss averages every moment. The deciding one is about 1 in 66.",
      ]}
      size={[480, 290]}
    >
      {(step) => (
        <>
          {OBJECTS.map((object) => (
            <g key={object.name}>
              <Dot x={object.at[0]} y={object.at[1]} r={17} tone={object.named ? "action" : "muted"} hollow />
              <Label x={object.at[0] + 26} y={object.at[1]} tone={object.named ? "action" : "muted"} size={14} weight={object.named ? 700 : 400} anchor="start">
                {object.name}
              </Label>
              {object.named ? null : (
                <Path d={`M${START[0]} ${START[1]}L${object.at[0] - 26} ${object.at[1]}`} tone="faint" width={2} dashed drawn={step === 2} />
              )}
            </g>
          ))}

          {POINTS.map(([x, y], i) => (
            <Dot
              key={i}
              x={x}
              y={y}
              r={i === 0 ? 8 : 5}
              tone={i === 0 ? (step >= 2 ? "mark" : "ink") : step === 1 ? "accent" : "ink"}
              opacity={i === 0 ? 1 : step === 2 ? 0.35 : 1}
              delay={stagger(i, 40)}
            />
          ))}
          <Label x={along(6)[0] + 24} y={along(6)[1] + 54} tone="accent" size={14} weight={700} anchor="middle" opacity={step === 1 ? 1 : 0}>
            same as the last move
          </Label>
          <Label x={START[0]} y={START[1] + 30} tone="ink" size={14} weight={700} opacity={step >= 2 ? 1 : 0}>
            which one?
          </Label>
          <Label x={START[0]} y={START[1] - 26} tone="muted" size={14} opacity={step < 2 ? 1 : 0}>
            start
          </Label>

          {Array.from({ length: MOMENTS }, (_, i) => (
            <rect
              key={`m-${i}`}
              className={`a-t ${i === 0 ? "t-mark" : "t-ink"} a-fill`}
              x={STRIP_X + i * (CELL + 1.5)}
              y={STRIP_Y - 9}
              width={CELL}
              height={18}
              rx={1.5}
              style={{ opacity: step >= 3 ? (i === 0 ? 1 : 0.3) : 0, transitionDelay: `${step >= 3 ? Math.round(i * 8) : 0}ms` }}
            />
          ))}
          <Label x={466} y={STRIP_Y - 28} tone="ink" size={14} weight={700} anchor="end" opacity={step >= 3 ? 1 : 0}>
            1 deciding moment of 66
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
