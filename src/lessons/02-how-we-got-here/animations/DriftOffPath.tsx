"use client";

import { AnimationFrame, Dot, Label, Line, Path } from "@/animations";

/** The expert's path seen from above: a smooth bend from bottom left to top right. */
function expertY(x: number): number {
  const t = Math.min(1, Math.max(0, (x - 30) / 420));
  return 206 - 130 * (t * t * (3 - 2 * t));
}

/** The copier's error: none at first, then growing faster once it is off the path (a toy shape). */
function copyY(x: number): number {
  const err = x <= 110 ? 0 : ((x - 110) / 220) ** 2 * 62;
  return expertY(x) + err;
}

function points(f: (x: number) => number, from: number, to: number): [number, number][] {
  const out: [number, number][] = [];
  for (let x = from; x <= to; x += 10) out.push([x, Math.round(f(x) * 10) / 10]);
  return out;
}

const EXPERT = points(expertY, 30, 450);
const ROAD = `M${EXPERT.map(([x, y]) => `${x} ${y}`).join("L")}`;
const COPY_A = points(copyY, 30, 210);
const COPY_B = points(copyY, 210, 330);
const BACK: [number, number][] = [
  [330, copyY(330)],
  [360, copyY(330) - 18],
  [395, expertY(395) + 8],
  [440, expertY(440)],
];

export function DriftOffPath() {
  return (
    <AnimationFrame
      title="Small slips grow"
      description="Seen from above, an expert drives a smooth bend. A copier trained on the expert's path starts close but slightly off. Off the path it is somewhere no example showed, so its next mistakes are bigger and it leaves the road. Examples that show how to steer back pull it onto the path again."
      steps={[
        "An expert drives the bend. A copier learns from its path.",
        "The copy starts close, but a little off.",
        "Off the path, it sees places no example showed. The slips get bigger.",
        "Fix: add examples that show how to get back on the path.",
      ]}
      size={[480, 280]}
    >
      {(step) => {
        const car = step === 0 ? COPY_A[0] : step === 1 ? COPY_A[COPY_A.length - 1] : step === 2 ? COPY_B[COPY_B.length - 1] : BACK[BACK.length - 1];
        return (
          <>
            <Path d={ROAD} tone="faint" width={44} opacity={0.22} />
            <Path d={ROAD} tone="ink" width={2} dashed />
            <Label x={384} y={46} tone="ink" size={14} weight={700}>
              {"expert's path"}
            </Label>

            <Line points={COPY_A} tone="accent" width={3} drawn={step >= 1} />
            <Line points={COPY_B} tone="accent" width={3} drawn={step >= 2} />
            <Label x={330} y={200} tone="failure" size={14} weight={700} opacity={step === 2 ? 1 : 0}>
              no example showed this place
            </Label>
            <Line points={BACK} tone="success" width={3} drawn={step >= 3} />
            <Label x={350} y={200} tone="success" size={14} weight={700} opacity={step === 3 ? 1 : 0}>
              recovery examples pull it back
            </Label>

            <Dot x={car[0]} y={car[1]} r={8} tone="accent" />
            <Label x={110} y={248} tone="accent" size={14} weight={700} opacity={step >= 1 ? 1 : 0}>
              the copier
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
