"use client";

import { AnimationFrame, Arrow, Box, Chip, Gripper, Label, stagger } from "@/animations";
import { PlantSide, Ring, shootTip, type SideShoot } from "./parts";

const PX = 74;
const SHOOTS: SideShoot[] = [
  { y: 150, side: 1 },
  { y: 200, side: 1 },
  { y: 250, side: 1 },
];
const MIDDLE = shootTip(PX, SHOOTS[1]);
const LOWEST = shootTip(PX, SHOOTS[2]);

/** The note, one field per line (an example in the expert's format). */
const NOTE = [
  ["see", "3 shoots"],
  ["ask", "2nd from the top"],
  ["so", "of 3, the middle"],
  ["aim", "the middle, faces me"],
];
const LINE_Y = [132, 154, 176, 198, 220];
const NEXT_Y = LINE_Y[4];

/** Where the wrist is in each step: resting, at the middle shoot, at the lowest (the swap). */
const WRIST: [number, number][] = [
  [196, 300],
  [196, 300],
  [MIDDLE[0] + 30, MIDDLE[1]],
  [LOWEST[0] + 30, LOWEST[1]],
  [LOWEST[0] + 30, LOWEST[1]],
];

export function NoteSwap() {
  return (
    <AnimationFrame
      title="The note decides the cut"
      description="A reasoner that reads pictures and words looks at a plant with three shoots and the instruction 'cut the second shoot from the top'. It writes a five-line note: see 3 shoots, ask the second from the top, so the middle, aim the middle, next cut the middle shoot. A small fast policy reads only the next line and cuts the middle shoot. In the swap test the next line is replaced by another shoot's, and the arm goes to that shoot: with swapped notes it solved 5 of 200 and cut the shoot the note named in half the tries."
      steps={[
        "A reasoner reads the camera picture and the instruction.",
        "It writes a short note: what it sees, the question, the answer, the aim, the next step.",
        "A small fast policy reads only the last line, and cuts that shoot.",
        "Swap test: the last line now names another shoot. The arm follows the note.",
        "With swapped notes: 5 of 200 solved, and the note's shoot cut in half the tries.",
      ]}
      size={[480, 352]}
      hold={[2200, 3200, 2800, 3000, 4200]}
    >
      {(step) => {
        const [wx, wy] = WRIST[step];
        const swapped = step >= 3;
        return (
          <>
            <Chip x={240} y={22} text="cut the second shoot from the top" tone="language" mono={false} size={14} />

            <PlantSide x={PX} base={318} top={96} shoots={SHOOTS.map((s, i) => ({ ...s, tone: i === 1 && step === 2 ? "accent" : "ink" }))} />
            <Ring x={MIDDLE[0]} y={MIDDLE[1]} r={13} tone="accent" opacity={step === 2 ? 1 : 0} />
            <Ring x={LOWEST[0]} y={LOWEST[1]} r={13} tone="failure" opacity={swapped ? 1 : 0} />

            {/* The slow level */}
            <Box x={334} y={62} w={230} h={40} label="reasoner" sub="looks and reads" tone="language" active={step === 0} />

            {/* The note */}
            <rect x={210} y={92} width={248} height={140} rx={10} className="t-language a-fill-soft a-stroke a-t" strokeWidth={1.5} style={{ opacity: step >= 1 ? 1 : 0.35 }} />
            <rect
              x={214}
              y={NEXT_Y - 11}
              width={240}
              height={22}
              rx={5}
              className={`${swapped ? "t-failure" : "t-mark"} a-fill-soft a-t`}
              style={{ opacity: step >= 2 ? 1 : 0 }}
            />
            <Label x={222} y={108} tone="muted" size={13} anchor="start" opacity={step >= 1 ? 1 : 0}>
              note (an example)
            </Label>
            <Label x={446} y={108} tone="failure" size={13} anchor="end" weight={700} opacity={swapped ? 1 : 0}>
              swap test
            </Label>
            {NOTE.map(([field, value], i) => (
              <g key={field}>
                <Label x={222} y={LINE_Y[i]} tone="muted" size={14} anchor="start" weight={700} opacity={step >= 1 ? 1 : 0} delay={stagger(i, 220)}>
                  {field}
                </Label>
                <Label x={268} y={LINE_Y[i]} tone="ink" size={14} anchor="start" opacity={step >= 1 ? 1 : 0} delay={stagger(i, 220)}>
                  {value}
                </Label>
              </g>
            ))}
            <Label x={222} y={NEXT_Y} tone="ink" size={14} anchor="start" weight={700} opacity={step >= 1 ? 1 : 0} delay={stagger(4, 220)}>
              next
            </Label>
            <Label x={268} y={NEXT_Y} tone="ink" size={14} anchor="start" weight={700} opacity={step >= 1 && !swapped ? 1 : 0} delay={step === 1 ? stagger(4, 220) : 0}>
              cut the middle shoot
            </Label>
            <Label x={268} y={NEXT_Y} tone="failure" size={14} anchor="start" weight={700} opacity={swapped ? 1 : 0}>
              cut the lowest shoot
            </Label>

            {/* The fast level reads only the last line */}
            <Arrow from={[334, 236]} to={[334, 250]} tone="ink" drawn={step >= 2} />
            <Box x={334} y={272} w={170} h={40} label="fast policy" tone="action" active={step >= 2 && step <= 3} />
            <Gripper x={wx} y={wy} angle={90} open={step >= 2 ? 0.3 : 1} tone="action" size={0.8} />

            {/* What the swap test measured */}
            <Label x={334} y={316} tone="ink" size={14} weight={700} opacity={step >= 4 ? 1 : 0}>
              swapped: 5 of 200 solved
            </Label>
            <Label x={334} y={338} tone="failure" size={14} opacity={step >= 4 ? 1 : 0} delay={150}>
              the note’s shoot cut in half
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
