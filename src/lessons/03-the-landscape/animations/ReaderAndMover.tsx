"use client";

import { AnimationFrame, Arrow, Box, Cells, Chip, Label, Path } from "@/animations";

const NUMBERS = [0.8, 0.3, 0.6, 0.9, 0.4, 0.7];

export function ReaderAndMover() {
  return (
    <AnimationFrame
      title="Two halves: a reader and a mover"
      description="A camera picture and an instruction go into the backbone, which reads them and turns them into a list of numbers. The action head reads those numbers and turns them into a motion for the arm. Every robot model today has these two halves."
      steps={[
        "In: a camera picture and an instruction.",
        "The backbone reads them and turns them into numbers.",
        "The action head turns those numbers into a motion.",
        "Every model has these two halves. They differ in how each half is built.",
      ]}
      size={[480, 270]}
    >
      {(step) => (
        <>
          <g className="a-t">
            <rect className="t-vision a-fill-soft a-stroke" x={18} y={74} width={88} height={60} rx={8} strokeWidth={1.5} />
            <path className="t-vision a-stroke" d="M18 116H106" strokeWidth={1} />
            <rect className="t-action a-fill" x={68} y={100} width={15} height={15} rx={2} />
          </g>
          <Label x={62} y={150} tone="vision" size={14} weight={700}>
            picture
          </Label>
          <Chip x={62} y={196} text="red cube" tone="language" size={14} />

          <Arrow from={[110, 104]} to={[124, 124]} tone="vision" width={1.5} />
          <Arrow from={[106, 192]} to={[124, 160]} tone="language" width={1.5} />

          <Box x={175} y={140} w={96} h={120} label="backbone" sub="reads" tone="ink" active={step === 1 || step === 3} radius={14} />

          <Cells x={258} y={140} values={NUMBERS} tone="accent" cell={14} gap={4} direction="column" opacity={step >= 1 ? 1 : 0} delay={250} />
          <Label x={258} y={74} tone="accent" size={14} weight={700} opacity={step >= 1 ? 1 : 0} delay={250}>
            numbers
          </Label>
          <Arrow from={[225, 140]} to={[246, 140]} tone="faint" width={1.5} drawn={step >= 1} />
          <Arrow from={[270, 140]} to={[288, 140]} tone="faint" width={1.5} drawn={step >= 2} />

          <Box x={340} y={140} w={100} h={120} label="action head" sub="moves" tone="action" filled active={step === 2 || step === 3} radius={14} />

          <Path d="M398 170C408 150 414 108 430 114S446 154 456 126" tone="action" width={3} drawn={step >= 2} opacity={step >= 2 ? 1 : 0} delay={300} />
          <Label x={432} y={196} tone="action" size={14} weight={700} opacity={step >= 2 ? 1 : 0} delay={300}>
            motion
          </Label>

          <Label x={258} y={236} tone="ink" size={14} opacity={step === 3 ? 1 : 0}>
            the same two halves in every model
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
