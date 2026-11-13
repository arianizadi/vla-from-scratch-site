"use client";

import { AnimationFrame, Axes, Dot, Label, Path, type Tone } from "@/animations";
import { CX, IGNORING, LOOKING, PLOT, onLine } from "./sketch";

const LINES: { slope: number; tone: Tone; name: string; legendX: number }[] = [
  { slope: 1, tone: "success", name: "follows: 1", legendX: 60 },
  { slope: 1 / 3, tone: "accent", name: "middle: 1/3", legendX: 196 },
  { slope: 0, tone: "failure", name: "ignores: 0", legendX: 340 },
];
const left = PLOT.x;
const right = PLOT.x + PLOT.w;

export function SlopeTest() {
  return (
    <AnimationFrame
      title="The slope test"
      description="A chart of many tries. Across: where the named object stood. Up: where the hand closed. A robot that follows the object makes a line of slope 1; one that aims at the middle of three objects, about one third; one that ignores the scene, a flat line of slope 0. The first robots' tries lie on the flat line: slope about 0. After long enough training they lie on the slope-1 line."
      steps={[
        "Each try is one dot: where the named object stood, and where the hand closed.",
        "A robot that follows the object moves its hand as far as the object: slope 1.",
        "One that aims at the middle of three objects moves a third as far: slope 1/3.",
        "The first robots: a flat line, slope about 0. They ignored the scene.",
        "After long enough training: slope about 1. Now it follows the object.",
      ]}
      size={[480, 300]}
      hold={[2600, 2400, 2600, 2800, 3600]}
    >
      {(step) => (
        <>
          <Axes x={PLOT.x} y={PLOT.y} w={PLOT.w} h={PLOT.h} xLabel="where the object stood →" yLabel="where the hand closed ↑" />
          {LINES.map((line, i) => {
            const shown = i === 0 ? step >= 1 : i === 1 ? step >= 2 : step >= 3;
            const strong = (i === 2 && step === 3) || (i === 0 && step === 4);
            return (
              <g key={line.name}>
                <Path d={`M${left} ${onLine(left, line.slope)}L${right} ${onLine(right, line.slope)}`} tone={line.tone} width={strong ? 3.5 : 2} dashed={!strong} drawn={shown} />
                <Path d={`M${line.legendX} 22H${line.legendX + 18}`} tone={line.tone} width={3} opacity={shown ? 1 : 0} />
                <Label x={line.legendX + 24} y={22} tone={line.tone} size={13} weight={strong ? 700 : 400} anchor="start" opacity={shown ? 1 : 0}>
                  {line.name}
                </Label>
              </g>
            );
          })}
          {IGNORING.map(([x, y], i) => (
            <Dot key={`i${i}`} x={x} y={y} r={4.5} tone="ink" opacity={step === 0 || step === 3 ? 1 : step === 4 ? 0 : 0.25} delay={i * 25} />
          ))}
          {LOOKING.map(([x, y], i) => (
            <Dot key={`l${i}`} x={x} y={y} r={4.5} tone="ink" opacity={step === 4 ? 1 : 0} delay={i * 25} />
          ))}
          <Label x={CX} y={PLOT.y + PLOT.h - 14} tone="muted" size={13} opacity={step === 0 ? 1 : 0}>
            one dot = one try
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
