"use client";

import { AnimationFrame, Arm, Arrow, Box, Cells, Chip, Label, Move, Path, Thing, reach, stagger } from "@/animations";

/** The whole course in one loop: words and pixels in, an action out, the named object in the gripper. */

const TOKENS = ["pick", "␣up", "␣the", "␣red", "␣cube"];
const PATCHES = [
  [0.2, 0.5, 0.3],
  [0.7, 0.9, 0.4],
  [0.3, 0.6, 0.2],
];
const ACTIONS = [0.8, 0.4, 0.9, 0.3, 0.6, 0.5, 0.7, 1];

const TABLE = 362;
const BASE: [number, number] = [396, TABLE];
const LENGTHS: [number, number] = [132, 124];
const CUBE_X = 548;
const LIFT = 70;

const HOME = reach(BASE, [470, 214], LENGTHS);
const ABOVE = reach(BASE, [CUBE_X, 300], LENGTHS);
const GRASP = reach(BASE, [CUBE_X, TABLE - 6], LENGTHS);
const LIFTED = reach(BASE, [CUBE_X, TABLE - 6 - LIFT], LENGTHS);

const BOX: [number, number] = [262, 206];

export function HeroAnimation() {
  return (
    <AnimationFrame
      variant="bare"
      title="From an instruction to a grasp"
      description="The instruction pick up the red cube is cut into tokens, and a camera image into patches. The policy reads both and outputs a short sequence of actions. The robot arm moves above the red cube, closes its gripper on it and lifts it."
      steps={[
        "An instruction, in plain words.",
        "It becomes tokens: the language model's input.",
        "A camera adds an image, cut into patches.",
        "The policy reads words and patches together.",
        "It outputs actions: where the arm should go next.",
        "The gripper closes on the object the words named.",
        "Lifted. Each part of this loop is a module of the course.",
      ]}
      size={[640, 400]}
      hold={[1700, 1700, 1700, 1700, 1900, 1700, 3200]}
      className="hero-anim"
    >
      {(step) => {
        const absorbed = step >= 3;
        const pose = step <= 3 ? HOME : step === 4 ? ABOVE : step === 5 ? GRASP : LIFTED;
        return (
          <>
            {/* Words */}
            <Chip x={150} y={44} text="pick up the red cube" tone="ink" variant="outline" size={17} width={280} opacity={step === 0 ? 1 : 0} />
            {TOKENS.map((token, index) => (
              <Chip
                key={token}
                x={absorbed ? BOX[0] : 84}
                y={absorbed ? BOX[1] - 20 : 44 + index * 36}
                text={token}
                tone="language"
                size={16}
                width={84}
                opacity={step === 0 ? 0 : absorbed ? 0 : 1}
                scale={absorbed ? 0.4 : 1}
                delay={stagger(index, 70)}
              />
            ))}
            <Label x={84} y={234} tone="language" size={14} weight={700} opacity={step >= 1 && !absorbed ? 1 : 0}>
              tokens
            </Label>

            {/* Pixels */}
            <Move x={absorbed ? BOX[0] : 84} y={absorbed ? BOX[1] + 20 : 300} opacity={step >= 2 && !absorbed ? 1 : 0} scale={absorbed ? 0.4 : 1}>
              {PATCHES.map((row, index) => (
                <Cells key={index} x={0} y={(index - 1) * 25} values={row} tone="vision" cell={22} gap={3} />
              ))}
            </Move>
            <Label x={84} y={356} tone="vision" size={14} weight={700} opacity={step >= 2 && !absorbed ? 1 : 0}>
              camera patches
            </Label>

            {/* The policy */}
            <Arrow from={[134, 120]} to={[BOX[0] - 64, BOX[1] - 30]} bend={-18} tone="language" drawn={step >= 1} flow={step === 3} width={2} opacity={step <= 3 ? 1 : 0} />
            <Arrow from={[134, 300]} to={[BOX[0] - 64, BOX[1] + 30]} bend={18} tone="vision" drawn={step >= 2} flow={step === 3} width={2} opacity={step <= 3 ? 1 : 0} />
            <Box x={BOX[0]} y={BOX[1]} w={116} h={150} label="policy" sub="VLA" tone="ink" active={step === 3 || step === 4} radius={18} />

            {/* Actions */}
            <Arrow from={[BOX[0] + 62, BOX[1]]} to={[372, 150]} bend={-26} tone="action" drawn={step >= 4} flow={step === 4} width={2.5} />
            <Cells x={350} y={96} values={ACTIONS} tone="action" cell={9} gap={2} opacity={step >= 4 ? 1 : 0} />
            <Label x={350} y={76} tone="action" size={14} weight={700} opacity={step >= 4 ? 1 : 0}>
              actions
            </Label>

            {/* The robot */}
            <Path d={`M352 ${TABLE}H636`} tone="faint" width={2} />
            <Thing kind="nut" x={478} y={TABLE} tone="muted" size={26} />
            <Thing kind="can" x={612} y={TABLE} tone="muted" size={28} />
            <Thing kind="cube" x={CUBE_X} y={step >= 6 ? TABLE - LIFT : TABLE} tone="ink" size={28} active={step <= 5} delay={step >= 6 ? 60 : 0} />
            <Arm base={BASE} lengths={LENGTHS} angles={pose} open={step >= 5 ? 0.72 : 1} tone="ink" />
          </>
        );
      }}
    </AnimationFrame>
  );
}
