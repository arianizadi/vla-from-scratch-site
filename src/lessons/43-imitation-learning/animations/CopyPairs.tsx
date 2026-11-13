"use client";

import { Arrow, AnimationFrame, Box, Chip, Label, Move, stagger } from "@/animations";

/** Four frames of a recorded reach, seen from above: the gripper (a dot) closes in on the cube. */
const FRAMES = [72, 176, 280, 384];
const FRAME_Y = 78;
const FRAME_W = 84;
const FRAME_H = 60;
/** Where the gripper is inside each frame, relative to its centre. */
const GRIPPER = [-26, -12, 2, 16];

function Frame({ x, y, index, opacity = 1, delay }: { x: number; y: number; index: number; opacity?: number; delay?: number }) {
  return (
    <Move x={x} y={y} opacity={opacity} delay={delay}>
      <rect x={-FRAME_W / 2} y={-FRAME_H / 2} width={FRAME_W} height={FRAME_H} rx={8} className="t-vision a-fill-soft a-stroke" strokeWidth={1.5} />
      <rect x={20} y={-9} width={18} height={18} rx={3} className="t-action a-fill-soft a-stroke" strokeWidth={1.5} />
      <circle cx={GRIPPER[index]} cy={0} r={6} className="t-ink a-fill" />
    </Move>
  );
}

const ACTION_Y = 136;

export function CopyPairs() {
  return (
    <AnimationFrame
      title="Learning by copying"
      description="An expert's reach is recorded as four frames, seen from above, with the gripper closing in on a cube. Under each frame is what the expert did next: move right three times, then close. The policy is shown one of the frames and trained to output the same action the expert took there."
      steps={[
        "The expert does the task while we record what it sees, frame by frame.",
        "And what it did next, at every frame.",
        "The policy is shown one view and asked: what would the expert do?",
        "It is trained until its answer matches the expert's, for every recorded view.",
      ]}
      size={[480, 290]}
    >
      {(step) => (
        <>
          <Label x={16} y={26} tone="ink" size={14} anchor="start" weight={700}>
            {"the expert's recording"}
          </Label>
          {FRAMES.map((x, index) => (
            <Frame key={x} x={x} y={FRAME_Y} index={index} delay={stagger(index, 80)} />
          ))}
          {FRAMES.map((x, index) =>
            index < 3 ? (
              <Arrow
                key={`a-${x}`}
                from={[x - 18, ACTION_Y]}
                to={[x + 18, ACTION_Y]}
                tone="action"
                width={3}
                drawn={step >= 1}
                opacity={step >= 1 ? 1 : 0}
                delay={stagger(index, 120)}
              />
            ) : (
              <Chip key={`a-${x}`} x={x} y={ACTION_Y} text="close" tone="action" size={14} opacity={step >= 1 ? 1 : 0} delay={360} />
            ),
          )}
          <Label x={16} y={ACTION_Y + 30} tone="action" size={13} anchor="start" opacity={step >= 1 ? 1 : 0}>
            what it did next
          </Label>

          <Frame x={step >= 2 ? 84 : FRAMES[1]} y={step >= 2 ? 236 : FRAME_Y} index={1} opacity={step >= 2 ? 1 : 0} />
          <Arrow from={[132, 236]} to={[176, 236]} tone="muted" drawn={step >= 2} opacity={step >= 2 ? 1 : 0} delay={400} />
          <Box x={236} y={236} w={104} h={46} label="policy" tone="accent" opacity={step >= 2 ? 1 : 0} delay={300} active={step >= 3} />
          <Arrow from={[300, 236]} to={[342, 236]} tone="action" width={3} drawn={step >= 3} opacity={step >= 3 ? 1 : 0} />
          <Label x={354} y={236} tone="success" size={14} anchor="start" weight={700} opacity={step >= 3 ? 1 : 0} delay={500}>
            same as expert
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
