"use client";

import { AnimationFrame, Arrow, Box, Cells, Chip, Label, Move, stagger } from "@/animations";

const TOP = 72;
const ROW = 184;
const SHADES = [0.3, 0.7, 0.5, 0.9, 0.6, 0.35, 0.8, 0.45, 0.55];

/** The final row: four picture tokens, then the words. */
const PICTURE = [34, 80, 126, 172];
const WORDS = [
  { text: "pick", x: 232 },
  { text: "up", x: 290 },
  { text: "the", x: 340 },
  { text: "cube", x: 402 },
];

export function ThreeParts() {
  return (
    <AnimationFrame
      title="Three parts, one row"
      description="A picture goes into the vision encoder, which makes one token per patch. The projector, a small learned translator, reshapes each of those tokens to the size of a word token. The instruction's words become word tokens as usual. Picture tokens and word tokens then form one row, which the language model reads."
      steps={[
        "The vision encoder turns the picture into one token per patch.",
        "The projector, a small translator, reshapes each token to word size.",
        "The instruction's words become word tokens, as always.",
        "Picture and words form one row for the language model.",
      ]}
      size={[480, 290]}
    >
      {(step) => (
        <>
          <g className="t-vision">
            {SHADES.map((shade, i) => (
              <rect key={i} x={20 + (i % 3) * 16} y={TOP - 24 + Math.floor(i / 3) * 16} width={15} height={15} rx={2} className="a-fill" style={{ fillOpacity: shade }} />
            ))}
          </g>
          <Label x={44} y={TOP + 40} tone="vision" size={13}>
            picture
          </Label>
          <Arrow from={[74, TOP]} to={[100, TOP]} tone="faint" />
          <Box x={146} y={TOP} w={84} h={48} label="encoder" tone="vision" active={step === 0} />
          <Arrow from={[190, TOP]} to={[212, TOP]} tone="faint" />
          <Cells x={240} y={TOP} values={[0.8, 0.4, 0.9]} tone="vision" cell={12} gap={3} />
          <Label x={240} y={TOP + 26} tone="muted" size={13}>
            patch token
          </Label>
          <Arrow from={[268, TOP]} to={[290, TOP]} tone="faint" drawn={step >= 1} opacity={step >= 1 ? 1 : 0} />
          <Box x={340} y={TOP} w={92} h={48} label="projector" tone="ink" active={step === 1} opacity={step >= 1 ? 1 : 0.35} />
          <Arrow from={[388, TOP]} to={[404, TOP]} tone="faint" drawn={step >= 1} opacity={step >= 1 ? 1 : 0} />
          <Cells x={436} y={TOP} values={[0.8, 0.4, 0.9, 0.3, 0.6]} tone="vision" cell={9} gap={2} opacity={step >= 1 ? 1 : 0} />
          <Label x={430} y={TOP + 26} tone="muted" size={13} opacity={step >= 1 ? 1 : 0}>
            word-sized
          </Label>

          {PICTURE.map((x, i) => (
            <Move key={`p-${x}`} x={step >= 3 ? x : 436} y={step >= 3 ? ROW : TOP} opacity={step >= 3 ? 1 : 0} delay={step >= 3 ? stagger(i, 90) : 0}>
              <Chip x={0} y={0} text="img" tone="vision" variant="solid" size={14} />
            </Move>
          ))}
          {WORDS.map((word, i) => (
            <Chip key={word.text} x={word.x} y={ROW} text={word.text} tone="language" size={14} opacity={step >= 2 ? 1 : 0} delay={stagger(i)} />
          ))}
          <Label x={300} y={ROW - 34} tone="language" size={13} opacity={step === 2 ? 1 : 0}>
            the instruction
          </Label>

          <Arrow from={[240, ROW + 22]} to={[240, ROW + 44]} tone="faint" drawn={step >= 3} opacity={step >= 3 ? 1 : 0} />
          <Box x={240} y={ROW + 72} w={300} h={44} label="language model" tone="ink" active={step === 3} opacity={step >= 3 ? 1 : 0.35} />
        </>
      )}
    </AnimationFrame>
  );
}
