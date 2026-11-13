"use client";

import { AnimationFrame, Box, Cells, Chip, Label, Path, stagger } from "@/animations";

const BOX_W = 120;
const BOX_H = 62;
const BOX_Y = 168;
const APART = [86, 240, 394];
const JOINED = [120, 240, 360];
const PARTS = [
  { label: "reads words", tone: "language" as const, number: "1" },
  { label: "sees images", tone: "vision" as const, number: "2" },
  { label: "makes moves", tone: "action" as const, number: "3" },
];
const PATCHES = [
  [0.2, 0.6, 0.3],
  [0.5, 0.9, 0.4],
];

export function BuildInOrder() {
  return (
    <AnimationFrame
      title="The course, piece by piece"
      description="The course builds three parts in order: one that reads words, one that sees images, and one that makes moves. At the end the three are joined into one vision-language-action model."
      steps={[
        "First: a part that reads words.",
        "Second: a part that sees images.",
        "Third: a part that turns both into moves.",
        "Then join them: one vision-language-action model.",
      ]}
      size={[480, 280]}
    >
      {(step) => {
        const joined = step >= 3;
        return (
          <>
            {/* What each part works on, above it */}
            <Chip x={APART[0]} y={70} text="red cube" tone="language" size={15} opacity={step >= 0 && !joined ? 1 : 0} />
            <g className="a-t" style={{ opacity: step >= 1 && !joined ? 1 : 0 }}>
              {PATCHES.map((row, index) => (
                <Cells key={index} x={APART[1]} y={60 + index * 22} values={row} tone="vision" cell={19} gap={3} />
              ))}
            </g>
            <Path d={`M${APART[2] - 44} 92C${APART[2] - 20} 40 ${APART[2] + 10} 96 ${APART[2] + 44} 52`} tone="action" width={3} drawn={step >= 2 && !joined} opacity={step >= 2 && !joined ? 1 : 0} />

            {PARTS.map((part, index) => (
              <Box
                key={part.label}
                x={joined ? JOINED[index] : APART[index]}
                y={BOX_Y}
                w={BOX_W}
                h={BOX_H}
                label={part.label}
                sub={`part ${part.number}`}
                tone={part.tone}
                filled
                radius={joined ? 4 : 12}
                opacity={step >= index ? 1 : 0.12}
                active={step === index}
                delay={joined ? stagger(index, 60) : 0}
              />
            ))}

            <rect
              className="a-t t-ink a-stroke"
              x={JOINED[0] - BOX_W / 2 - 8}
              y={BOX_Y - BOX_H / 2 - 8}
              width={JOINED[2] - JOINED[0] + BOX_W + 16}
              height={BOX_H + 16}
              rx={16}
              fill="none"
              strokeWidth={2.5}
              style={{ opacity: joined ? 1 : 0, transitionDelay: joined ? "300ms" : undefined }}
            />
            <Label x={240} y={84} tone="ink" size={17} weight={700} opacity={joined ? 1 : 0} delay={400}>
              one model that sees, reads and acts
            </Label>
            <Label x={240} y={110} tone="muted" size={14} opacity={joined ? 1 : 0} delay={500}>
              a vision-language-action model
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
