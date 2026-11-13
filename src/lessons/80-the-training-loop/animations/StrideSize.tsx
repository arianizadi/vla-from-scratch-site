"use client";

import { AnimationFrame, Dot, Label, Path, type Tone } from "@/animations";
import { descend, loss, valleyPath } from "./valley";

const LIMIT = 2.3;
const ROUNDS = 4;

/** Three strides on the same toy valley, all from w = -1.8. */
const VALLEYS: { cx: number; eta: number; name: string; outcome: string; tone: Tone }[] = [
  { cx: 84, eta: 1.05, name: "too big", outcome: "bounces out", tone: "failure" },
  { cx: 240, eta: 0.03, name: "too small", outcome: "barely moves", tone: "failure" },
  { cx: 396, eta: 0.3, name: "about right", outcome: "settles", tone: "success" },
];

const R = 7;

export function StrideSize() {
  return (
    <AnimationFrame
      title="How big a step"
      description="The same toy valley three times, the ball starting at the same place. With too big a stride it jumps across the valley and climbs higher each time. With too small a stride it barely moves. With a stride in between it settles at the bottom in a few steps."
      steps={[
        "Three copies of one valley, one ball each, three stride sizes.",
        "First step. The big stride leaps across the valley.",
        "Again: the big stride lands higher, the small one has hardly moved.",
        "Too big bounces out, too small crawls, in between settles.",
      ]}
      size={[480, 260]}
    >
      {(step) => {
        const round = step === 0 ? 0 : step === 1 ? 1 : step === 2 ? 2 : ROUNDS;
        return (
          <>
            {VALLEYS.map((valley) => {
              const toX = (w: number) => valley.cx + 28 * w;
              const toY = (l: number) => 196 - 22 * l;
              const path = descend(-1.8, valley.eta, ROUNDS, LIMIT);
              const place = (w: number): [number, number] => [Math.round(toX(w) * 10) / 10, Math.round((toY(loss(w)) - R - 1) * 10) / 10];
              const [bx, by] = place(path[round]);
              return (
                <g key={valley.name}>
                  <Label x={valley.cx} y={26} tone="ink" size={15} weight={700}>
                    {valley.name}
                  </Label>
                  <Path d={valleyPath(toX, toY, LIMIT, 30)} tone="ink" width={2} />
                  {path.slice(0, -1).map((w, i) => {
                    const [tx, ty] = place(w);
                    return <Dot key={i} x={tx} y={ty} r={3.5} tone="accent" opacity={i < round ? 0.45 : 0} />;
                  })}
                  <Dot x={bx} y={by} r={R} tone="accent" />
                  <Label x={valley.cx} y={226} tone={valley.tone} size={14} weight={700} opacity={step === 3 ? 1 : 0}>
                    {valley.outcome}
                  </Label>
                </g>
              );
            })}
          </>
        );
      }}
    </AnimationFrame>
  );
}
