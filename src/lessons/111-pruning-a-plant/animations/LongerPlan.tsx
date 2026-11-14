"use client";

import { AnimationFrame, Axes, Dot, Label, Line, Path, scale } from "@/animations";
import { scheduleCurve, stepShare } from "./schedule";

const X0 = 60;
const Y0 = 48;
const W = 380;
const H = 130;
const MILLION = 1_000_000;

const x = scale([0, 20 * MILLION], [X0, X0 + W]);
const y = scale([0, 1], [Y0 + H, Y0]);
const LONG = scheduleCurve(20 * MILLION, x, y);
const SHORT = scheduleCurve(10 * MILLION, x, y);

/** The moment both plans are compared at: about 3.6 million examples seen. */
const AT = 3.6 * MILLION;
const AT_X = Math.round(x(AT) * 10) / 10;
const LONG_Y = Math.round(y(stepShare(AT, 20 * MILLION)) * 10) / 10;
const SHORT_Y = Math.round(y(stepShare(AT, 10 * MILLION)) * 10) / 10;

/** Final scores of every 20M run, out of 100, by number of demonstrations (trained or averaged weights). */
const TRACK = scale([0, 100], [150, 396]);
const RANGES = [
  { y: 272, name: "2000 examples", low: 56, high: 81, tone: "ink" as const },
  { y: 298, name: "4000 examples", low: 65, high: 78, tone: "accent" as const },
];

export function LongerPlan() {
  return (
    <AnimationFrame
      title="A longer plan keeps its big steps"
      description="A chart of step size against examples seen. The step size falls along half a cosine planned for the whole run: a 10 million plan reaches zero halfway across, a 20 million plan at the end. At 3.6 million examples the long plan still takes bigger steps, and there it prunes 29 plants in 100 where the short plans prune 2 to 6. Below, twice the demonstrations end inside the same range of scores: 65 to 78 against 56 to 81."
      steps={[
        "Each training step's size shrinks along a curve planned for the whole run.",
        "Plan twice as long, and the same curve stretches out.",
        "After 3.6 million examples, the long plan still takes bigger steps.",
        "There, the long plan prunes 29 plants in 100; the short plans, 2 to 6.",
        "Twice the examples: the final scores land inside the same range.",
      ]}
      size={[480, 316]}
      hold={[2600, 2600, 2800, 3200, 4000]}
    >
      {(step) => (
        <>
          <Axes x={X0} y={Y0} w={W} h={H} xTicks={["0", "10M", "20M"]} xLabel="examples seen" yLabel="step size" />

          <Line points={SHORT} tone="muted" width={2.5} drawn={step >= 0} />
          <Line points={LONG} tone="accent" width={2.5} drawn={step >= 1} />

          {/* Legend, and the result of each plan at 3.6M (step 3 on) */}
          <Path d="M250 40H270" tone="accent" width={2.5} opacity={step >= 1 ? 1 : 0} />
          <Label x={278} y={40} tone="ink" size={14} anchor="start" opacity={step >= 1 ? 1 : 0}>
            long plan
          </Label>
          <Path d="M250 64H270" tone="muted" width={2.5} />
          <Label x={278} y={64} tone="ink" size={14} anchor="start">
            short plan
          </Label>
          <Label x={468} y={40} tone="ink" size={14} anchor="end" weight={700} opacity={step >= 3 ? 1 : 0}>
            29 of 100
          </Label>
          <Label x={468} y={64} tone="ink" size={14} anchor="end" weight={700} opacity={step >= 3 ? 1 : 0} delay={120}>
            2–6 of 100
          </Label>

          {/* The comparison point */}
          <Path d={`M${AT_X} ${Y0}V${Y0 + H}`} tone="faint" width={1.5} dashed drawn={step >= 2} />
          <Label x={AT_X} y={Y0 + H + 18} tone="ink" size={13} weight={700} opacity={step >= 2 ? 1 : 0}>
            3.6M
          </Label>
          <Dot x={AT_X} y={LONG_Y} r={5} tone="accent" opacity={step >= 2 ? 1 : 0} />
          <Dot x={AT_X} y={SHORT_Y} r={5} tone="muted" opacity={step >= 2 ? 1 : 0} delay={80} />

          {/* Twice the demonstrations (step 4) */}
          <Label x={16} y={246} tone="ink" size={14} anchor="start" weight={700} opacity={step === 4 ? 1 : 0}>
            Final scores out of 100, by number of examples
          </Label>
          {RANGES.map((range, i) => (
            <g key={range.name}>
              <Label x={16} y={range.y} tone="muted" size={14} anchor="start" opacity={step === 4 ? 1 : 0} delay={i * 120}>
                {range.name}
              </Label>
              <Path d={`M${TRACK(0)} ${range.y}H${TRACK(100)}`} tone="faint" width={2} opacity={step === 4 ? 1 : 0} dashed />
              <Path
                d={`M${TRACK(range.low)} ${range.y}H${TRACK(range.high)}`}
                tone={range.tone}
                width={8}
                drawn={step === 4}
                delay={200 + i * 150}
              />
              <Label x={TRACK(100) + 8} y={range.y} tone="ink" size={14} anchor="start" opacity={step === 4 ? 1 : 0} delay={i * 120}>
                {`${range.low}–${range.high}`}
              </Label>
            </g>
          ))}
        </>
      )}
    </AnimationFrame>
  );
}
