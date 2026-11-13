"use client";

import { AnimationFrame, Label, stagger } from "@/animations";
import { CAN, CloseMark, CUBE, TopTable } from "./table";

/** Five failed tries, and where the gripper first closed in each (none for the first). */
const FAILURES: { name: string; at?: [number, number] }[] = [
  { name: "never closes" },
  { name: "wrong object", at: CUBE },
  { name: "not looking", at: [100, 236] },
  { name: "near miss", at: [222, 178] },
  { name: "slips off", at: CAN },
];

const PANEL = 330;

export function FiveZeros() {
  return (
    <AnimationFrame
      title="Five ways to score zero"
      description="A table seen from above with a cube, a can and a nut; the instruction asks for the can. Five failed tries each score zero: the gripper never closes, closes on the cube, closes on empty table far from everything, closes just beside the can, or closes on the can and lifts nothing. The score is the same; the stories are not."
      steps={[
        "Try 1: the gripper never closes at all.",
        "Try 2: a clean grab, on the wrong object.",
        "Try 3: it closes on empty table, far from everything.",
        "Try 4: it closes just beside the can. Too far off to hold it.",
        "Try 5: it closes on the can, and the can slips out.",
        "Five different stories. The success rate writes the same zero for each.",
      ]}
      size={[480, 290]}
    >
      {(step) => {
        const all = step === 5;
        return (
          <>
            <TopTable />
            <circle
              cx={CAN[0]}
              cy={CAN[1]}
              r={27}
              className="a-t t-faint a-stroke"
              fill="none"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              style={{ opacity: step === 3 ? 1 : 0 }}
            />
            <Label x={158} y={74} tone="ink" size={14} weight={700} opacity={step === 0 ? 1 : 0}>
              gripper stays open
            </Label>

            {FAILURES.map((failure, index) =>
              failure.at ? (
                <CloseMark
                  key={failure.name}
                  x={failure.at[0]}
                  y={failure.at[1]}
                  opacity={step === index || all ? 1 : 0}
                  delay={all ? stagger(index, 90) : 0}
                />
              ) : null,
            )}

            {/* One try at a time: its name and its score. */}
            <Label x={PANEL + 64} y={78} tone="muted" size={14} opacity={all ? 0 : 1}>
              {`try ${Math.min(step, 4) + 1}`}
            </Label>
            <Label x={PANEL + 64} y={110} tone="ink" size={17} weight={700} opacity={all ? 0 : 1}>
              {FAILURES[Math.min(step, 4)].name}
            </Label>
            <Label x={PANEL + 64} y={156} tone="muted" size={14} opacity={all ? 0 : 1}>
              score
            </Label>
            <Label x={PANEL + 64} y={194} tone="failure" size={40} weight={700} opacity={all ? 0 : 1}>
              0
            </Label>

            {/* All five side by side. */}
            {FAILURES.map((failure, index) => (
              <g key={`row-${failure.name}`}>
                <Label x={PANEL} y={66 + index * 40} tone="ink" size={15} anchor="start" opacity={all ? 1 : 0} delay={stagger(index, 90)}>
                  {failure.name}
                </Label>
                <Label x={PANEL + 132} y={66 + index * 40} tone="failure" size={17} weight={700} anchor="end" opacity={all ? 1 : 0} delay={stagger(index, 90)}>
                  0
                </Label>
              </g>
            ))}
          </>
        );
      }}
    </AnimationFrame>
  );
}
