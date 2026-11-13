"use client";

import { Arrow, AnimationFrame, Box, Chip, Label } from "@/animations";

const ROW_Y = 178;
const WORD_X = [40, 93, 146, 199, 252];
const WORDS_A = ["pick", "up", "the", "red", "cube"];
const WORDS_B = ["pick", "up", "the", "green", "can"];
const TILE_X = [312, 339, 366, 393, 420, 447];
const TILE = 24;
const CUBE_TILE = 1;
const CAN_TILE = 4;
const HEAD: [number, number] = [240, 58];

export function WordsMeetPictures() {
  return (
    <AnimationFrame
      title="Words say which, pictures say where"
      description="The sentence pick up the red cube becomes five word tokens, and the camera image becomes patch tokens, all in one row. The action head joins the word cube, which says which object, with the patch that shows the cube, which says where. Changing two words to green can changes two tokens, and now the patch that shows the can matters instead."
      steps={[
        "Word tokens and patch tokens sit side by side in one row.",
        "The word “cube” says which object.",
        "The patch that shows the cube says where. The action head joins the two.",
        "Change two words to “green can”: two tokens change, and another patch matters.",
      ]}
      size={[480, 250]}
    >
      {(step) => {
        const b = step >= 3;
        const words = b ? WORDS_B : WORDS_A;
        const tile = b ? CAN_TILE : CUBE_TILE;
        return (
          <>
            <Box x={HEAD[0]} y={HEAD[1]} w={180} h={44} label="action head" tone="accent" active={step >= 2} />
            {words.map((word, i) => (
              <Chip
                key={i}
                x={WORD_X[i]}
                y={ROW_Y}
                text={word}
                tone="language"
                size={14}
                width={50}
                variant={b && i >= 3 ? "solid" : "soft"}
                active={(step === 1 || step === 2) && i === 4}
              />
            ))}
            {TILE_X.map((x, i) => (
              <g key={x}>
                <rect x={x - TILE / 2} y={ROW_Y - TILE / 2} width={TILE} height={TILE} rx={4} className="t-vision a-fill-soft a-stroke" strokeWidth={1.5} />
                {i === CUBE_TILE ? <rect x={x - 6} y={ROW_Y - 6} width={12} height={12} rx={2} className="t-action a-fill" /> : null}
                {i === CAN_TILE ? <rect x={x - 5} y={ROW_Y - 7} width={10} height={14} rx={4} className="t-action a-fill" /> : null}
                <rect
                  x={x - TILE / 2 - 4}
                  y={ROW_Y - TILE / 2 - 4}
                  width={TILE + 8}
                  height={TILE + 8}
                  rx={7}
                  className="a-t t-mark a-stroke"
                  fill="none"
                  strokeWidth={3}
                  style={{ opacity: step >= 2 && i === tile ? 1 : 0 }}
                />
              </g>
            ))}
            <Label x={153} y={ROW_Y + 36} tone="language" size={14} weight={700}>
              words
            </Label>
            <Label x={380} y={ROW_Y + 36} tone="vision" size={14} weight={700}>
              patches
            </Label>

            <Arrow from={[WORD_X[4], ROW_Y - 24]} to={[HEAD[0] - 10, HEAD[1] + 26]} tone="language" width={2.5} drawn={step >= 2 && !b} opacity={step >= 2 && !b ? 1 : 0} />
            <Arrow from={[TILE_X[CUBE_TILE], ROW_Y - 20]} to={[HEAD[0] + 14, HEAD[1] + 26]} tone="vision" width={2.5} drawn={step === 2} opacity={step === 2 ? 1 : 0} delay={200} />
            <Arrow from={[WORD_X[4], ROW_Y - 24]} to={[HEAD[0] - 10, HEAD[1] + 26]} tone="language" width={2.5} drawn={b} opacity={b ? 1 : 0} delay={300} />
            <Arrow from={[TILE_X[CAN_TILE], ROW_Y - 20]} to={[HEAD[0] + 30, HEAD[1] + 26]} tone="vision" width={2.5} drawn={b} opacity={b ? 1 : 0} delay={500} />
            <Label x={HEAD[0] + 110} y={HEAD[1] - 6} tone="ink" size={14} anchor="start" weight={700} opacity={step >= 2 ? 1 : 0} delay={400}>
              {b ? "→ the can" : "→ the cube"}
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
