"use client";

import { AnimationFrame, Gripper, Label, Move, Path } from "@/animations";
import { PlantTop, Ring, polar } from "./parts";

const R = 30;

/** The three rungs, low to high: where each stands, what it adds, and what the robot learned there. */
const RUNGS = [
  { tread: 276, cx: 91, title: "Rung 1", what: "one shoot, facing", shoots: [90], result: "77–84 of 100" },
  { tread: 216, cx: 241, title: "Rung 2", what: "turn it first", shoots: [-60], result: "83–90 of 100" },
  { tread: 156, cx: 390, title: "Rung 3", what: "the whole plant", shoots: [90, -30, 200], result: "about 80 of 100" },
].map((rung) => ({ ...rung, cy: rung.tread - 62 }));

/** The curved arrow on rung 2: the turn that brings its shoot round to the arm. */
const TURN_ARC = (() => {
  const [x1, y1] = polar(-40, R + 12);
  const [x2, y2] = polar(70, R + 12);
  const { cx, cy } = RUNGS[1];
  return `M${cx + x1} ${cy + y1}A${R + 12} ${R + 12} 0 0 1 ${cx + x2} ${cy + y2}`;
})();

export function PruneLadder() {
  return (
    <AnimationFrame
      title="Three rungs to a pruned plant"
      description="A staircase of three rungs, each a plant seen from above with the arm at the front. Rung 1: one shoot that already faces the arm. Rung 2: one shoot facing away, so the plant must be turned first. Rung 3: the whole plant, with three shoots. Each rung adds one difficulty; the robot learned each one: 77 to 84, 83 to 90, and about 80 plants in 100."
      steps={[
        "Rung 1: one shoot, already facing the arm. Cut it.",
        "Rung 2: the shoot can face any way, so turn the plant first.",
        "Rung 3: two or three shoots. Turn, cut, turn, cut.",
        "Each rung adds one difficulty. Plants pruned in 100 tries, rung by rung.",
      ]}
      size={[480, 314]}
      hold={[2600, 2600, 2600, 3800]}
    >
      {(step) => {
        const current = Math.min(step, 2);
        return (
          <>
            <Path d="M16 276H166V216H316V156H464" tone="faint" width={2} />

            {RUNGS.map((rung, i) => {
              const on = step === 3 || i === step;
              const seen = i <= step;
              return (
                <Move key={rung.title} opacity={seen ? (on ? 1 : 0.4) : 0.18} delay={i * 50}>
                  <PlantTop x={rung.cx} y={rung.cy} r={R} shoots={rung.shoots.map((angle) => ({ angle }))} />
                  <Gripper x={rung.cx} y={rung.tread - 4} angle={180} open={1} tone="ink" size={0.4} />
                  <Label x={rung.cx} y={rung.cy - 70} tone="ink" size={14} weight={700}>
                    {rung.title}
                  </Label>
                  <Label x={rung.cx} y={rung.cy - 46} tone="muted" size={14}>
                    {rung.what}
                  </Label>
                </Move>
              );
            })}

            <Path d={TURN_ARC} tone="accent" width={2.5} drawn={step >= 1} />
            <Label x={RUNGS[1].cx + 56} y={RUNGS[1].cy + 6} tone="accent" size={14} anchor="start" weight={700} opacity={step === 1 ? 1 : 0}>
              turn
            </Label>

            {/* "You are here": the ring climbs from rung to rung */}
            <Ring x={RUNGS[current].cx} y={RUNGS[current].cy} r={R + 6} tone="mark" opacity={step === 3 ? 0 : 1} />

            {RUNGS.map((rung, i) => (
              <Label key={rung.result} x={rung.cx} y={rung.tread + 20} tone="ink" size={14} weight={700} opacity={step === 3 ? 1 : 0} delay={i * 150}>
                {rung.result}
              </Label>
            ))}
          </>
        );
      }}
    </AnimationFrame>
  );
}
