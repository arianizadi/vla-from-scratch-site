"use client";

import { AnimationFrame, Arrow, Box, Cells, Chip, Label, Path } from "@/animations";

const PICTURE = Array.from({ length: 16 }, (_, i) => [(i % 4) * 10, Math.floor(i / 4) * 10]);
/** The notes the backbone hands on: noise when blank, a clear pattern when it already knows the scenes. */
const BLANK = [0.35, 0.6, 0.2, 0.5, 0.4, 0.3, 0.55, 0.25];
const KNOWS = [0.95, 0.15, 0.9, 0.1, 0.85, 0.2, 0.9, 0.15];

export function BackboneHead() {
  return (
    <AnimationFrame
      title="Two parts: a backbone and an action head"
      description="A camera picture and the words pick up the green can go into the backbone, which turns them into notes, a row of numbers. The action head turns the notes into the arm's motion. The backbone can start blank, with random notes, or pretrained: already taught to describe these scenes, so its notes carry meaning from the start."
      steps={[
        "A camera picture and an instruction come in.",
        "The backbone turns them into notes: a row of numbers.",
        "The action head turns the notes into the arm's next moves.",
        "A blank backbone starts with random notes. A pretrained one already describes these scenes.",
      ]}
      size={[480, 280]}
      hold={[2200, 2400, 2400, 3800]}
    >
      {(step) => {
        const pretrained = step === 3;
        return (
          <>
            <g transform="translate(26 54)">
              {PICTURE.map(([px, py], i) => (
                <rect key={i} x={px} y={py} width={9} height={9} rx={1.5} className="t-vision a-fill" style={{ fillOpacity: 0.3 + ((i * 7) % 5) * 0.14 }} />
              ))}
            </g>
            <Label x={46} y={112} tone="vision" size={13}>
              picture
            </Label>
            <Chip x={100} y={214} text="pick up the green can" tone="language" size={13} mono={false} />
            <Arrow from={[88, 74]} to={[130, 110]} tone="vision" width={1.5} />
            <Arrow from={[150, 198]} to={[172, 162]} tone="language" width={1.5} />

            <Box x={196} y={124} w={92} h={64} label="backbone" sub={pretrained ? "pretrained" : "blank"} tone="ink" active={step === 1 || pretrained} />
            <Arrow from={[244, 124]} to={[268, 124]} tone="muted" width={1.5} drawn={step >= 1} />
            <Cells x={312} y={124} values={pretrained ? KNOWS : BLANK} tone="accent" cell={9} gap={2} opacity={step >= 1 ? 1 : 0} />
            <Label x={312} y={104} tone="accent" size={13} opacity={step >= 1 ? 1 : 0}>
              notes
            </Label>
            <Arrow from={[312, 136]} to={[312, 168]} tone="muted" width={1.5} drawn={step >= 2} />
            <Box x={312} y={196} w={110} h={46} label="action head" tone="ink" active={step === 2} opacity={step >= 2 ? 1 : 0} />
            <Path d="M372 196 C 400 196, 410 160, 446 150" tone="action" width={3} drawn={step >= 2} />
            <Label x={420} y={210} tone="action" size={13} opacity={step >= 2 ? 1 : 0}>
              arm moves
            </Label>

            <Label x={196} y={44} tone={pretrained ? "accent" : "muted"} size={14} weight={700} opacity={step === 3 ? 1 : 0}>
              already knows these scenes
            </Label>
            <Label x={300} y={258} tone="muted" size={13} opacity={step === 3 ? 1 : 0}>
              (blank: the same model with random numbers)
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
