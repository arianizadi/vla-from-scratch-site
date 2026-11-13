"use client";

import { AnimationFrame, Dot, Label } from "@/animations";

/** One pick-up task, 50 new table layouts per policy: 2 lifts with one summary per picture, 15 with every patch. */
const ROWS = [
  { name: "one summary per picture", wins: 2, y: 78 },
  { name: "every patch as a token", wins: 15, y: 182 },
];
const COLS = 25;
const GAP = 15;
const X0 = 60;

export function FiftyTries() {
  return (
    <AnimationFrame
      title="Fifty tries each"
      description="The same pick-up task was tried on 50 new table layouts with each policy. The policy given one summary vector per picture lifted the cube twice. The policy given every patch as a token lifted it 15 times. Other parts of the two policies differed too, so this is a strong hint rather than a clean test."
      steps={[
        "Same task, 50 new table layouts for each policy.",
        "Given one summary per picture, the robot lifted the cube 2 times.",
        "Given every patch, it lifted the cube 15 times.",
        "Other parts differed too: a strong hint, not a clean test.",
      ]}
      size={[480, 280]}
    >
      {(step) => (
        <>
          {ROWS.map((row, r) => {
            const shown = step >= r + 1;
            return (
              <g key={row.name}>
                <Label x={X0 - 8} y={row.y - 34} tone="ink" size={15} anchor="start" weight={700}>
                  {row.name}
                </Label>
                {Array.from({ length: 50 }, (_, i) => {
                  const win = shown && i < row.wins;
                  return (
                    <Dot
                      key={i}
                      x={X0 + (i % COLS) * GAP}
                      y={row.y + Math.floor(i / COLS) * GAP}
                      r={5}
                      tone={win ? "success" : "faint"}
                      hollow={!win}
                      delay={win ? i * 40 : 0}
                    />
                  );
                })}
                <Label x={X0 + 12 * GAP} y={row.y + 42} tone="success" size={15} weight={700} opacity={shown ? 1 : 0} delay={400}>
                  {`${row.wins} of 50 lifted`}
                </Label>
              </g>
            );
          })}
          <Label x={240} y={262} tone="muted" size={14} opacity={step === 3 ? 1 : 0}>
            other parts differed too
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
