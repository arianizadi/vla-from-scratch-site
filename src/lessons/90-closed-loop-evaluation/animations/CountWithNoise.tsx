"use client";

import { AnimationFrame, Dot, Label, Path, scale } from "@/animations";
import { wilson } from "./wilson";

const CELL = 14;
const GAP = 4;
const GRID_X = 24;
const GRID_Y = 62;
const cellX = (i: number) => GRID_X + (i % 10) * (CELL + GAP);
const cellY = (i: number) => GRID_Y + Math.floor(i / 10) * (CELL + GAP);
const CELLS = Array.from({ length: 100 }, (_, i) => i);

/** Which of the 100 scenes failed: 7 in the first set (93/100), 4 in the next (96/100). Positions are arbitrary. */
const FAILED_FIRST = new Set([6, 23, 38, 51, 67, 74, 92]);
const FAILED_NEXT = new Set([14, 45, 70, 88]);

const toX = scale([80, 100], [262, 456]);
const LINE_Y = 150;
const FIRST = wilson(93, 100);
const R = 7;

export function CountWithNoise() {
  return (
    <AnimationFrame
      title="A score is a count"
      description="A grid of 100 new scenes, one attempt each. 93 succeed: a rate of 93%. On the next 100 scenes the same policy succeeds 96 times. The 95% interval for the first reading runs from 86% to 97%, and both readings fall inside it."
      steps={[
        "100 new scenes, one attempt each.",
        "Filled: success. 93 of 100, a rate of 93%.",
        "The same policy on the next 100 scenes: 96.",
        "The interval: where the true rate plausibly lies. Both readings fit inside.",
      ]}
      size={[480, 280]}
    >
      {(step) => {
        const failed = step >= 2 ? FAILED_NEXT : FAILED_FIRST;
        return (
          <>
            <Label x={GRID_X} y={34} tone="muted" size={14} anchor="start">
              {step >= 2 ? "next 100 scenes" : "100 scenes"}
            </Label>
            {CELLS.map((i) => (
              <rect key={`slot-${i}`} className="t-faint cell-outline" x={cellX(i)} y={cellY(i)} width={CELL} height={CELL} rx={3} />
            ))}
            {CELLS.map((i) => {
              const ok = !failed.has(i);
              return (
                <rect
                  key={`fill-${i}`}
                  className={`a-t ${ok ? "t-success a-fill" : "t-failure a-fill-soft a-stroke"}`}
                  x={cellX(i)}
                  y={cellY(i)}
                  width={CELL}
                  height={CELL}
                  rx={3}
                  style={{ opacity: step >= 1 ? 1 : 0, transitionDelay: `${step === 1 ? Math.floor(i / 10) * 60 : 0}ms` }}
                />
              );
            })}

            <Path d={`M${toX(80)} ${LINE_Y}H${toX(100)}`} tone="faint" width={1.5} />
            {[80, 90, 100].map((tick) => (
              <Label key={tick} x={toX(tick)} y={LINE_Y + 22} tone="faint" size={13}>
                {`${tick}%`}
              </Label>
            ))}

            <Path
              d={`M${toX(FIRST.low)} ${LINE_Y - 34}H${toX(FIRST.high)}M${toX(FIRST.low)} ${LINE_Y - 42}V${LINE_Y - 26}M${toX(FIRST.high)} ${LINE_Y - 42}V${LINE_Y - 26}`}
              tone="mark"
              width={3}
              drawn={step >= 3}
            />
            <Label x={(toX(FIRST.low) + toX(FIRST.high)) / 2} y={LINE_Y - 60} tone="ink" size={14} weight={700} opacity={step >= 3 ? 1 : 0}>
              {`${Math.round(FIRST.low)}% to ${Math.round(FIRST.high)}%`}
            </Label>

            <Dot x={toX(93)} y={LINE_Y} r={R} tone="accent" opacity={step >= 1 ? 1 : 0} />
            <Label x={toX(93)} y={LINE_Y + 46} tone="accent" size={14} weight={700} opacity={step >= 1 ? 1 : 0}>
              93
            </Label>
            <Dot x={toX(96)} y={LINE_Y} r={R} tone="ink" opacity={step >= 2 ? 1 : 0} />
            <Label x={toX(96)} y={LINE_Y + 46} tone="ink" size={14} weight={700} opacity={step >= 2 ? 1 : 0}>
              96
            </Label>
            <rect className="a-t t-success a-fill" x={GRID_X} y={256} width={12} height={12} rx={3} style={{ opacity: step >= 1 ? 1 : 0 }} />
            <Label x={GRID_X + 18} y={262} tone="ink" size={14} anchor="start" opacity={step >= 1 ? 1 : 0}>
              success
            </Label>
            <rect className="a-t t-failure a-fill-soft a-stroke" x={GRID_X + 92} y={256} width={12} height={12} rx={3} style={{ opacity: step >= 1 ? 1 : 0 }} />
            <Label x={GRID_X + 110} y={262} tone="ink" size={14} anchor="start" opacity={step >= 1 ? 1 : 0}>
              failure
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
