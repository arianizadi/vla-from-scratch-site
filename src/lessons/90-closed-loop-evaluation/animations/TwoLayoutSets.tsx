"use client";

import { AnimationFrame, Dot, Label, Line, Path, scale, stagger, type Tone } from "@/animations";

/** The chapter's table: final checkpoints of eight runs, successes out of 100 on two sets of 100 unseen scenes. */
const RUNS = [
  { first: 85, next: 83 },
  { first: 93, next: 96 },
  { first: 96, next: 100 },
  { first: 89, next: 93 },
  { first: 84, next: 93 },
  { first: 98, next: 97 },
  { first: 94, next: 87 },
  { first: 86, next: 74 },
];
/** The pair whose order flips: 84 → 93 and 94 → 87. */
const UP = 4;
const DOWN = 6;

const LEFT = 150;
const RIGHT = 330;
const toY = scale([70, 100], [232, 52]);

function toneOf(index: number, focus: boolean): Tone {
  if (!focus) return "ink";
  if (index === UP) return "accent";
  if (index === DOWN) return "ink";
  return "faint";
}

export function TwoLayoutSets() {
  return (
    <AnimationFrame
      title="Same policies, new scenes"
      description="Eight finished policies, each scored on 100 new scenes and then on another 100. Every score moves, by 1 to 12 points, and the order changes: one policy went from 84 to 93, another from 94 to 87, so the one that was behind by 10 points ended ahead by 6."
      steps={[
        "Eight finished policies, each scored on 100 new scenes.",
        "The same policies, scored again on another 100 scenes.",
        "Every score moves, by up to 12 points.",
        "Two of them swap places: 10 points behind becomes 6 ahead.",
      ]}
      size={[480, 280]}
    >
      {(step) => {
        const focus = step >= 3;
        return (
          <>
            <Label x={LEFT} y={24} tone="muted" size={14}>
              first 100 scenes
            </Label>
            <Label x={RIGHT} y={24} tone="muted" size={14} opacity={step >= 1 ? 1 : 0}>
              next 100 scenes
            </Label>
            <Path d={`M${LEFT} 42V240`} tone="faint" width={1.5} />
            <Path d={`M${RIGHT} 42V240`} tone="faint" width={1.5} opacity={step >= 1 ? 1 : 0} />
            {[70, 80, 90, 100].map((tick) => (
              <Label key={tick} x={LEFT - 40} y={toY(tick)} tone="faint" size={13} anchor="end" opacity={focus ? 0 : 1}>
                {`${tick}%`}
              </Label>
            ))}

            {RUNS.map((run, index) => {
              const tone = toneOf(index, focus);
              const lit = focus && (index === UP || index === DOWN);
              const fade = focus && !lit ? 0.45 : 1;
              return (
                <g key={index}>
                  <Line points={[[LEFT, toY(run.first)], [RIGHT, toY(run.next)]]} tone={tone} width={lit ? 3 : 2} drawn={step >= 1} opacity={fade} delay={stagger(index, 60)} />
                  <Dot x={LEFT} y={toY(run.first)} r={5} tone={tone} opacity={fade} delay={stagger(index)} />
                  <Dot x={RIGHT} y={toY(run.next)} r={5} tone={tone} opacity={step >= 1 ? fade : 0} delay={stagger(index, 60) + 300} />
                </g>
              );
            })}

            <Label x={RIGHT + 14} y={toY(74)} tone="ink" size={14} anchor="start" weight={700} opacity={step === 2 ? 1 : 0}>
              86 → 74
            </Label>

            {[UP, DOWN].map((index) => (
              <g key={`values-${index}`}>
                <Label x={LEFT - 14} y={toY(RUNS[index].first)} tone={index === UP ? "accent" : "ink"} size={15} weight={700} anchor="end" opacity={focus ? 1 : 0}>
                  {String(RUNS[index].first)}
                </Label>
                <Label x={RIGHT + 14} y={toY(RUNS[index].next)} tone={index === UP ? "accent" : "ink"} size={15} weight={700} anchor="start" opacity={focus ? 1 : 0}>
                  {String(RUNS[index].next)}
                </Label>
              </g>
            ))}
            <Label x={240} y={262} tone="muted" size={14} opacity={focus ? 1 : 0}>
              a gap of a few points is not a ranking
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
