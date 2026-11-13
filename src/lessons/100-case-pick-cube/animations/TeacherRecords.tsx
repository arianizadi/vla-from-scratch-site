"use client";

import { AnimationFrame, Arm, Label, Move, Path, Thing, reach, stagger } from "@/animations";

const BASE: [number, number] = [70, 262];
const LENGTHS: [number, number] = [150, 130];
const TABLE = 262;
const CUBE = 236;
const LIFT = 70;

const POSES = [
  { at: [180, 150] as [number, number], open: 1 },
  { at: [CUBE, TABLE - 15] as [number, number], open: 0 },
  { at: [CUBE, TABLE - 15 - LIFT] as [number, number], open: 0 },
  { at: [CUBE, TABLE - 15 - LIFT] as [number, number], open: 0 },
];

/** The recording: a strip of frames, each a camera picture and the arm's move at that moment. */
const FRAMES = 6;
const frameX = (i: number) => 300 + (i % 3) * 52;
const frameY = (i: number) => 58 + Math.floor(i / 3) * 46;
/** Frames saved by the end of each step. */
const SAVED = [0, 3, 6, 6];

export function TeacherRecords() {
  return (
    <AnimationFrame
      title="An expert to copy"
      description="A scripted expert, a program that knows exactly where the cube is, reaches down, grasps the red cube and lifts it. Every moment is saved as a frame: what the cameras saw and how the arm moved. One such recording is a demonstration; with the cube in many places, there are hundreds to learn from."
      steps={[
        "One red cube, and a scripted expert that knows exactly where it is.",
        "The expert reaches down and grasps the cube. Each moment is saved.",
        "It lifts the cube. The saved frames pair what the cameras saw with how the arm moved.",
        "Repeat with the cube in many places: hundreds of demonstrations to copy.",
      ]}
      size={[480, 290]}
      hold={[2200, 2600, 2800, 3600]}
    >
      {(step) => {
        const pose = POSES[step];
        const lifted = step >= 2;
        return (
          <>
            <Path d={`M12 ${TABLE}H280`} tone="faint" width={2} />
            <Thing kind="cube" x={CUBE} y={lifted ? TABLE - LIFT : TABLE} tone="action" delay={lifted ? 100 : 0} />
            <Arm base={BASE} lengths={LENGTHS} angles={reach(BASE, pose.at, LENGTHS)} open={pose.open} tone="ink" />
            <Label x={110} y={TABLE + 18} tone="muted" size={13}>
              scripted expert
            </Label>

            <Label x={300 - 22} y={20} tone="muted" size={13} anchor="start">
              one demonstration
            </Label>
            {Array.from({ length: FRAMES }, (_, i) => {
              const saved = i < SAVED[step];
              const t = i / (FRAMES - 1);
              return (
                <Move key={i} x={frameX(i)} y={frameY(i)} opacity={saved ? 1 : 0} delay={stagger(i % 3, 160)}>
                  <rect x={-22} y={-18} width={44} height={36} rx={5} className="t-vision a-fill-soft a-stroke" strokeWidth={1.5} />
                  <rect x={-6} y={4 - Math.round(t * 10)} width={10} height={10} rx={2} className="t-action a-fill" />
                  <path d={`M-17 12L${Math.round(-10 + t * 14)} ${Math.round(-12 + t * 6)}`} className="t-ink a-stroke" strokeWidth={2} strokeLinecap="round" />
                </Move>
              );
            })}

            {[0, 1, 2].map((k) => (
              <Move key={k} x={360 + k * 8} y={200 - k * 8} opacity={step === 3 ? 1 : 0} delay={stagger(k, 120)}>
                <rect x={-60} y={-24} width={120} height={48} rx={8} className="t-vision a-fill-surface a-stroke" strokeWidth={1.5} />
              </Move>
            ))}
            <Label x={376} y={184} tone="ink" size={15} weight={700} opacity={step === 3 ? 1 : 0} delay={360}>
              × hundreds
            </Label>
            <Label x={364} y={244} tone="muted" size={13} opacity={step === 3 ? 1 : 0} delay={360}>
              the cube moves each time
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
