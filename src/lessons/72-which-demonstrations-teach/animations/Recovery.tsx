"use client";

import { AnimationFrame, Cells, Dot, Label, Move, Path } from "@/animations";

/* From above: the gripper heads for the cube, the cube is moved, the expert
   turns. The moments after the move can only be explained by the picture. */

const TILE = { x: 24, y: 30, w: 270, h: 190 };
const START: [number, number] = [TILE.x + 36, TILE.y + 160];
const TURN: [number, number] = [TILE.x + 128, TILE.y + 96];
const OLD: [number, number] = [TILE.x + 210, TILE.y + 46];
const NEW: [number, number] = [TILE.x + 222, TILE.y + 146];

const MOMENTS = 66;
const MOVED_AT = 18;
const RECOVERED_AT = 40;

export function Recovery() {
  return (
    <AnimationFrame
      title="A recovery is a lesson in looking"
      description="Seen from above, the gripper heads for the cube. Halfway, the cube is moved. The expert turns toward its new place. Nothing in the arm's own pose explains that turn; only the picture does, so every moment after the move teaches the robot to look."
      steps={[
        "From above: the gripper heads for the cube.",
        "Halfway, the cube is moved.",
        "The expert turns toward the new place.",
        "Nothing in the arm's pose explains the turn. Only the picture does.",
      ]}
      size={[480, 300]}
    >
      {(step) => {
        const moved = step >= 1;
        return (
          <>
            <rect className="a-t t-faint a-fill-soft a-stroke" x={TILE.x} y={TILE.y} width={TILE.w} height={TILE.h} rx={8} strokeWidth={1.5} />
            <rect
              className="a-t t-faint a-stroke"
              x={OLD[0] - 13}
              y={OLD[1] - 13}
              width={26}
              height={26}
              rx={4}
              fill="none"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              style={{ opacity: moved ? 1 : 0 }}
            />
            <Move x={moved ? NEW[0] : OLD[0]} y={moved ? NEW[1] : OLD[1]}>
              <rect className="t-action a-fill-soft a-stroke" x={-13} y={-13} width={26} height={26} rx={4} strokeWidth={2} />
            </Move>

            <Path d={`M${START[0]} ${START[1]}L${TURN[0]} ${TURN[1]}`} tone="ink" width={2.5} />
            <Path d={`M${TURN[0]} ${TURN[1]}L${OLD[0] - 16} ${OLD[1] + 12}`} tone="faint" width={2} dashed opacity={step <= 1 ? 1 : 0.5} />
            <Path d={`M${TURN[0]} ${TURN[1]}Q${TURN[0] + 40} ${TURN[1] - 20} ${NEW[0] - 18} ${NEW[1] - 8}`} tone="action" width={2.5} drawn={step >= 2} />
            <Dot x={START[0]} y={START[1]} r={5} tone="muted" />
            <Dot x={step >= 2 ? NEW[0] - 18 : TURN[0]} y={step >= 2 ? NEW[1] - 8 : TURN[1]} r={8} tone="ink" />
            <Label x={START[0] + 12} y={START[1] + 4} tone="muted" size={13} anchor="start">
              start
            </Label>

            <Label x={316} y={86} tone="ink" size={15} weight={700} anchor="start" opacity={step >= 3 ? 1 : 0}>
              Why turn here?
            </Label>
            <Label x={316} y={110} tone="muted" size={14} anchor="start" opacity={step >= 3 ? 1 : 0}>
              The arm&apos;s pose
            </Label>
            <Label x={316} y={130} tone="muted" size={14} anchor="start" opacity={step >= 3 ? 1 : 0}>
              cannot say.
            </Label>
            <Label x={316} y={154} tone="vision" size={14} weight={700} anchor="start" opacity={step >= 3 ? 1 : 0}>
              The picture can.
            </Label>

            <Cells
              x={240}
              y={274}
              values={Array.from({ length: MOMENTS }, (_, index) => (index >= MOVED_AT && index < RECOVERED_AT ? 1 : 0.1))}
              tone="accent"
              cell={5}
              gap={1}
              opacity={step >= 3 ? 1 : 0}
            />
            <Label x={240} y={252} tone="accent" size={14} weight={700} opacity={step >= 3 ? 1 : 0}>
              the moments after the move teach looking
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
