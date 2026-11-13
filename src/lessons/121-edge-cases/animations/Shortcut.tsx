"use client";

import { AnimationFrame, Arm, Arrow, Box, Cells, Label, Path, Thing, reach } from "@/animations";

const TABLE = 262;
const BASE: [number, number] = [372, TABLE];
const LENGTHS: [number, number] = [96, 88];
const CUBE_X = 452;

const HOME = reach(BASE, [392, 168], LENGTHS);
const WRONG = reach(BASE, [418, TABLE - 26], LENGTHS);

const LAST = [0.6, 0.3, 0.7, 0.4, 0.5, 0.8, 0.35];
const NEXT = [0.62, 0.31, 0.68, 0.42, 0.5, 0.79, 0.36];

export function Shortcut() {
  return (
    <AnimationFrame
      title="The shortcut of the last move"
      description="The policy gets the camera picture and its own last move. In smooth demonstrations the next move is almost the same as the last one, so training rewards copying it and the camera stops mattering. On the robot, the policy never really looks and closes the gripper in the wrong place."
      steps={[
        "The policy gets the camera picture and, as an extra, its own last move.",
        "In smooth demonstrations, the next move is almost the same as the last one.",
        "So copying the last move scores well in training. The camera stops mattering.",
        "On the robot it never really looks, and closes the gripper in the wrong place.",
      ]}
      size={[480, 280]}
    >
      {(step) => {
        const leaning = step >= 2;
        return (
          <>
            <g className="a-t" style={{ opacity: leaning ? 0.3 : 1 }}>
              <rect className="t-vision a-fill-soft a-stroke" x={26} y={52} width={96} height={64} rx={8} strokeWidth={1.5} />
              <path className="t-vision a-stroke" d="M26 96H122" strokeWidth={1} />
              <rect className="t-action a-fill" x={88} y={80} width={15} height={15} rx={2} />
            </g>
            <Label x={74} y={132} tone="vision" size={14} weight={700} opacity={leaning ? 0.4 : 1}>
              camera
            </Label>

            <Label x={74} y={164} tone="action" size={14} weight={700}>
              last move
            </Label>
            <Cells x={74} y={186} values={LAST} tone="action" cell={11} gap={3} />
            <Cells x={74} y={222} values={NEXT} tone="action" cell={11} gap={3} opacity={step === 1 ? 1 : 0} />
            <Label x={74} y={244} tone="muted" size={14} opacity={step === 1 ? 1 : 0}>
              next move: almost equal
            </Label>

            <Arrow from={[126, 88]} to={[196, 124]} tone="vision" width={leaning ? 1 : 2} opacity={leaning ? 0.25 : 1} />
            <Arrow from={[128, 186]} to={[196, 156]} tone="action" width={leaning ? 5 : 2} flow={leaning} />
            <Label x={164} y={210} tone="failure" size={14} weight={700} opacity={leaning ? 1 : 0}>
              leans on this
            </Label>

            <Box x={244} y={140} w={92} h={60} label="policy" tone="ink" active={step === 2} radius={14} />
            <Arrow from={[292, 140]} to={[334, 150]} tone="action" width={2} drawn={step >= 3} />

            <Path d={`M306 ${TABLE}H468`} tone="faint" width={2} />
            <Thing kind="can" x={322} y={TABLE} tone="muted" size={24} />
            <Thing kind="cube" x={CUBE_X} y={TABLE} tone="action" size={24} active />
            <Arm base={BASE} lengths={LENGTHS} angles={step >= 3 ? WRONG : HOME} open={step >= 3 ? 0 : 1} tone="ink" />
            <Label x={392} y={40} tone="failure" size={14} weight={700} opacity={step >= 3 ? 1 : 0} delay={600}>
              closed on nothing
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
