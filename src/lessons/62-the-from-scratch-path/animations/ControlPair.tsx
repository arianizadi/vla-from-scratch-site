"use client";

import { AnimationFrame, Bracket, Label, Path, Timeline } from "@/animations";

const TRACK_X = 40;
const TRACK_W = 400;
/** Training examples seen, in millions, on the track's 0 to 3M scale. */
const at = (millions: number) => millions / 3;
const xAt = (millions: number) => TRACK_X + TRACK_W * at(millions);

const PRETRAINED_Y = 100;
const CONTROL_Y = 214;

/** Where the marker stands in each step, in millions of examples. */
const PROGRESS = [0, 0.25, 1.0, 3.0];

function Flag({ x, y, text, tone, shown }: { x: number; y: number; text: string; tone: "accent" | "muted"; shown: boolean }) {
  return (
    <>
      <Path d={`M${x} ${y - 6}V${y - 34}`} tone={tone} width={2} drawn={shown} />
      <Label x={x + 8} y={y - 32} tone={tone} size={14} weight={700} anchor="start" opacity={shown ? 1 : 0} delay={300}>
        {text}
      </Label>
    </>
  );
}

export function ControlPair() {
  return (
    <AnimationFrame
      title="A head start, not a higher finish"
      description="Both twins are checked as they train. The one with the pretrained reader starts aiming at the named object after about 0.25 million training examples; the control, with a random reader, after about 1 million, four times later. By the end of training both do the task, and their final scores do not rank one above the other."
      steps={[
        "Train both twins and check them as they learn.",
        "The pretrained twin starts aiming at the named object after 0.25M examples.",
        "The control gets there after about 1M: four times later.",
        "By the end both do the task. The head start was the gain.",
      ]}
      size={[480, 288]}
    >
      {(step) => {
        const progress = at(PROGRESS[step]);
        return (
          <>
            <Label x={TRACK_X} y={PRETRAINED_Y - 64} tone="accent" size={15} weight={700} anchor="start">
              pretrained reader
            </Label>
            <Timeline x={TRACK_X} y={PRETRAINED_Y} w={TRACK_W} ticks={[]} marker={progress} tone="accent" />
            <Flag x={xAt(0.25)} y={PRETRAINED_Y} text="starts aiming" tone="accent" shown={step >= 1} />

            <Label x={TRACK_X} y={CONTROL_Y - 64} tone="muted" size={15} weight={700} anchor="start">
              control: random reader
            </Label>
            <Timeline x={TRACK_X} y={CONTROL_Y} w={TRACK_W} ticks={["0", "1M", "2M", "3M"]} marker={progress} tone="muted" />
            <Flag x={xAt(1.0)} y={CONTROL_Y} text="starts aiming" tone="muted" shown={step >= 2} />

            <Bracket x1={xAt(0.25)} x2={xAt(1.0)} y={170} label="head start" tone="accent" below opacity={step >= 2 ? 1 : 0} delay={400} />

            <Label x={TRACK_X + TRACK_W} y={PRETRAINED_Y + 26} tone="success" size={14} weight={700} anchor="end" opacity={step >= 3 ? 1 : 0}>
              does the task
            </Label>
            <Label x={TRACK_X + TRACK_W} y={CONTROL_Y - 22} tone="success" size={14} weight={700} anchor="end" opacity={step >= 3 ? 1 : 0}>
              does the task
            </Label>
            <Label x={TRACK_X + TRACK_W} y={270} tone="faint" size={13} anchor="end">
              training examples seen
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
