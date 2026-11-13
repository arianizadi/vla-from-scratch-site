"use client";

import { AnimationFrame, Arrow, Box, Chip, Label } from "@/animations";

const CX = 330;

export function ThreeStages() {
  return (
    <AnimationFrame
      title="Three stages, each inside the next"
      description="Stage 1 trains a word reader on web text: it learns to read. Stage 2 adds eyes to it and trains on pictures of the robot's scenes with captions: it learns to describe what it sees. Stage 3 adds a mover and trains on demonstrations: it learns to act. Each stage starts from everything the stage before learned."
      steps={[
        "Stage 1: a word reader studies web text. It learns to read.",
        "Stage 2: add eyes, train on captioned scenes. It learns to describe what it sees.",
        "Stage 3: add a mover, train on demonstrations. It learns to act.",
        "Each stage starts from everything the one before learned.",
      ]}
      size={[480, 300]}
    >
      {(step) => (
        <>
          <rect className="a-t t-action a-stroke" x={196} y={12} width={272} height={276} rx={16} fill="none" strokeWidth={1.5} style={{ opacity: step >= 2 ? 1 : 0 }} />
          <Label x={210} y={32} tone="action" size={14} weight={700} anchor="start" opacity={step >= 2 ? 1 : 0}>
            stage 3: learn to act
          </Label>
          <Box x={CX} y={70} w={226} h={38} label="mover" tone="action" filled opacity={step >= 2 ? 1 : 0} active={step === 2} />

          <rect className="a-t t-vision a-stroke" x={208} y={104} width={248} height={172} rx={12} fill="none" strokeWidth={1.5} style={{ opacity: step >= 1 ? 1 : 0 }} />
          <Label x={222} y={124} tone="vision" size={14} weight={700} anchor="start" opacity={step >= 1 ? 1 : 0}>
            stage 2: learn to see
          </Label>
          <Box x={CX} y={164} w={210} h={36} label="eyes" tone="vision" filled opacity={step >= 1 ? 1 : 0} active={step === 1} />

          <Box x={CX} y={234} w={210} h={44} label="word reader" sub="stage 1: learn to read" tone="language" filled active={step === 0} />

          <Chip x={92} y={234} text="web text" tone="language" size={14} mono={false} />
          <Chip x={92} y={164} text="captioned scenes" tone="vision" size={13} mono={false} opacity={step >= 1 ? 1 : 0} />
          <Chip x={92} y={70} text="demonstrations" tone="action" size={14} mono={false} opacity={step >= 2 ? 1 : 0} />

          <Arrow from={[132, 234]} to={[222, 234]} tone="language" drawn width={1.5} flow={step === 0} />
          <Arrow from={[160, 164]} to={[222, 164]} tone="vision" drawn={step >= 1} width={1.5} flow={step === 1} />
          <Arrow from={[156, 70]} to={[214, 70]} tone="action" drawn={step >= 2} width={1.5} flow={step === 2} />

          <Label x={92} y={106} tone="ink" size={14} weight={700} opacity={step === 3 ? 1 : 0}>
            each stage
          </Label>
          <Label x={92} y={126} tone="ink" size={14} weight={700} opacity={step === 3 ? 1 : 0}>
            keeps the last
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
