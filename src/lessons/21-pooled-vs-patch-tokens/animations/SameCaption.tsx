"use client";

import { AnimationFrame, Arrow, Bracket, Chip, Label, Thing } from "@/animations";

/** 3 cm, drawn as 30 units. */
const SHIFT = 30;
const W = 150;
const H = 108;
const TOP = 30;
const FRAMES = [
  { x: 36, cube: 36 + 76, label: "frame A" },
  { x: 294, cube: 294 + 76 - SHIFT, label: "frame B" },
];
const TABLE = TOP + H - 22;

export function SameCaption() {
  return (
    <AnimationFrame
      title="A caption never says where"
      description="Two camera pictures differ only in where the cube stands: 3 cm further left in the second. The caption a red cube on a table is true of both, so an encoder trained to match pictures with captions gets no reward for telling them apart. For a grasp those centimetres decide: about 2 cm off, most grasps still hold; about 3 cm off, most slip."
      steps={[
        "Two pictures. In the second, the cube stands 3 cm further left.",
        "One caption fits both: “a red cube on a table”.",
        "Trained to match captions, the encoder gets no reward for telling them apart.",
        "For a grasp, those centimetres decide whether it holds.",
      ]}
      size={[480, 280]}
    >
      {(step) => (
        <>
          {FRAMES.map((frame, i) => (
            <g key={i === 0 ? "picture A" : "picture B"}>
              <rect x={frame.x} y={TOP} width={W} height={H} rx={8} className="t-faint a-fill-soft a-stroke" strokeWidth={1.5} />
              <path d={`M${frame.x + 10} ${TABLE}H${frame.x + W - 10}`} className="t-faint a-stroke" strokeWidth={2} />
              {i === 1 ? <Thing kind="cube" x={frame.cube + SHIFT} y={TABLE} size={24} tone="faint" opacity={0.45} /> : null}
              <Thing kind="cube" x={frame.cube} y={TABLE} size={24} tone="vision" />
              <Label x={frame.x + W / 2} y={TOP + H + 16} tone="muted" size={13}>
                {i === 0 ? "picture A" : "picture B"}
              </Label>
            </g>
          ))}
          <Bracket x1={FRAMES[1].cube} x2={FRAMES[1].cube + SHIFT} y={TABLE - 40} label="3 cm" tone="ink" />

          <Arrow from={[FRAMES[0].x + W / 2, TOP + H + 30]} to={[200, 196]} bend={-12} tone="faint" drawn={step >= 1} opacity={step >= 1 ? 1 : 0} />
          <Arrow from={[FRAMES[1].x + W / 2, TOP + H + 30]} to={[280, 196]} bend={12} tone="faint" drawn={step >= 1} opacity={step >= 1 ? 1 : 0} delay={120} />
          <Chip x={240} y={212} text="a red cube on a table" tone="language" size={15} opacity={step >= 1 ? 1 : 0} />

          <Label x={240} y={256} tone="failure" size={14} weight={700} opacity={step === 2 ? 1 : 0}>
            same score for both pictures
          </Label>
          <Label x={240} y={256} tone="failure" size={14} weight={700} opacity={step === 3 ? 1 : 0}>
            a grasp 2 cm off mostly holds; 3 cm off, mostly fails
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
