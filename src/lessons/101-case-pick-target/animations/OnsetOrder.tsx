"use client";

import { AnimationFrame, Axes, Label, Line, Path, type Tone } from "@/animations";
import { rise } from "./sketch";

const P = { x: 56, y: 60, w: 384, h: 180 };
const toPoints = (curve: [number, number][], top: number): [number, number][] =>
  curve.map(([t, v]) => [Math.round((P.x + t * P.w) * 10) / 10, Math.round((P.y + P.h - 4 - v * top * (P.h - 14)) * 10) / 10]);

/** A sketch of the order the lab saw: the robot heads for the right object first, then its misses shrink, then it succeeds. */
const CURVES: { name: string; tone: Tone; points: [number, number][]; legendX: number }[] = [
  { name: "heads for the right object", tone: "accent", points: toPoints(rise(0.38, 0.045), 1), legendX: 56 },
  { name: "closes near it", tone: "muted", points: toPoints(rise(0.5, 0.05), 0.9), legendX: 56 },
  { name: "lifts it", tone: "success", points: toPoints(rise(0.62, 0.06), 0.8), legendX: 300 },
];
const SHORT_END = P.x + P.w * 0.3;

export function OnsetOrder() {
  return (
    <AnimationFrame
      title="Practice long enough, and it clicks"
      description="A sketch of three measures over a long training run. For a long while nothing happens. Then the robot starts heading for the right object, all at once; a little later its misses shrink; and last, it starts lifting the object. A run that ends early, before the first rise, looks exactly like one that cannot learn."
      steps={[
        "A long training run. For a long while, nothing seems to happen.",
        "Then, fairly suddenly, it starts heading for the right object.",
        "A little later, its hand closes near the object.",
        "Last, it lifts the object, most of the time.",
        "A run that stopped here would look like one that can never learn.",
      ]}
      size={[480, 290]}
      hold={[2400, 2400, 2400, 2800, 3600]}
    >
      {(step) => (
        <>
          <rect x={P.x} y={P.y} width={SHORT_END - P.x} height={P.h} className="a-t t-failure a-fill-soft" style={{ opacity: step === 4 ? 0.8 : 0 }} />
          <Axes x={P.x} y={P.y} w={P.w} h={P.h} xLabel="training →" />
          <Label x={P.x} y={P.y + P.h + 18} tone="muted" size={13} anchor="start">
            a sketch, not measured values
          </Label>
          {CURVES.map((curve, i) => {
            const shown = step >= i + 1;
            const row = i < 2 ? 18 + i * 20 : 18;
            return (
              <g key={curve.name}>
                <Line points={curve.points} tone={curve.tone} width={step === i + 1 ? 3.5 : 2.5} drawn={shown} />
                <Path d={`M${curve.legendX} ${row}H${curve.legendX + 16}`} tone={curve.tone} width={3} opacity={shown ? 1 : 0} />
                <Label x={curve.legendX + 22} y={row} tone={curve.tone === "muted" ? "ink" : curve.tone} size={13} anchor="start" weight={step === i + 1 ? 700 : 400} opacity={shown ? 1 : 0}>
                  {curve.name}
                </Label>
              </g>
            );
          })}
          <Path d={`M${SHORT_END} ${P.y}V${P.y + P.h}`} tone="failure" width={2} dashed drawn={step === 4} />
          <Label x={(P.x + SHORT_END) / 2} y={P.y + 40} tone="failure" size={14} weight={700} opacity={step === 4 ? 1 : 0}>
            a short run
          </Label>
          <Label x={(P.x + SHORT_END) / 2} y={P.y + 60} tone="failure" size={14} weight={700} opacity={step === 4 ? 1 : 0}>
            ends here
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
