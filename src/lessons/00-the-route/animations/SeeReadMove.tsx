"use client";

import { AnimationFrame, Arm, Arrow, Box, Cells, Chip, Label, Path, Thing, reach } from "@/animations";

const TABLE = 262;
const BASE: [number, number] = [372, TABLE];
const LENGTHS: [number, number] = [96, 88];
const CUBE_X = 452;

const HOME = reach(BASE, [392, 168], LENGTHS);
const STEP = reach(BASE, [438, 206], LENGTHS);

const JOINTS = [0.5, 0.3, 0.75, 0.2, 0.6, 0.45, 0.9];
const MOVE = [0.7, 0.25, 0.55, 0.35, 0.8, 0.4, 0.9];

/** A camera picture: the table seen from the front, the cube on it. */
function Picture({ x, y, opacity }: { x: number; y: number; opacity: number }) {
  return (
    <g className="a-t" style={{ transform: `translate(${x}px, ${y}px)`, opacity }}>
      <rect className="t-vision a-fill-soft a-stroke" x={-48} y={-33} width={96} height={66} rx={8} strokeWidth={1.5} />
      <path className="t-vision a-stroke" d="M-48 12H48" strokeWidth={1} />
      <rect className="t-action a-fill" x={14} y={-4} width={16} height={16} rx={2} />
      <rect className="t-muted a-fill" x={-30} y={-8} width={11} height={20} rx={4} />
    </g>
  );
}

export function SeeReadMove() {
  return (
    <AnimationFrame
      title="Three things in, one move out"
      description="A camera picture of the table, the instruction pick up the red cube, and the angles of the arm's joints go into the policy. The policy answers with one small move, a handful of numbers for the joints, and the arm makes that move toward the cube."
      steps={[
        "The camera shows the table.",
        "The instruction says what to do.",
        "The arm reports where its joints are.",
        "The policy turns all three into one small move.",
        "The arm makes that move.",
      ]}
      size={[480, 280]}
    >
      {(step) => (
        <>
          <Chip x={120} y={40} text="pick up the red cube" tone="language" size={14} opacity={step >= 1 ? 1 : 0.15} />
          <Picture x={74} y={124} opacity={1} />
          <Label x={74} y={174} tone="vision" size={14} weight={700}>
            camera
          </Label>
          <Cells x={74} y={212} values={JOINTS} tone="ink" cell={10} gap={3} opacity={step >= 2 ? 1 : 0.15} />
          <Label x={74} y={236} tone="muted" size={14} opacity={step >= 2 ? 1 : 0}>
            joint angles
          </Label>

          <Arrow from={[150, 58]} to={[214, 112]} bend={-10} tone="language" width={1.5} drawn={step >= 1} flow={step === 3} />
          <Arrow from={[128, 124]} to={[200, 134]} tone="vision" width={1.5} drawn={step >= 0} />
          <Arrow from={[124, 212]} to={[204, 170]} bend={10} tone="muted" width={1.5} drawn={step >= 2} />

          <Box x={250} y={140} w={96} h={64} label="policy" sub="the model" tone="ink" active={step === 3} radius={14} />

          <Cells x={250} y={214} values={MOVE} tone="action" cell={10} gap={3} opacity={step >= 3 ? 1 : 0} delay={200} />
          <Label x={250} y={238} tone="action" size={14} weight={700} opacity={step >= 3 ? 1 : 0} delay={200}>
            next move
          </Label>
          <Arrow from={[250, 174]} to={[250, 198]} tone="action" width={1.5} drawn={step >= 3} />
          <Arrow from={[298, 212]} to={[336, 196]} tone="action" width={2} drawn={step >= 3} flow={step === 4} delay={300} />

          <Path d={`M306 ${TABLE}H468`} tone="faint" width={2} />
          <Thing kind="can" x={322} y={TABLE} tone="muted" size={24} />
          <Thing kind="cube" x={CUBE_X} y={TABLE} tone="action" size={24} active={step >= 1} />
          <Arm base={BASE} lengths={LENGTHS} angles={step >= 4 ? STEP : HOME} tone="ink" />
        </>
      )}
    </AnimationFrame>
  );
}
