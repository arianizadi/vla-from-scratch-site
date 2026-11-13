"use client";

import { AnimationFrame, Axes, Dot, Label, Line, Path, scale, type Tone } from "@/animations";
import { BUDGETS, curve, rateAtOneMillion } from "./schedule";

const PLOT = { x: 40, y: 44, w: 410, h: 150 };
const toX = scale([0, 5_000_000], [PLOT.x, PLOT.x + PLOT.w]);
const toY = scale([0, 5.2e-4], [PLOT.y + PLOT.h, PLOT.y]);

/** The chapter's three run lengths, computed with its schedule (schedule.ts). */
const RUNS: { budget: number; name: string; tone: Tone; dashed: boolean }[] = [
  { budget: BUDGETS[0], name: "long run", tone: "accent", dashed: false },
  { budget: BUDGETS[1], name: "medium", tone: "ink", dashed: false },
  { budget: BUDGETS[2], name: "short", tone: "muted", dashed: true },
];
const POINTS = RUNS.map((run) => curve(run.budget).map(([s, r]) => [toX(s), toY(r)] as [number, number]));
const DOTS = RUNS.map((run) => toY(rateAtOneMillion(run.budget)));
const SAME = toX(1_000_000);
const LEGEND_X = [60, 200, 318];

export function ScheduleCurves() {
  return (
    <AnimationFrame
      title="The stride follows the plan"
      description="The stride, or learning rate, over three runs of different planned lengths. Each rises briefly, then shrinks along a smooth curve to almost nothing at its own end. At the same moment early in training, the long run still takes big steps, the medium run smaller ones, and the short run has already slowed to a crawl and stopped."
      steps={[
        "A long run: a brief warm-up, then the stride shrinks smoothly to almost nothing at the end.",
        "A medium run: the same shape, squeezed. Its stride shrinks sooner.",
        "A short run reaches the floor early, and stops there.",
        "Same moment, same examples seen so far, three different strides.",
      ]}
      size={[480, 270]}
    >
      {(step) => (
        <>
          <Axes x={PLOT.x} y={PLOT.y} w={PLOT.w} h={PLOT.h} xLabel="training →" yLabel="stride (learning rate)" />

          <Path d={`M${SAME} ${PLOT.y}V${PLOT.y + PLOT.h}`} tone="mark" width={2} dashed drawn={step >= 3} />

          {RUNS.map((run, index) => (
            <Line key={run.name} points={POINTS[index]} tone={run.tone} dashed={run.dashed} width={2.5} drawn={step >= index} />
          ))}
          {RUNS.map((run, index) => (
            <Dot key={`dot-${run.name}`} x={SAME} y={DOTS[index]} r={5.5} tone={run.tone} opacity={step >= 3 ? 1 : 0} delay={index * 80} />
          ))}
          <Label x={SAME + 12} y={PLOT.y + PLOT.h + 18} tone="ink" size={14} weight={700} anchor="start" opacity={step >= 3 ? 1 : 0}>
            short run: already crawling
          </Label>

          {RUNS.map((run, index) => (
            <g key={`legend-${run.name}`}>
              <Path
                d={`M${LEGEND_X[index]} 248H${LEGEND_X[index] + 22}`}
                tone={run.tone}
                width={2.5}
                dashed={run.dashed}
                drawn={step >= index}
                opacity={step >= index ? 1 : 0}
              />
              <Label x={LEGEND_X[index] + 30} y={248} tone={step >= index ? "ink" : "faint"} size={14} anchor="start">
                {run.name}
              </Label>
            </g>
          ))}
        </>
      )}
    </AnimationFrame>
  );
}
