"use client";

import { AnimationFrame, Bracket, Dot, Gripper, Label, Move, Path, stagger } from "@/animations";

/** A sketch of one demonstration as frames: the last two of the recording show shut jaws; the fix adds eight more. */
const FRAMES = 12;
const TAIL = 8;
const SHUT_FROM = 10;
const frameX = (i: number) => 40 + i * 20;
const STRIP_Y = 40;

const STEM_X = 214;
const CUT_Y = 222;
const TABLE = 300;

export function HoldJaws() {
  return (
    <AnimationFrame
      title="Cutting needs a patient hand"
      description="A cut happens only when the jaws stay shut on the stem for a moment. Each demonstration stopped right at the cut, so shut jaws appeared in only its last couple of frames, and the robot learned to close and reopen before the jaws reached the stem. Recording a few more frames with the jaws held shut fixed it: the robot waits with shut jaws and the stem is cut."
      steps={[
        "To cut, the robot closes its jaws on the stem and holds them shut for a moment.",
        "But each recording stopped right at the cut: shut jaws appear only in its last frames.",
        "The robot copied that: it closed and reopened before the jaws reached the stem.",
        "The fix: keep recording a little longer, with the jaws held shut.",
        "Now it waits with shut jaws, and the stem is cut: about 97 tries in 100.",
      ]}
      size={[480, 320]}
      hold={[2400, 2800, 2800, 2600, 3600]}
    >
      {(step) => {
        const open = step === 4 ? 0 : step === 2 ? 0.7 : 1;
        const cut = step === 4;
        return (
          <>
            {/* The demonstration as a strip of frames */}
            <Label x={40} y={20} tone="muted" size={13} anchor="start">
              one demonstration, frame by frame
            </Label>
            {Array.from({ length: FRAMES + TAIL }, (_, i) => {
              const shut = i >= SHUT_FROM;
              const tail = i >= FRAMES;
              return (
                <g
                  key={i}
                  className={`a-t ${shut ? "t-action" : "t-faint"}`}
                  style={{ opacity: tail ? (step >= 3 ? 1 : 0) : 1, transitionDelay: tail ? `${stagger(i - FRAMES, 60)}ms` : undefined }}
                >
                  <rect x={frameX(i)} y={STRIP_Y} width={16} height={22} rx={3} className={shut ? "a-fill" : "a-fill-soft a-stroke"} strokeWidth={1.2} />
                </g>
              );
            })}
            <Bracket x1={frameX(SHUT_FROM)} x2={frameX(FRAMES - 1) + 16} y={78} label="jaws shut" tone="action" below opacity={step === 1 || step === 2 ? 1 : 0} />
            <Bracket x1={frameX(SHUT_FROM)} x2={frameX(FRAMES + TAIL - 1) + 16} y={78} label="held shut longer" tone="action" below opacity={step >= 3 ? 1 : 0} />

            {/* The stem, cut at the jaws */}
            <Path d={`M30 ${TABLE}H450`} tone="faint" width={2} />
            <Path d={`M${STEM_X} ${TABLE}V${CUT_Y}`} tone="ink" width={4} />
            <Move x={cut ? STEM_X - 20 : STEM_X} y={cut ? TABLE - 6 : CUT_Y} rotate={cut ? -90 : 0.01} opacity={cut ? 0.6 : 1} delay={cut ? 500 : 0}>
              <line x1={0} y1={0} x2={0} y2={-84} className="t-ink a-stroke" strokeWidth={4} strokeLinecap="round" />
              <circle cx={0} cy={-94} r={11} className="t-mark a-fill-soft a-stroke" strokeWidth={2} />
            </Move>
            <Label x={STEM_X - 22} y={CUT_Y + 40} tone="muted" size={14} anchor="end">
              stem
            </Label>

            {/* The hand comes in from the side; the arm runs off the right edge */}
            <clipPath id="hold-jaws-stage">
              <rect x={0} y={0} width={466} height={320} />
            </clipPath>
            <g clipPath="url(#hold-jaws-stage)">
              <Move x={step === 0 ? 330 : 250} y={CUT_Y}>
                <line x1={4} y1={0} x2={260} y2={0} className="t-ink a-stroke arm-link" strokeWidth={10} strokeLinecap="round" />
                <Gripper x={0} y={0} angle={90} open={open} tone="ink" />
              </Move>
            </g>
            <Dot x={STEM_X} y={CUT_Y} r={4} tone="action" opacity={cut ? 1 : 0} />

            <Label x={300} y={CUT_Y + 52} tone="failure" size={14} weight={700} anchor="start" opacity={step === 2 ? 1 : 0}>
              reopened too soon: no cut
            </Label>
            <Label x={300} y={CUT_Y + 52} tone="success" size={14} weight={700} anchor="start" opacity={cut ? 1 : 0}>
              {"held shut: cut ✓"}
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
