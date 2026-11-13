"use client";

import { AnimationFrame, Arrow, Box, Cells, Chip, Label } from "@/animations";

const HANDED = [0.7, 0.3, 0.9, 0.5, 0.2, 0.8, 0.4, 0.6];
const ACTIONS = [0.6, 0.3, 0.8, 0.4];

export function ModelParts() {
  return (
    <AnimationFrame
      title="The parts of a policy"
      description="The backbone reads the camera picture and the instruction. What it hands down, the conditioning, is a set of numbers. The action head reads the conditioning and turns it into actions."
      steps={[
        "The backbone reads the picture and the words.",
        "What it hands down is called the conditioning: numbers that sum up the scene.",
        "The action head turns the conditioning into actions.",
      ]}
      size={[480, 280]}
    >
      {(step) => (
        <>
          <g className="a-t">
            <rect className="t-vision a-fill-soft a-stroke" x={150} y={18} width={64} height={42} rx={6} strokeWidth={1.5} />
            <rect className="t-action a-fill" x={188} y={34} width={12} height={12} rx={2} />
          </g>
          <Chip x={300} y={39} text="red cube" tone="language" size={14} />
          <Arrow from={[182, 62]} to={[200, 84]} tone="vision" width={1.5} />
          <Arrow from={[300, 58]} to={[282, 84]} tone="language" width={1.5} />

          <Box x={240} y={110} w={260} h={48} label="backbone" sub="reads picture and words" tone="ink" active={step === 0} radius={12} />

          <Arrow from={[240, 136]} to={[240, 150]} tone="faint" width={1.5} drawn={step >= 1} />
          <Cells x={240} y={164} values={HANDED} tone="accent" cell={13} gap={3} opacity={step >= 1 ? 1 : 0} />
          <Label x={318} y={164} tone="accent" size={14} weight={700} anchor="start" opacity={step >= 1 ? 1 : 0}>
            conditioning
          </Label>
          <Arrow from={[240, 174]} to={[240, 192]} tone="faint" width={1.5} drawn={step >= 2} />

          <Box x={240} y={220} w={200} h={48} label="action head" sub="makes the actions" tone="action" filled active={step === 2} radius={12} />
          <Arrow from={[342, 220]} to={[378, 220]} tone="action" width={2} drawn={step >= 2} delay={200} />
          <Cells x={412} y={220} values={ACTIONS} tone="action" cell={13} gap={3} opacity={step >= 2 ? 1 : 0} delay={400} />
          <Label x={412} y={246} tone="action" size={13} weight={700} opacity={step >= 2 ? 1 : 0} delay={400}>
            actions
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
