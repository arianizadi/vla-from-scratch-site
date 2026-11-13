"use client";

import { AnimationFrame, Box, Dot, Label, Path } from "@/animations";

const MEET: [number, number] = [372, 148];
const BEND = 300;

const LANES = [
  { name: "reading", tone: "language" as const, y: 64, start: 150, mark: 196, year: "2017", what: "attention", from: 1 },
  { name: "seeing", tone: "vision" as const, y: 148, start: 150, mark: 236, year: "2020", what: "patches", from: 2 },
  { name: "doing", tone: "action" as const, y: 232, start: 30, mark: 84, year: "1988", what: "copy a driver", from: 0 },
];

function lane(y: number, start: number): string {
  return `M${start} ${y}H${BEND - 40}C${BEND} ${y} ${MEET[0] - 40} ${MEET[1]} ${MEET[0]} ${MEET[1]}`;
}

export function ThreeLinesMeet() {
  return (
    <AnimationFrame
      title="Three lines of work meet"
      description="Robots learning by copying started in 1988 with a van that learned to steer from a driver. Language models gained attention in 2017, and vision models began reading pictures as patches in 2020. Around 2023 the three met: one model that sees, reads and acts, a vision-language-action model."
      steps={[
        "Doing: in 1988 a van learned to steer by copying a driver.",
        "Reading: in 2017 attention made big text models practical.",
        "Seeing: in 2020 pictures became rows of patches.",
        "Around 2023 the three meet: one model that sees, reads and acts.",
      ]}
      size={[480, 280]}
    >
      {(step) => (
        <>
          {LANES.map((item) => (
            <g key={item.name}>
              <Path d={lane(item.y, item.start)} tone={item.tone} width={3} drawn={step >= item.from} opacity={step >= item.from ? 1 : 0} />
              <Label x={item.start} y={item.y - 20} tone={item.tone} size={14} weight={700} anchor="start" opacity={step >= item.from ? 1 : 0}>
                {item.name}
              </Label>
              <Dot x={item.mark} y={item.y} r={6} tone={item.tone} opacity={step >= item.from ? 1 : 0} delay={300} />
              <Label x={item.mark} y={item.y + 22} tone="muted" size={13} opacity={step >= item.from ? 1 : 0} delay={300}>
                {`${item.year} · ${item.what}`}
              </Label>
            </g>
          ))}
          <Path d={`M${MEET[0]} ${MEET[1]}H452`} tone="ink" width={5} drawn={step >= 3} opacity={step >= 3 ? 1 : 0} delay={400} />
          <Box x={414} y={MEET[1] - 46} w={92} h={44} label="VLA" sub="2023" tone="ink" active={step >= 3} opacity={step >= 3 ? 1 : 0} delay={500} />
          <Label x={412} y={MEET[1] + 30} tone="ink" size={13} opacity={step >= 3 ? 1 : 0} delay={600}>
            sees, reads, acts
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
