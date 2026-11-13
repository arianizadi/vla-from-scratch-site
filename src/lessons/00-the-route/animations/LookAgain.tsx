"use client";

import { AnimationFrame, Arm, Dot, Label, Path, Thing, reach } from "@/animations";

const TABLE = 250;
const BASE: [number, number] = [150, TABLE];
const LENGTHS: [number, number] = [130, 120];
const CUBE_START = 300;
const CUBE_MOVED = 372;
const LIFT = 56;

/** The fingertips' trail: each point is one small move, with the step it is reached in. */
const TRAIL: { at: [number, number]; from: number }[] = [
  { at: [196, 118], from: 0 },
  { at: [230, 136], from: 0 },
  { at: [260, 152], from: 1 },
  { at: [288, 166], from: 2 },
  { at: [326, 176], from: 4 },
  { at: [356, 184], from: 4 },
];
/** Where the fingertips are in each step. */
const TIP: [number, number][] = [
  TRAIL[1].at,
  TRAIL[2].at,
  TRAIL[3].at,
  TRAIL[3].at,
  [CUBE_MOVED, 196],
  [CUBE_MOVED, TABLE - 6 - LIFT],
];

/** The camera's view in the corner: a small frame with the cube where the camera sees it. */
const VIEW = { x: 404, y: 62, w: 104, h: 64 };

function cubeInView(cubeX: number, lifted: boolean): [number, number] {
  const fx = VIEW.x - VIEW.w / 2 + 10 + ((cubeX - 200) / 240) * (VIEW.w - 20);
  return [fx, VIEW.y + 12 - (lifted ? 14 : 0)];
}

export function LookAgain() {
  return (
    <AnimationFrame
      title="Look, move, look again"
      description="The arm moves toward a cube in small steps, and after every step the camera takes a new picture. Halfway, someone pushes the cube to the right. The next picture shows the new place, so the next moves head there, and the arm grasps and lifts the cube."
      steps={[
        "The camera takes a picture. The policy picks one small move.",
        "A new picture, a new move.",
        "And again: many small moves, each after a fresh look.",
        "Someone pushes the cube. The next picture shows it.",
        "So the next moves head to where the cube is now.",
        "Grasp and lift.",
      ]}
      hold={[2200, 1800, 1800, 2400, 2200, 3200]}
      size={[480, 280]}
    >
      {(step) => {
        const cubeX = step >= 3 ? CUBE_MOVED : CUBE_START;
        const lifted = step >= 5;
        const tip = TIP[step];
        const [vx, vy] = cubeInView(cubeX, lifted);
        return (
          <>
            <Path d={`M20 ${TABLE}H460`} tone="faint" width={2} />

            {TRAIL.map(({ at: [x, y], from }, index) => (
              <Dot key={index} x={x} y={y} r={4} tone="action" opacity={step >= from ? 0.9 : 0} />
            ))}

            <Thing kind="cube" x={cubeX} y={lifted ? TABLE - LIFT : TABLE} tone="action" size={28} active={!lifted} delay={lifted ? 120 : 0} />
            <Thing kind="cube" x={CUBE_START} y={TABLE} tone="faint" size={28} opacity={step >= 3 && step <= 4 ? 0.5 : 0} />
            <Arm base={BASE} lengths={LENGTHS} angles={reach(BASE, tip, LENGTHS)} open={step >= 5 ? 0.6 : 1} tone="ink" />

            <rect
              className="t-vision a-fill-soft a-stroke"
              x={VIEW.x - VIEW.w / 2}
              y={VIEW.y - VIEW.h / 2}
              width={VIEW.w}
              height={VIEW.h}
              rx={8}
              strokeWidth={1.5}
            />
            <path className="t-vision a-stroke" d={`M${VIEW.x - VIEW.w / 2} ${VIEW.y + 20}H${VIEW.x + VIEW.w / 2}`} strokeWidth={1} />
            <g className="a-t" style={{ transform: `translate(${vx}px, ${vy}px)` }}>
              <rect className="t-action a-fill" x={-7} y={-6} width={14} height={14} rx={2} />
            </g>
            <Label x={VIEW.x} y={VIEW.y + VIEW.h / 2 + 16} tone="vision" size={14} weight={700}>
              {`picture ${step + 1}`}
            </Label>
            <Label x={(CUBE_START + CUBE_MOVED) / 2} y={TABLE + 16} tone="ink" size={14} weight={700} opacity={step === 3 || step === 4 ? 1 : 0}>
              pushed →
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
