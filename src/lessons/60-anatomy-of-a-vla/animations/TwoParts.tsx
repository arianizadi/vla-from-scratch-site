"use client";

import { AnimationFrame, Arm, Arrow, Box, Cells, Chip, Label, Path, Thing, reach, stagger } from "@/animations";

/** Made-up shades: the notes are numbers; these only show "a list of numbers". */
const NOTES = [0.7, 0.35, 0.9, 0.5, 0.2, 0.8, 0.6];

const COL = 110;
const TABLE = 300;
const BASE: [number, number] = [262, TABLE];
const LENGTHS: [number, number] = [100, 90];
const CUBE = 340;

const HOME = reach(BASE, [320, 196], LENGTHS);
const GRASP = reach(BASE, [CUBE, 292], LENGTHS);
const LIFT = reach(BASE, [CUBE, 230], LENGTHS);

export function TwoParts() {
  return (
    <AnimationFrame
      title="A reader and a mover"
      description="A camera picture and the instruction pick up the red cube go into the reader, which turns them into notes: lists of numbers. The mover reads the notes and plans the motion, and the arm picks up the red cube."
      steps={[
        "A camera picture and an instruction come in.",
        "The reader turns both into notes: lists of numbers.",
        "The mover reads the notes and plans the motion.",
        "The arm picks up the red cube.",
      ]}
      size={[480, 320]}
    >
      {(step) => (
        <>
          {/* the camera picture: a tile with the three objects in it */}
          <rect className="a-t t-vision a-fill-soft a-stroke" x={COL - 60} y={22} width={120} height={66} rx={8} strokeWidth={1.5} />
          <Thing kind="cube" x={COL - 32} y={80} size={16} tone="action" />
          <Thing kind="can" x={COL} y={80} size={16} tone="muted" />
          <Thing kind="nut" x={COL + 32} y={80} size={16} tone="muted" />
          <Label x={COL - 52} y={36} tone="vision" size={13} anchor="start">
            camera
          </Label>
          <Chip x={COL} y={114} text="pick up the red cube" tone="language" size={13} mono={false} />

          <Box x={COL} y={170} w={160} h={44} label="Reader" sub="the backbone" active={step === 1} />
          <Cells x={COL} y={216} values={NOTES} tone="accent" cell={14} gap={3} opacity={step >= 1 ? 1 : 0} delay={stagger(2, 120)} />
          <Label x={COL + 68} y={216} tone="accent" size={14} anchor="start" opacity={step >= 1 ? 1 : 0} delay={stagger(3, 120)}>
            notes
          </Label>
          <Box x={COL} y={266} w={160} h={44} label="Mover" sub="the action head" active={step === 2} />

          <Arrow from={[COL, 128]} to={[COL, 146]} tone="faint" width={1.5} drawn={step >= 1} />
          <Arrow from={[COL, 194]} to={[COL, 206]} tone="faint" width={1.5} drawn={step >= 1} head={false} />
          <Arrow from={[COL, 225]} to={[COL, 242]} tone="faint" width={1.5} drawn={step >= 2} />
          <Arrow from={[COL + 82, 266]} to={[COL + 128, 266]} tone="accent" width={2} drawn={step >= 2} flow={step === 2} />

          <Path d={`M222 ${TABLE}H468`} tone="faint" width={2} />
          <Thing kind="cube" x={CUBE} y={step >= 3 ? TABLE - 62 : TABLE} tone="action" active={step <= 2} />
          <Thing kind="can" x={396} y={TABLE} tone="muted" />
          <Thing kind="nut" x={444} y={TABLE} tone="muted" />
          <Arm
            base={BASE}
            lengths={LENGTHS}
            angles={step <= 1 ? HOME : step === 2 ? GRASP : LIFT}
            open={step >= 3 ? 0.75 : 1}
          />
        </>
      )}
    </AnimationFrame>
  );
}
