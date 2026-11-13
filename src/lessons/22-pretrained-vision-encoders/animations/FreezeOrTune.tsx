"use client";

import { AnimationFrame, Arrow, Box, Cells, Label } from "@/animations";

const ROW = 104;
const BACK = 170;
const ENC = 156;
const ROBOT = 306;
const GRADE = 424;

const KNOWS = [0.9, 0.8, 0.95, 0.85, 0.9, 0.75, 0.9, 0.85];
const WORN = [0.9, 0.3, 0.95, 0.2, 0.85, 0.25, 0.9, 0.3];

export function FreezeOrTune() {
  return (
    <AnimationFrame
      title="Frozen or still learning"
      description="During robot training, corrections flow backwards from the grade through the model. If the pretrained encoder is frozen, the corrections stop before it and what it learned stays intact. If it is fine-tuned, the corrections reach it and it can adapt to the robot's scenes, but a few thousand robot examples can also wear away some of what it knew."
      steps={[
        "Robot training sends corrections backwards through the model.",
        "Frozen: the corrections stop at the encoder. What it knows stays intact.",
        "Fine-tuned: the corrections reach it, so it can adapt to the robot's scenes.",
        "But a few thousand robot examples can also wear away what it knew.",
      ]}
      size={[480, 280]}
    >
      {(step) => {
        const frozen = step === 1;
        const reaches = step >= 2;
        return (
          <>
            <rect x={18} y={ROW - 20} width={48} height={40} rx={6} className="t-vision a-fill-soft a-stroke" strokeWidth={1.5} />
            <Label x={42} y={ROW + 36} tone="vision" size={13}>
              picture
            </Label>
            <Arrow from={[70, ROW]} to={[ENC - 62, ROW]} tone="faint" />
            <Box x={ENC} y={ROW} w={116} h={56} label="encoder" sub={frozen ? "frozen" : "pretrained"} tone="vision" filled active={reaches} />
            <Arrow from={[ENC + 60, ROW]} to={[ROBOT - 52, ROW]} tone="faint" />
            <Box x={ROBOT} y={ROW} w={96} h={56} label="robot part" tone="ink" active={step === 0} />
            <Arrow from={[ROBOT + 50, ROW]} to={[GRADE - 38, ROW]} tone="faint" />
            <Box x={GRADE} y={ROW} w={72} h={56} label="grade" tone="ink" />

            <Arrow from={[GRADE, BACK - 30]} to={[ROBOT + 40, BACK]} bend={-10} tone="accent" drawn flow />
            <Arrow from={[ROBOT - 40, BACK]} to={[ENC + 48, BACK]} tone="accent" drawn={reaches} opacity={reaches ? 1 : 0} flow={reaches} />
            <Label x={ROBOT} y={BACK} tone="accent" size={14} weight={700}>
              fix
            </Label>
            <Label x={ENC + 76} y={BACK} tone="failure" size={20} weight={700} opacity={frozen ? 1 : 0}>
              ×
            </Label>

            <g className="a-t t-ink" style={{ opacity: frozen ? 1 : 0 }}>
              <rect x={ENC - 11} y={ROW - 62} width={22} height={17} rx={3} className="a-fill" />
              <path d={`M${ENC - 7} ${ROW - 62}v-6a7 7 0 0 1 14 0v6`} className="a-stroke" strokeWidth={2.5} fill="none" />
            </g>

            <Cells x={ENC} y={222} values={step === 3 ? WORN : KNOWS} tone="vision" cell={12} gap={3} />
            <Label x={ENC} y={248} tone="muted" size={13} opacity={step === 3 ? 0 : 1}>
              what it learned
            </Label>
            <Label x={ENC} y={248} tone="failure" size={13} weight={700} opacity={step === 3 ? 1 : 0}>
              some of it fades
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
