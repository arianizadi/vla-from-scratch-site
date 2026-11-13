"use client";

import { AnimationFrame, Arrow, Chip, Label, Path, stagger } from "@/animations";

const ROW = 210;
const TOP = ROW - 22;
const TOKENS = [
  { text: "img", x: 36, kind: "vision" as const },
  { text: "img", x: 82, kind: "vision" as const },
  { text: "img", x: 128, kind: "vision" as const },
  { text: "img", x: 174, kind: "vision" as const },
  { text: "pick", x: 236, kind: "language" as const },
  { text: "up", x: 290, kind: "language" as const },
  { text: "red", x: 338, kind: "language" as const },
  { text: "cube", x: 398, kind: "language" as const },
];
/** Which token looks back in each step (none in step 0). */
const FOCUS = [-1, 2, 6, 7];

const arc = (from: number, to: number) => {
  const x1 = TOKENS[from].x;
  const x2 = TOKENS[to].x;
  const h = 36 + Math.abs(x1 - x2) * 0.5;
  return `M${x1} ${TOP}Q${(x1 + x2) / 2} ${TOP - h} ${x2} ${TOP}`;
};

export function LookBack() {
  return (
    <AnimationFrame
      title="Each token looks back"
      description="The language model reads left to right, and each token can look only at itself and the tokens before it. The picture comes first, so a picture token can look back over the picture but cannot see the instruction after it. A word token looks back over the whole picture. The last token sees everything, which makes it a good place to collect a summary for the robot."
      steps={[
        "The model reads left to right. Each token sees only what came before it.",
        "A picture token looks back at the picture. The words lie ahead, unseen.",
        "A word token looks back over the whole picture.",
        "The last token sees everything: a good place to collect a summary for the robot.",
      ]}
      size={[480, 270]}
    >
      {(step) => {
        const focus = FOCUS[step];
        return (
          <>
            <Arrow from={[30, 44]} to={[440, 44]} tone="faint" />
            <Label x={235} y={26} tone="muted" size={14}>
              reading order
            </Label>

            {TOKENS.map((token, i) => (
              <Chip key={i} x={token.x} y={ROW} text={token.text} tone={token.kind} variant={token.kind === "vision" ? "solid" : "soft"} size={14} active={i === focus} />
            ))}

            {TOKENS.flatMap((_, from) =>
              TOKENS.slice(0, from).map((__, to) => {
                const on = from === focus;
                return (
                  <Path key={`${from}-${to}`} d={arc(from, to)} tone="accent" width={1.5} drawn={on} opacity={on ? 1 : 0} delay={on ? stagger(from - to - 1, 80) : 0} />
                );
              }),
            )}

            <Path d={`M${TOKENS[2].x + 22} ${ROW + 32}H${TOKENS[6].x}`} tone="failure" width={1.5} dashed drawn={step === 1} />
            <Label x={TOKENS[5].x} y={ROW + 48} tone="failure" size={14} weight={700} opacity={step === 1 ? 1 : 0}>
              cannot see the words
            </Label>
            <Label x={TOKENS[7].x} y={ROW + 44} tone="accent" size={14} weight={700} opacity={step === 3 ? 1 : 0}>
              sees it all
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
