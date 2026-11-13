"use client";

import { AnimationFrame, Box, Chip, Label, stagger } from "@/animations";

const RUN_X = 104;
const SAVE_X = 378;
const ITEMS = ["weights", "optimiser memory", "place in the data", "step count"];
const ROW = (i: number) => 94 + i * 46;
/** The step at which each item moves into the save point. */
const SAVED_AT = [1, 2, 2, 3];

export function WhatASaveHolds() {
  return (
    <AnimationFrame
      title="What a save point holds"
      description="A running training job holds four things: its weights, the optimiser's memory of recent steps, its place in the data, and its step count. A save point copies all four. After a crash all four are restored, and the run continues exactly where it was."
      steps={[
        "A run in progress holds more than its weights.",
        "The save point copies the weights…",
        "…the optimiser's memory of recent steps, and where it was in the data…",
        "…and the step count, which sets the stride.",
        "After a crash all four come back, and the run carries on as if nothing happened.",
      ]}
      size={[480, 290]}
    >
      {(step) => {
        const restored = step >= 4;
        return (
          <>
            <Box x={RUN_X} y={163} w={184} h={210} tone={restored ? "success" : "ink"} active={restored} />
            <Label x={RUN_X} y={42} tone="ink" size={15} weight={700} opacity={restored ? 0 : 1}>
              the run
            </Label>
            <Label x={RUN_X} y={42} tone="success" size={15} weight={700} opacity={restored ? 1 : 0}>
              resumed run
            </Label>

            <Box x={SAVE_X} y={163} w={184} h={210} tone="accent" filled={step >= 1 && !restored} />
            <Label x={SAVE_X} y={42} tone="accent" size={15} weight={700}>
              save point
            </Label>

            {ITEMS.map((item, i) => (
              <Chip
                key={`ghost-${item}`}
                x={RUN_X}
                y={ROW(i)}
                text={item}
                tone="faint"
                variant="outline"
                mono={false}
                size={14}
                width={158}
                opacity={step >= SAVED_AT[i] && !restored ? 0.5 : 0}
              />
            ))}
            {ITEMS.map((item, i) => {
              const inSave = step >= SAVED_AT[i] && !restored;
              return (
                <Chip
                  key={item}
                  x={inSave ? SAVE_X : RUN_X}
                  y={ROW(i)}
                  text={item}
                  tone={inSave ? "accent" : "ink"}
                  variant={inSave ? "solid" : "outline"}
                  mono={false}
                  size={14}
                  width={158}
                  delay={restored ? stagger(i, 70) : i === 2 ? 120 : 0}
                />
              );
            })}
          </>
        );
      }}
    </AnimationFrame>
  );
}
