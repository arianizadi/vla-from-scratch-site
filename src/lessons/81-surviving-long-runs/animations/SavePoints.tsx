"use client";

import { AnimationFrame, Bracket, Label, Path, Timeline } from "@/animations";

const LEFT = 40;
const WIDTH = 400;
const CRASH = 0.62;
const at = (fraction: number) => Math.round((LEFT + fraction * WIDTH) * 100) / 100;

/** Two runs, the same crash: one saves 8 times, one 3 times. */
const RUNS = [
  { name: "saves often", saves: 8, y: 92 },
  { name: "saves rarely", saves: 3, y: 196 },
];
const lastSave = (saves: number) => Math.floor(CRASH * saves) / saves;

export function SavePoints() {
  return (
    <AnimationFrame
      title="Save points"
      description="Two training runs crash at the same moment. One saved its progress often, one rarely. Each goes back to its newest save point and loses the work done since; the run that saved often loses much less. Both then carry on to the end."
      steps={[
        "Two runs. The ticks are save points: one saves often, one rarely.",
        "Both crash at the same moment.",
        "Each goes back to its newest save. The work after it is lost.",
        "Both carry on to the end. Saving often lost much less.",
      ]}
      size={[480, 260]}
    >
      {(step) => (
        <>
          {RUNS.map((run) => {
            const back = lastSave(run.saves);
            const marker = step === 0 ? 0.3 : step === 1 ? CRASH : step === 2 ? back : 1;
            return (
              <g key={run.name}>
                <Label x={LEFT} y={run.y - 46} tone="ink" size={15} weight={700} anchor="start">
                  {run.name}
                </Label>
                {Array.from({ length: run.saves }, (_, i) => (
                  <Path key={i} d={`M${at((i + 1) / run.saves)} ${run.y - 11}V${run.y + 11}`} tone="ink" width={2.5} />
                ))}
                <Timeline x={LEFT} y={run.y} w={WIDTH} ticks={["start", "end"]} marker={marker} tone={step === 1 ? "failure" : "accent"} />
                <Label x={at(CRASH)} y={run.y - 26} tone="failure" size={14} weight={700} opacity={step === 1 ? 1 : 0}>
                  crash
                </Label>
                <Bracket x1={at(back)} x2={at(CRASH)} y={run.y - 24} tone="failure" opacity={step === 2 || step === 3 ? 1 : 0} />
                <Label x={at(CRASH) + 10} y={run.y - 24} tone="failure" size={14} weight={700} anchor="start" opacity={step === 2 || step === 3 ? 1 : 0}>
                  lost
                </Label>
                <Label x={LEFT + WIDTH} y={run.y - 46} tone="success" size={14} weight={700} anchor="end" opacity={step === 3 ? 1 : 0}>
                  ✓ finished
                </Label>
              </g>
            );
          })}
        </>
      )}
    </AnimationFrame>
  );
}
