"use client";

import { AnimationFrame, Gripper, Label, Move, Path } from "@/animations";
import { PlantTop, Ring, polar } from "./parts";

const R = 30;

/**
 * The four rungs, low to high: where each stands, what it adds, its shoots (and which one the instruction names on
 * rung 4), and what the robot learned there (averaged weights; rung 4 with the wordings it was trained on).
 */
const RUNGS = [
  { tread: 276, cx: 82, title: "Rung 1", what: "one shoot, facing", shoots: [90], named: -1, result: "77–84" },
  { tread: 236, cx: 191, title: "Rung 2", what: "turn it first", shoots: [-60], named: -1, result: "83–90" },
  { tread: 196, cx: 300, title: "Rung 3", what: "the whole plant", shoots: [90, -30, 200], named: -1, result: "about 80" },
  { tread: 156, cx: 409, title: "Rung 4", what: "a named shoot", shoots: [90, -30, 200], named: 2, result: "53–67" },
].map((rung) => ({ ...rung, cy: rung.tread - 62 }));

/** The curved arrow on rung 2: the turn that brings its shoot round to the arm. */
const TURN_ARC = (() => {
  const [x1, y1] = polar(-40, R + 12);
  const [x2, y2] = polar(70, R + 12);
  const { cx, cy } = RUNGS[1];
  return `M${cx + x1} ${cy + y1}A${R + 12} ${R + 12} 0 0 1 ${cx + x2} ${cy + y2}`;
})();

/** The stair: a tread under each rung, a riser halfway between neighbours. */
const STAIR = RUNGS.map((rung, i) => {
  const right = i === RUNGS.length - 1 ? 464 : (rung.cx + RUNGS[i + 1].cx) / 2;
  return `${i === 0 ? "M16" : "V"} ${rung.tread}H${right}`;
}).join("");

const LAST = RUNGS.length;

export function PruneLadder() {
  return (
    <AnimationFrame
      title="Four rungs to a pruned plant"
      description="A staircase of four rungs, each a plant seen from above with the arm at the front. Rung 1: one shoot that already faces the arm. Rung 2: one shoot facing away, so the plant must be turned first. Rung 3: the whole plant, with two or three shoots. Rung 4: the instruction names one shoot, and only that one may be cut. Each rung adds one difficulty. Successes in 100 tries: 77 to 84, 83 to 90, about 80, and 53 to 67."
      steps={[
        "Rung 1: one shoot, already facing the arm. Cut it.",
        "Rung 2: the shoot can face any way, so turn the plant first.",
        "Rung 3: two or three shoots. Turn, cut, turn, cut.",
        "Rung 4: the instruction names one shoot, such as the lowest. Cut only that one.",
        "Each rung adds one difficulty. Successes in 100 tries, rung by rung.",
      ]}
      size={[480, 314]}
      hold={[2600, 2600, 2600, 2800, 4000]}
    >
      {(step) => {
        const current = Math.min(step, LAST - 1);
        return (
          <>
            <Path d={STAIR} tone="faint" width={2} />

            {RUNGS.map((rung, i) => {
              const on = step === LAST || i === step;
              const seen = i <= step;
              return (
                <Move key={rung.title} opacity={seen ? (on ? 1 : 0.4) : 0.18} delay={i * 50}>
                  <PlantTop
                    x={rung.cx}
                    y={rung.cy}
                    r={R}
                    shoots={rung.shoots.map((angle, k) => ({ angle, tone: rung.named < 0 || k === rung.named ? "accent" : "faint" }))}
                  />
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

            {/* "You are here": the ring climbs from rung to rung */}
            <Ring x={RUNGS[current].cx} y={RUNGS[current].cy} r={R + 6} tone="mark" opacity={step === LAST ? 0 : 1} />

            {RUNGS.map((rung, i) => (
              <Label key={rung.result} x={rung.cx} y={rung.tread + 20} tone="ink" size={14} weight={700} opacity={step === LAST ? 1 : 0} delay={i * 150}>
                {rung.result}
              </Label>
            ))}
          </>
        );
      }}
    </AnimationFrame>
  );
}
