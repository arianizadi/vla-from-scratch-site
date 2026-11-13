"use client";

import { Arrow, AnimationFrame, Dot, Label } from "@/animations";

/** Seen from above: the arm starts on the left; three objects on the right; the reach is a straight line. */
const START: [number, number] = [60, 150];
const OBJECTS: [number, number][] = [
  [400, 66],
  [410, 150],
  [392, 232],
];
const TARGET = 1;
const STEPS = 7;
const r = (value: number) => Math.round(value * 10) / 10;
const PATH = Array.from({ length: STEPS + 1 }, (_, i) => {
  const t = i / STEPS;
  const [tx, ty] = OBJECTS[TARGET];
  return [r(START[0] + (tx - 28 - START[0]) * t), r(START[1] + (ty - START[1]) * t)] as [number, number];
});

export function KeepGoing() {
  return (
    <AnimationFrame
      title="The easy answer: keep going"
      description="Seen from above, the expert's reach is a straight line of steps from the start toward the named object. Guessing each next step as the last step again lands exactly on the path, with no camera. Only the first step has no last step to copy: from rest, the reach could head for any of the three objects, and only the cameras can say which."
      steps={[
        "The expert's reach from above: a straight line, one step at a time.",
        "Guess each next step as “the last step again”. It lands right on the path.",
        "Every one of those guesses works without the camera.",
        "Except the first: from rest there is no last step. Only the cameras can say which object.",
      ]}
      size={[480, 290]}
    >
      {(step) => (
        <>
          {OBJECTS.map(([x, y], i) => (
            <rect key={i} x={x - 14} y={y - 14} width={28} height={28} rx={i === 1 ? 14 : 4} className={`${i === TARGET ? "t-action" : "t-muted"} a-fill-soft a-stroke`} strokeWidth={2} />
          ))}
          <Label x={OBJECTS[TARGET][0]} y={OBJECTS[TARGET][1] + 30} tone="action" size={13} weight={700}>
            named
          </Label>

          {PATH.map(([x, y], i) => (
            <Dot key={i} x={x} y={y} r={i === 0 ? 7 : 5} tone={i === 0 ? "ink" : "action"} delay={i * 60} />
          ))}
          <Label x={START[0]} y={START[1] + 26} tone="ink" size={13}>
            start
          </Label>

          {PATH.slice(1, -1).map(([x, y], i) => {
            const [nx, ny] = PATH[i + 2];
            return (
              <Arrow
                key={i}
                from={[x, y - 16]}
                to={[nx - 4, ny - 16]}
                tone="accent"
                width={2}
                drawn={step >= 1}
                opacity={step >= 1 ? 1 : 0}
                delay={i * 120}
              />
            );
          })}
          <Label x={PATH[3][0]} y={PATH[3][1] - 38} tone="accent" size={14} weight={700} opacity={step >= 1 ? 1 : 0}>
            “same as the last”
          </Label>
          <Label x={PATH[3][0]} y={PATH[3][1] + 32} tone="success" size={14} weight={700} opacity={step === 2 ? 1 : 0}>
            no camera needed
          </Label>

          {OBJECTS.map(([, y], i) => (
            <Arrow
              key={`q-${i}`}
              from={[START[0] + 10, START[1] + (y - START[1]) * 0.08]}
              to={[START[0] + 70, START[1] + (y - START[1]) * 0.55]}
              tone="failure"
              dashed
              width={2}
              drawn={step >= 3}
              opacity={step >= 3 ? 1 : 0}
            />
          ))}
          <Label x={START[0] + 6} y={START[1] - 60} tone="failure" size={14} weight={700} opacity={step >= 3 ? 1 : 0}>
            which way?
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
