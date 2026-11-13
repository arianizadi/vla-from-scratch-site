"use client";

import { AnimationFrame, Chip, Label, Path, lerp, stagger } from "@/animations";
import { LONG_ROW, SHORT_ROW, bfloat16 } from "./seats";

const SLOT = 54;
const X0 = 52;
const xAt = (i: number) => X0 + i * SLOT;

/** Runs of neighbours that share one number: [first, last] index. */
function shared(row: number[]): [number, number][] {
  const seats = row.map(bfloat16);
  const runs: [number, number][] = [];
  seats.forEach((seat, i) => {
    const last = runs.at(-1);
    if (i > 0 && seats[i - 1] === seat && last && last[1] === i - 1) last[1] = i;
    else if (i + 1 < seats.length && seats[i + 1] === seat) runs.push([i, i]);
  });
  return runs;
}

/** Seat numbers and x positions for a row, exact or as the bug rounded them (chips sharing a number huddle together). */
function layout(row: number[], buggy: boolean): { seat: number; x: number; shared: boolean }[] {
  const seats = row.map((seat) => (buggy ? bfloat16(seat) : seat));
  return seats.map((seat, i) => {
    const group = seats.map((s, j) => (s === seat ? j : -1)).filter((j) => j >= 0);
    const centre = group.reduce((sum, j) => sum + xAt(j), 0) / group.length;
    return { seat, x: Math.round(lerp(xAt(i), centre, buggy ? 0.1 : 0)), shared: group.length > 1 };
  });
}

const ROWS = [
  { name: "without memory: shorter input", y: 92, row: SHORT_ROW, buggyFrom: 1 },
  { name: "with memory: longer input", y: 222, row: LONG_ROW, buggyFrom: 2 },
];

export function DuplicateSeats() {
  return (
    <AnimationFrame
      title="A rounding bug: shared seat numbers"
      description="Inside the model every piece of the input has a seat number that tells the model the order. A rounding bug gave neighbouring pieces the same number. In the shorter input, used without memory, pieces shared numbers in threes; in the longer input, used with memory, in groups of three and five. Fixed, every piece has its own number again, and the version with memory went from 62 to 96 lifts in 100."
      steps={[
        "Inside the model, each piece of the input has a seat number, so the order is known.",
        "A rounding bug: neighbouring pieces got the same number and blurred together.",
        "The longer input, used with memory, blurred even more.",
        "Fixed, every piece has its own seat again. With memory: from 62 to 96 lifts in 100.",
      ]}
      size={[480, 296]}
      hold={[2600, 2800, 2800, 3800]}
    >
      {(step) => (
        <>
          {ROWS.map((row) => {
            const buggy = step >= row.buggyFrom && step < 3;
            const chips = layout(row.row, buggy);
            return (
              <g key={row.name}>
                <Label x={X0 - 24} y={row.y - 40} tone="muted" size={14} anchor="start">
                  {row.name}
                </Label>
                {shared(row.row).map(([first, last]) => (
                  <Path
                    key={`${first}-${last}`}
                    d={`M${xAt(first) - 20} ${row.y + 22}H${xAt(last) + 20}`}
                    tone="failure"
                    width={3}
                    drawn={buggy}
                  />
                ))}
                {chips.map((chip, i) => (
                  <Chip
                    key={i}
                    x={chip.x}
                    y={row.y}
                    text={`${chip.seat}`}
                    tone={buggy && chip.shared ? "failure" : "action"}
                    size={14}
                    width={48}
                    delay={stagger(i, 40)}
                  />
                ))}
              </g>
            );
          })}
          <Label x={240} y={150} tone="failure" size={14} weight={700} opacity={step === 1 || step === 2 ? 1 : 0}>
            same number = same seat: the order blurs
          </Label>
          <Label x={240} y={272} tone="success" size={15} weight={700} opacity={step === 3 ? 1 : 0}>
            {"fixed: memory version 62 → 96 in 100"}
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
