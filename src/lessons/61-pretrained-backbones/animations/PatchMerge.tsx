"use client";

import { AnimationFrame, Label, Path } from "@/animations";

/** A 224 x 224 frame drawn 168 units wide: 16 px patches are 12 units, merged 32 px tokens 24. */
const LEFT = 30;
const TOP = 52;
const SIDE = 168;
/** The same frame scaled up to 256 x 256 by the default size bounds. */
const BIG = (SIDE * 256) / 224;

function grid(count: number, side: number): string {
  const cell = side / count;
  let d = "";
  for (let i = 1; i < count; i += 1) {
    const o = Math.round(i * cell * 10) / 10;
    d += `M${LEFT + o} ${TOP}v${Math.round(side * 10) / 10}M${LEFT} ${TOP + o}h${Math.round(side * 10) / 10}`;
  }
  return d;
}

const NUMBERS = [
  { big: "224", unit: "pixels a side", detail: "one camera picture" },
  { big: "196", unit: "small squares", detail: "14 × 14" },
  { big: "49", unit: "tokens", detail: "each 2 × 2 block merged" },
  { big: "64", unit: "tokens", detail: "a picture 256 pixels a side" },
  { big: "196", unit: "tokens every look", detail: "4 pictures × 49" },
];

export function PatchMerge() {
  return (
    <AnimationFrame
      title="A picture becomes tokens"
      description="A camera picture 224 pixels a side is cut into small squares, 14 by 14, which is 196. Each 2 by 2 block of squares is merged into one token: 49 tokens per picture. A picture 256 pixels a side would give 64. The robot looks at four pictures each time, so the reader reads 196 picture tokens every time it looks."
      steps={[
        "One camera picture, 224 pixels a side.",
        "The reader cuts it into small squares: 14 × 14 = 196.",
        "Each 2 × 2 block merges into one token: 49 per picture.",
        "A slightly bigger picture, 256 a side, would cost 64 tokens.",
        "Four pictures each time the robot looks: 196 tokens to read, every time.",
      ]}
      size={[480, 290]}
    >
      {(step) => {
        const numbers = NUMBERS[step];
        return (
          <>
            <rect
              className="a-t t-faint a-stroke"
              x={LEFT}
              y={TOP}
              width={Math.round(BIG * 10) / 10}
              height={Math.round(BIG * 10) / 10}
              rx={4}
              fill="none"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              style={{ opacity: step === 3 ? 1 : 0 }}
            />
            <rect className="a-t t-vision a-fill-soft a-stroke" x={LEFT} y={TOP} width={SIDE} height={SIDE} rx={4} strokeWidth={2} />
            {/* what the camera sees: the table and three objects */}
            <path className="t-faint a-stroke" d={`M${LEFT + 6} ${TOP + 128}H${LEFT + SIDE - 6}`} strokeWidth={2} fill="none" />
            <rect className="t-action a-fill-soft a-stroke" x={LEFT + 30} y={TOP + 102} width={26} height={26} rx={3} strokeWidth={2} />
            <rect className="t-ink a-fill-soft a-stroke" x={LEFT + 78} y={TOP + 96} width={20} height={32} rx={7} strokeWidth={2} />
            <path className="t-ink a-fill-soft a-stroke" d={`M${LEFT + 118} ${TOP + 116}l6 -11h14l6 11l-6 11h-14z`} strokeWidth={2} strokeLinejoin="round" />
            <Path d={grid(14, SIDE)} tone="vision" width={1} drawn={step === 1} opacity={step === 1 ? 0.7 : 0} />
            <Path d={grid(7, SIDE)} tone="vision" width={2} drawn={step === 2 || step === 4} opacity={step === 2 || step === 4 ? 1 : 0} />
            <Path d={grid(8, BIG)} tone="faint" width={1.5} drawn={step === 3} opacity={step === 3 ? 1 : 0} />

            <Label x={LEFT + SIDE / 2} y={TOP - 22} tone="muted" size={14} opacity={step === 3 ? 0 : 1}>
              224 × 224
            </Label>
            <Label x={LEFT + BIG / 2} y={TOP + BIG + 18} tone="muted" size={14} opacity={step === 3 ? 1 : 0}>
              256 × 256
            </Label>

            {[0, 1, 2, 3].map((index) => (
              <rect
                key={index}
                className="a-t t-vision a-fill-soft a-stroke"
                x={268 + index * 48}
                y={226}
                width={40}
                height={40}
                rx={3}
                strokeWidth={1.5}
                style={{ opacity: step === 4 ? 1 : 0, transitionDelay: `${index * 80}ms` }}
              />
            ))}
            {[0, 1, 2, 3].map((index) => (
              <Label key={`n-${index}`} x={288 + index * 48} y={246} tone="ink" size={14} mono opacity={step === 4 ? 1 : 0} delay={index * 80}>
                49
              </Label>
            ))}

            <Label key={`big-${step}`} x={362} y={92} tone="ink" size={44} weight={700} enter>
              {numbers.big}
            </Label>
            <Label key={`unit-${step}`} x={362} y={134} tone="muted" size={15} enter>
              {numbers.unit}
            </Label>
            <Label key={`detail-${step}`} x={362} y={160} tone="faint" size={14} mono enter>
              {numbers.detail}
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
