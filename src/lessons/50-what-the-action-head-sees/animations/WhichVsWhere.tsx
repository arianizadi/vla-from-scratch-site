"use client";

import { AnimationFrame, Dot, Label } from "@/animations";
import { scatter } from "./scatter";

/** 0.6 drawing units per millimetre, seen from above. */
const MM = 0.6;
const PANELS = [
  { cx: 122, title: "one summary", median: 83 * MM, seed: 4, at: 1 },
  { cx: 358, title: "every patch", median: 7 * MM, seed: 9, at: 3 },
];
const CY = 146;
const W = 216;
const H = 170;
const LIMIT = 80;
/** The two other objects, relative to the named one. */
const OTHERS: [number, number][] = [
  [-62, -46],
  [58, 44],
];
const clamp = ([x, y]: [number, number]): [number, number] => {
  const d = Math.hypot(x, y);
  return d > LIMIT ? [Math.round((x / d) * LIMIT * 10) / 10, Math.round((y / d) * LIMIT * 10) / 10] : [x, y];
};
const DOTS = PANELS.map((panel) => scatter(24, panel.median, panel.seed).map(clamp));

export function WhichVsWhere() {
  return (
    <AnimationFrame
      title="Which object, and exactly where"
      description="Seen from above, three objects lie on a table and the instruction names the middle one. Each dot is where a policy's gripper closed, drawn as toy dots at the typical miss we measured. A policy given one summary vector learned which object, roughly, but missed it by about 8 centimetres. A policy given every patch token closed within millimetres."
      steps={[
        "Seen from above: three objects, and the instruction names the ringed one.",
        "One summary: the policy learned which object, and closes near it…",
        "…but about 8 cm off on a typical try. A grasp forgives about 1 cm.",
        "Every patch token: it closes within millimetres of the object.",
      ]}
      size={[480, 270]}
    >
      {(step) => (
        <>
          {PANELS.map((panel, p) => (
            <g key={panel.title}>
              <rect x={panel.cx - W / 2} y={CY - H / 2} width={W} height={H} rx={12} className="t-faint a-stroke" fill="none" strokeWidth={1.5} />
              <Label x={panel.cx} y={36} tone="ink" size={14} weight={700}>
                {panel.title}
              </Label>
              {OTHERS.map(([dx, dy], i) => (
                <rect key={i} x={panel.cx + dx - 11} y={CY + dy - 11} width={22} height={22} rx={i === 0 ? 11 : 4} className="t-muted a-fill-soft a-stroke" strokeWidth={1.5} />
              ))}
              <rect x={panel.cx - 11} y={CY - 11} width={22} height={22} rx={4} className="t-action a-fill-soft a-stroke" strokeWidth={2} />
              <circle cx={panel.cx} cy={CY} r={19} className="t-mark a-stroke" fill="none" strokeWidth={3} />
              {DOTS[p].map(([x, y], i) => (
                <Dot key={i} x={panel.cx + x} y={CY + y} r={3.5} tone="accent" opacity={step >= panel.at ? 0.9 : 0} delay={i * 25} />
              ))}
            </g>
          ))}
          <Label x={PANELS[0].cx} y={250} tone="failure" size={14} weight={700} opacity={step >= 2 ? 1 : 0}>
            about 8 cm off
          </Label>
          <Label x={PANELS[1].cx} y={250} tone="success" size={14} weight={700} opacity={step >= 3 ? 1 : 0}>
            within millimetres
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
