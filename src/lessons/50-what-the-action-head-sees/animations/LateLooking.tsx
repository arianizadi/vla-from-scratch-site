"use client";

import { AnimationFrame, Axes, Dot, Label, Line, Path } from "@/animations";

const PLOT = { x: 70, y: 40, w: 370, h: 170 };
const r = (value: number) => Math.round(value * 10) / 10;
/** Share closing at the named object, as a sketch: chance (1 in 3) for a long time, then a quick rise to always. */
const share = (t: number) => 1 / 3 + (2 / 3) / (1 + Math.exp(-14 * (t - 0.62)));
const toX = (t: number) => r(PLOT.x + t * PLOT.w);
const toY = (v: number) => r(PLOT.y + PLOT.h - v * PLOT.h);
const points = (from: number, to: number): [number, number][] =>
  Array.from({ length: 31 }, (_, i) => {
    const t = from + ((to - from) * i) / 30;
    return [toX(t), toY(share(t))];
  });

export function LateLooking() {
  return (
    <AnimationFrame
      title="Being there is not being used"
      description="A sketch of how often a policy closes its gripper at the named object as training goes on. The scene is in its input from the first step, yet for a long stretch it does no better than chance, one in three with three objects. Then, fairly suddenly, it starts to use the scene and closes at the named object every time."
      steps={[
        "From the very first training step, the scene is in the row the action head reads.",
        "For a long stretch, the policy closes at the named object only by chance: one in three.",
        "Then, fairly suddenly, it starts to use the scene.",
        "Being in the input is not the same as being used. Check it; never assume it.",
      ]}
      size={[480, 260]}
    >
      {(step) => (
        <>
          <Axes {...PLOT} xLabel="more training →" yLabel="closes at the named object" />
          <Label x={PLOT.x - 8} y={toY(1)} tone="faint" size={13} anchor="end">
            always
          </Label>
          <Label x={PLOT.x - 8} y={toY(1 / 3)} tone="faint" size={13} anchor="end">
            1 in 3
          </Label>
          <Path d={`M${PLOT.x} ${toY(1 / 3)}H${PLOT.x + PLOT.w}`} tone="faint" dashed drawn width={1.5} />
          <Label x={PLOT.x + PLOT.w} y={toY(1 / 3) + 16} tone="faint" size={13} anchor="end">
            chance
          </Label>

          <Dot x={toX(0)} y={toY(share(0))} r={5} tone="accent" opacity={step === 0 ? 1 : 0} />
          <Line points={points(0, 0.5)} tone="accent" width={3} drawn={step >= 1} />
          <Line points={points(0.5, 1)} tone="accent" width={3} drawn={step >= 2} />
          <Label x={toX(0.25)} y={toY(1 / 3) - 22} tone="accent" size={14} weight={700} opacity={step === 1 ? 1 : 0}>
            not looking yet
          </Label>
          <Label x={toX(0.62) - 14} y={toY(0.85)} tone="accent" size={14} anchor="end" weight={700} opacity={step >= 2 ? 1 : 0}>
            starts to look
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
