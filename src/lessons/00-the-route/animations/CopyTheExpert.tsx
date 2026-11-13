"use client";

import { AnimationFrame, Bracket, Dot, Gripper, Label, Path, Thing } from "@/animations";

const TABLE = 228;
const START: [number, number] = [84, 96];
const CUBE_A = 330;
const CUBE_B = 196;
const END_Y = 190;

function reachPath(endX: number): string {
  return `M${START[0]} ${START[1]}Q${(START[0] + endX) / 2 + 20} ${START[1] - 30} ${endX} ${END_Y}`;
}

const GUESSES = [
  { end: CUBE_A + 74, from: 1, to: 2 },
  { end: CUBE_A + 22, from: 3, to: 3 },
];

export function CopyTheExpert() {
  return (
    <AnimationFrame
      title="Learning from a demonstration"
      description="An expert's reach to a cube is recorded. The model guesses a reach from the same picture and misses to the right. The gap between the two is the error, and training nudges the model so the next guess lands closer. After thousands of demonstrations, its reach matches the expert's in a scene it never saw."
      steps={[
        "An expert reaches for the cube. We record what it saw and did.",
        "The model guesses a move from the same picture.",
        "Measure the gap between the guess and the expert's move.",
        "Nudge the model so its guess lands closer.",
        "Thousands of demonstrations later, it gets new scenes right too.",
      ]}
      hold={[2200, 2200, 2200, 2400, 3400]}
      size={[480, 280]}
    >
      {(step) => {
        const sceneB = step >= 4;
        const cube = sceneB ? CUBE_B : CUBE_A;
        const gapEnd = step >= 3 ? GUESSES[1].end : GUESSES[0].end;
        return (
          <>
            <Path d={`M20 ${TABLE}H460`} tone="faint" width={2} />
            <Thing kind="cube" x={cube} y={TABLE} tone="action" size={30} active />
            <Gripper x={START[0]} y={START[1] - 42} open={1} tone="ink" />

            <Path d={reachPath(CUBE_A)} tone="action" dashed drawn={!sceneB} />
            <Dot x={CUBE_A} y={END_Y} r={5} tone="action" opacity={sceneB ? 0 : 1} />
            <Label x={CUBE_A - 8} y={58} tone="action" size={14} weight={700} anchor="end" opacity={sceneB ? 0 : 1}>
              {"expert's move"}
            </Label>

            {GUESSES.map((guess, index) => (
              <Path
                key={index}
                d={reachPath(guess.end)}
                tone="accent"
                width={2.5}
                drawn={step >= guess.from && step <= guess.to}
                opacity={step >= guess.from && step <= guess.to ? 1 : 0}
              />
            ))}
            <Dot x={gapEnd} y={END_Y} r={5} tone="accent" opacity={step >= 1 && !sceneB ? 1 : 0} />
            <Label x={gapEnd + 6} y={END_Y - 26} tone="accent" size={14} weight={700} anchor="middle" opacity={step >= 1 && !sceneB ? 1 : 0}>
              guess
            </Label>

            <Bracket x1={CUBE_A} x2={gapEnd} y={TABLE + 18} label="error" below tone="ink" opacity={step >= 2 && !sceneB ? 1 : 0} />

            <Path d={reachPath(CUBE_B)} tone="action" dashed drawn={sceneB} />
            <Path d={reachPath(CUBE_B)} tone="accent" width={2.5} drawn={sceneB} delay={300} />
            <Dot x={CUBE_B} y={END_Y} r={5} tone="accent" opacity={sceneB ? 1 : 0} delay={700} />
            <Label x={CUBE_B + 120} y={TABLE + 26} tone="success" size={14} weight={700} opacity={sceneB ? 1 : 0} delay={700}>
              new scene: guess = expert
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
