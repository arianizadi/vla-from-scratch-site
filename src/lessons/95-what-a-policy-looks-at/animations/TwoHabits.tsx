"use client";

import { AnimationFrame, Arm, Dot, Label, Thing, reach, stagger } from "@/animations";

const TABLE = 206;
const LENGTHS: [number, number] = [96, 86];
const PANELS = [
  { name: "looks every time", x0: 0, every: true },
  { name: "looks once", x0: 244, every: false },
];
/** How many of the six planning moments have passed in each step. */
const PROGRESS = [1, 3, 5, 6, 6];

export function TwoHabits() {
  return (
    <AnimationFrame
      title="Same score, different habits"
      description="Two policies reach for the same cube, grasp it and lift it: the same success. Underneath, one checks its cameras before every new plan of moves, six times here; the other looks once at the start and then carries on. On a table where nothing moves, the score cannot tell them apart."
      steps={[
        "Two policies. Same table, same cube.",
        "Both reach for the cube.",
        "Both grasp it.",
        "Both lift it. Same success, same score.",
        "Yet one checked its cameras before every move. The other looked once, at the start.",
      ]}
      size={[480, 290]}
    >
      {(step) => (
        <>
          {PANELS.map((panel) => {
            const base: [number, number] = [panel.x0 + 46, TABLE];
            const cubeX = panel.x0 + 170;
            const lifted = step >= 3;
            const cubeY = lifted ? TABLE - 46 : TABLE;
            const pose =
              step === 0
                ? reach(base, [panel.x0 + 120, 92], LENGTHS)
                : step === 1
                  ? reach(base, [cubeX, TABLE - 52], LENGTHS)
                  : step === 2
                    ? reach(base, [cubeX, TABLE - 6], LENGTHS)
                    : reach(base, [cubeX, TABLE - 52], LENGTHS);
            const looks = panel.every ? PROGRESS[step] : 1;
            return (
              <g key={panel.name}>
                <Label x={panel.x0 + 118} y={22} tone="ink" size={15} weight={700} opacity={step >= 4 ? 1 : 0.35}>
                  {panel.name}
                </Label>
                <line x1={panel.x0 + 12} y1={TABLE} x2={panel.x0 + 226} y2={TABLE} className="t-faint a-stroke" strokeWidth={2} />
                <Thing kind="cube" x={cubeX} y={cubeY} tone="action" size={26} />
                <Arm base={base} lengths={LENGTHS} angles={pose} open={step >= 2 ? 0.25 : 1} tone="ink" />
                {Array.from({ length: 6 }, (_, i) => (
                  <Dot
                    key={i}
                    x={panel.x0 + 48 + i * 28}
                    y={244}
                    r={7}
                    tone={i < looks ? "vision" : "faint"}
                    hollow={i >= looks}
                    delay={stagger(i, 60)}
                  />
                ))}
                <Label x={panel.x0 + 118} y={270} tone="muted" size={13}>
                  camera checks
                </Label>
              </g>
            );
          })}
          <line x1={240} y1={36} x2={240} y2={276} className="t-faint a-stroke" strokeWidth={1} strokeDasharray="3 5" />
        </>
      )}
    </AnimationFrame>
  );
}
