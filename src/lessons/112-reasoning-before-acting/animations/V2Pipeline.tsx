"use client";

import { AnimationFrame, Arrow, Box, Chip, Label, stagger } from "@/animations";
import { PlantSide, shootTip, type SideShoot } from "./parts";

const PX = 424;
const SHOOTS: SideShoot[] = [
  { y: 326, side: -1, len: 40 },
  { y: 366, side: -1, len: 40 },
  { y: 406, side: -1, len: 40 },
];
const MIDDLE = shootTip(PX, SHOOTS[1]);

const RECORDS = ["highest", "middle", "lowest"];
/** The centre of the eyes and the scene memory, with room for "a record per part" on a phone. */
const EX = 110;

export function V2Pipeline() {
  return (
    <AnimationFrame
      title="Eyes, memory, program, arm"
      description="Version two of the reasoning robot. Trained eyes turn the camera images into one record per part of the plant. A scene memory keeps those records. A language model, left as downloaded, writes the instruction 'cut the second shoot from the top' once as a tiny program, Cut(Rank(2,top)). Code runs the program on the memory and hands the sub-goal 'cut the middle shoot' to the same small fast policy as before, which cuts it; the memory then marks the middle shoot cut."
      steps={[
        "Trained eyes turn the camera images into one record per part.",
        "A scene memory keeps the records, for parts out of view too.",
        "A language model, never retrained, writes the instruction once as a tiny program.",
        "Code runs the program on the memory: second from the top is the middle shoot.",
        "The same fast policy reads the sub-goal and cuts. The memory marks it cut.",
      ]}
      size={[480, 460]}
      hold={[2800, 2600, 3000, 3000, 4200]}
    >
      {(step) => {
        const cut = step >= 4;
        return (
          <>
            {/* Inputs */}
            <Chip x={EX} y={24} text="camera images" tone="vision" mono={false} size={14} />
            <Chip x={330} y={24} text="cut the second shoot from the top" tone="language" mono={false} size={13} />

            {/* 1 eyes */}
            <Arrow from={[EX, 40]} to={[EX, 54]} tone="vision" />
            <Box x={EX} y={78} w={196} h={46} label="eyes" sub="a record per part" tone="vision" active={step === 0} />
            <Arrow from={[EX, 102]} to={[EX, 122]} tone="vision" />

            {/* 2 scene memory */}
            <rect x={12} y={124} width={196} height={112} rx={10} className="t-ink a-fill-soft a-stroke a-t" strokeWidth={step === 1 ? 2.5 : 1.5} />
            <Label x={EX} y={142} tone="ink" size={15} weight={700}>
              scene memory
            </Label>
            {RECORDS.map((part, i) => (
              <g key={part}>
                <Label x={28} y={168 + i * 22} tone="ink" size={13} anchor="start" delay={stagger(i, 160)}>
                  {part}
                </Label>
                <Label
                  x={192}
                  y={168 + i * 22}
                  tone={part === "middle" && cut ? "accent" : "muted"}
                  size={13}
                  anchor="end"
                  weight={part === "middle" && cut ? 700 : 400}
                  delay={stagger(i, 160)}
                >
                  {part === "middle" && cut ? "cut" : "not cut"}
                </Label>
              </g>
            ))}

            {/* 3 program writer */}
            <Arrow from={[330, 38]} to={[330, 54]} tone="language" />
            <Box x={330} y={78} w={210} h={46} label="program writer" sub="never retrained" tone="language" active={step === 2} />
            <Arrow from={[330, 102]} to={[330, 116]} tone="language" drawn={step >= 2} />
            <Chip x={330} y={134} text="Cut(Rank(2,top))" tone="language" variant="solid" size={14} width={190} opacity={step >= 2 ? 1 : 0} />

            {/* 4 plan */}
            <Arrow from={[132, 238]} to={[176, 252]} tone="ink" drawn={step >= 3} />
            <Arrow from={[330, 150]} to={[290, 250]} tone="language" drawn={step >= 3} />
            <Box x={240} y={274} w={250} h={46} label="plan" sub="code runs the program" tone="ink" active={step === 3} />
            <Arrow from={[240, 298]} to={[240, 318]} tone="language" drawn={step >= 3} />
            <Chip x={240} y={334} text="cut the middle shoot" tone="language" variant="solid" mono={false} size={15} opacity={step >= 3 ? 1 : 0} />

            {/* 5 fast level */}
            <Arrow from={[200, 350]} to={[164, 372]} tone="action" drawn={step >= 4} />
            <Box x={150} y={396} w={170} h={46} label="fast policy" sub="unchanged" tone="action" active={step === 4} />
            <Arrow from={[236, 396]} to={[MIDDLE[0] - 12, MIDDLE[1] + 8]} tone="action" bend={-14} drawn={step >= 4} />

            <PlantSide x={PX} base={446} top={300} shoots={SHOOTS.map((s, i) => (i === 1 ? { ...s, tone: "accent", opacity: cut ? 0 : 1, delay: cut ? 900 : 0 } : s))} />
          </>
        );
      }}
    </AnimationFrame>
  );
}
