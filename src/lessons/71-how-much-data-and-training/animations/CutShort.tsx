"use client";

import { AnimationFrame, Axes, Label, Line, Path, scale } from "@/animations";

/* Success of the same design on the same 1500 demonstrations, from the
   chapter: one run stopped at 1M examples, one ran to 3M. Where the chapter
   gives a range over several checkpoints, it is drawn as a range. */

const PLOT = { x: 64, y: 44, w: 370, h: 180 };
const sx = scale([0, 3], [PLOT.x, PLOT.x + PLOT.w]);
const sy = scale([0, 80], [PLOT.y + PLOT.h, PLOT.y]);
const pt = (m: number, v: number): [number, number] => [Math.round(sx(m)), Math.round(sy(v))];

const SHORT = [pt(0.2, 0.5), pt(0.4, 0.5), pt(0.6, 0.5), pt(0.8, 2), pt(1.0, 3)];
const EARLY = [pt(0.3, 1), pt(0.6, 1), pt(0.9, 1), pt(1.2, 3)];
const RISE = [pt(1.2, 3), pt(1.5, 21)];
/* After the climb the chapter gives ranges over several checkpoints (44-59%, then 60-64%);
   the line runs through their middles. */
const LATE = [pt(1.5, 21), pt(1.8, 52), pt(2.1, 52), pt(2.4, 62), pt(2.7, 62), pt(3.0, 62)];

export function CutShort() {
  return (
    <AnimationFrame
      title="Stopped too early"
      description="On 1500 demonstrations, a run stopped at 1 million training examples ended at 3% success and looked broken. The same design on the same data, trained to 3 million, was still near zero at 1.2 million, reached 21% at 1.5 million and ended at about 60%."
      steps={[
        "A run stops at 1M examples with 3% success. It looks broken.",
        "The same design and data, trained longer: still flat at 1.2M…",
        "…then it takes off: 21% at 1.5M…",
        "…and ends around 60%. The first run stopped right before the climb.",
      ]}
      size={[480, 280]}
    >
      {(step) => (
        <>
          <Axes x={PLOT.x} y={PLOT.y} w={PLOT.w} h={PLOT.h} xTicks={["0", "1M", "2M", "3M"]} xLabel="training examples seen" yLabel="success" />
          {[0, 40, 80].map((value) => (
            <Label key={value} x={PLOT.x - 10} y={sy(value)} tone="faint" size={13} anchor="end" mono>
              {`${value}%`}
            </Label>
          ))}

          <Line points={SHORT} tone="failure" drawn dots width={3} />
          <Path d={`M${sx(1)} ${PLOT.y + 30}V${PLOT.y + PLOT.h}`} tone="failure" width={2.5} />
          <Label x={sx(1) - 8} y={PLOT.y + 30} tone="failure" size={14} weight={700} anchor="end">
            stopped: 3%
          </Label>

          <Line points={EARLY} tone="accent" drawn={step >= 1} dots />
          <Line points={RISE} tone="accent" drawn={step >= 2} dots />
          <Label x={sx(1.5) + 12} y={sy(21) + 4} tone="accent" size={14} weight={700} anchor="start" opacity={step === 2 ? 1 : 0}>
            21%
          </Label>
          <Line points={LATE} tone="accent" drawn={step >= 3} dots />
          <Label x={sx(3)} y={sy(64) - 18} tone="accent" size={14} weight={700} anchor="end" opacity={step >= 3 ? 1 : 0}>
            about 60%
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
