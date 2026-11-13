"use client";

import { AnimationFrame, Chip, Dot, Label } from "@/animations";
import { scatter, spread } from "./scatter";

/** Seen from above, 0.6 drawing units per millimetre. Toy dots: spread over the table, and at the typical miss measured. */
const MM = 0.6;
const CY = 150;
const W = 216;
const H = 160;
const PANELS = [
  { cx: 122, title: "as run", slot: "last action at start: rest", median: 0, seed: 21, at: 1 },
  { cx: 358, title: "one number swapped", slot: "last action at start: expert's", median: 25 * MM, seed: 5, at: 3 },
];
const OTHERS: [number, number][] = [
  [-60, -40],
  [56, 44],
];
const fit = ([x, y]: [number, number]): [number, number] => [
  Math.max(-W / 2 + 10, Math.min(W / 2 - 10, x)),
  Math.max(-H / 2 + 10, Math.min(H / 2 - 10, y)),
];
/** As run, it closes anywhere on the table; with the swap, near the named object. */
const DOTS = [spread(24, W - 28, H - 28, PANELS[0].seed), scatter(24, PANELS[1].median, PANELS[1].seed).map(fit)];

export function OneSwap() {
  return (
    <AnimationFrame
      title="Caught with one swap"
      description="Seen from above, three objects, one named. Each dot is where a history policy's gripper first closed, drawn as toy dots at the typical misses measured. As run, it closes all over the table and reaches the named object only by chance. When the only change is that its first last action is the expert's instead of the arm at rest, it heads for the named object almost every time: it was reading the target from that input."
      steps={[
        "A policy with history that nearly always failed. Where does it close?",
        "As run: all over the table. It reaches the named object only by chance.",
        "Now change one input: give it the expert's first move instead of “at rest”.",
        "It heads for the named object almost every time. It was reading the answer from that input.",
      ]}
      size={[480, 290]}
    >
      {(step) => (
        <>
          {PANELS.map((panel, p) => (
            <g key={panel.title}>
              <Label x={panel.cx} y={30} tone="ink" size={14} weight={700} opacity={p === 1 && step < 2 ? 0.35 : 1}>
                {panel.title}
              </Label>
              <rect x={panel.cx - W / 2} y={CY - H / 2} width={W} height={H} rx={12} className="t-faint a-stroke" fill="none" strokeWidth={1.5} />
              {OTHERS.map(([dx, dy], i) => (
                <rect key={i} x={panel.cx + dx - 11} y={CY + dy - 11} width={22} height={22} rx={i === 0 ? 11 : 4} className="t-muted a-fill-soft a-stroke" strokeWidth={1.5} />
              ))}
              <rect x={panel.cx - 11} y={CY - 11} width={22} height={22} rx={4} className="t-action a-fill-soft a-stroke" strokeWidth={2} />
              <circle cx={panel.cx} cy={CY} r={19} className="t-mark a-stroke" fill="none" strokeWidth={3} />
              {DOTS[p].map(([x, y], i) => (
                <Dot key={i} x={panel.cx + x} y={CY + y} r={3.5} tone="accent" opacity={step >= panel.at ? 0.9 : 0} delay={i * 25} />
              ))}
              <Chip x={panel.cx} y={260} text={panel.slot} tone={p === 0 ? "muted" : "action"} size={13} mono={false} width={W} opacity={step >= (p === 0 ? 1 : 2) ? 1 : 0} />
            </g>
          ))}
        </>
      )}
    </AnimationFrame>
  );
}
