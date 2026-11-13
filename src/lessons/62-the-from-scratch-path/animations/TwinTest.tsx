"use client";

import { AnimationFrame, Arrow, Box, Cells, Chip, Label, Move } from "@/animations";

/** Made-up shades: learned numbers drawn as a calm pattern, random ones as noise. */
const LEARNED = [0.25, 0.45, 0.7, 0.9, 0.7, 0.45, 0.25];
const RANDOM = [0.8, 0.1, 0.55, 0.05, 0.95, 0.3, 0.65];

const LEFT = 130;
const RIGHT = 350;

function Model({ cells, tone, readerActive }: { cells: number[]; tone: "accent" | "muted"; readerActive: boolean }) {
  return (
    <>
      <Box x={0} y={0} w={170} h={64} tone={tone === "accent" ? "accent" : "ink"} active={readerActive} />
      <Label x={0} y={-14} tone="ink" size={14} weight={700}>
        reader
      </Label>
      <Cells x={0} y={12} values={cells} tone={tone} cell={14} gap={3} />
      <Arrow from={[0, 34]} to={[0, 58]} tone="faint" width={1.5} />
      <Box x={0} y={84} w={170} h={40} label="mover" tone="action" />
    </>
  );
}

export function TwinTest() {
  return (
    <AnimationFrame
      title="A fair test needs a twin"
      description="The robot model built on the pretrained reader gets a twin that is identical except for one thing: its reader starts from random numbers. Both are trained on the same demonstrations for the same time, so any difference between them is what the earlier stages bought."
      steps={[
        "The robot model, built on the pretrained reader.",
        "Make a twin, the control: identical in every way…",
        "…except one: its reader starts from random numbers.",
        "Train both on the same demonstrations, for the same time.",
        "Any difference now comes from the earlier stages, and nothing else.",
      ]}
      size={[480, 290]}
    >
      {(step) => (
        <>
          <Label x={LEFT} y={24} tone="accent" size={14} weight={700}>
            pretrained reader
          </Label>
          <Label x={RIGHT} y={24} tone="muted" size={14} weight={700} opacity={step >= 1 ? 1 : 0}>
            {step >= 2 ? "the control: random reader" : "the control"}
          </Label>

          <Move x={LEFT} y={84}>
            <Model cells={LEARNED} tone="accent" readerActive={false} />
          </Move>
          <Move x={step >= 1 ? RIGHT : LEFT} y={84} opacity={step >= 1 ? 1 : 0}>
            <Model cells={step >= 2 ? RANDOM : LEARNED} tone={step >= 2 ? "muted" : "accent"} readerActive={step === 2} />
          </Move>

          <Chip x={240} y={256} text="same demonstrations, same practice" tone="action" size={14} mono={false} opacity={step >= 3 ? 1 : 0} />
          <Arrow from={[200, 238]} to={[LEFT + 20, 192]} tone="action" width={1.5} drawn={step >= 3} />
          <Arrow from={[280, 238]} to={[RIGHT - 20, 192]} tone="action" width={1.5} drawn={step >= 3} delay={120} />

          <Label x={240} y={84} tone="ink" size={22} weight={700} opacity={step === 4 ? 1 : 0}>
            vs
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
