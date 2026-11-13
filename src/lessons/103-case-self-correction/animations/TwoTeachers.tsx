"use client";

import { AnimationFrame, Label, Path, lerp } from "@/animations";
import { CloseMark, TopGripper, TopObject } from "./topdown";

const START: [number, number] = [34, 70];
const OLD: [number, number] = [170, 118];
const NEW: [number, number] = [112, 214];
const at = (t: number): [number, number] => [lerp(START[0], OLD[0], t), lerp(START[1], OLD[1], t)];
const TURN = at(0.5);
const PANELS = [
  { x: 0, title: "plans once", replans: false },
  { x: 244, title: "plans again", replans: true },
];

export function TwoTeachers() {
  return (
    <AnimationFrame
      title="Two scripted experts, the same test"
      description="Two scripted experts reach for the same can, seen from above. Halfway, the can is slid to a new place. The expert that made one plan at the start keeps going and closes where the can was: a failure. The expert that plans again whenever the can moves turns toward the new place and grasps it: it succeeds every time. So recovering is possible."
      steps={[
        "Two scripted experts reach for the same can.",
        "Halfway, the can is slid to a new place.",
        "The one that planned once goes on to the old place: it fails every time.",
        "The one that plans again turns toward the new place: it succeeds every time.",
      ]}
      size={[480, 290]}
      hold={[2200, 2200, 2600, 3600]}
    >
      {(step) => (
        <>
          <Path d="M240 16V276" tone="faint" width={1.5} dashed />
          {PANELS.map((panel) => {
            const moved = step >= 1;
            const done = panel.replans ? step >= 3 : step >= 2;
            const [gx, gy] = step === 0 ? at(0.3) : !done ? TURN : panel.replans ? NEW : OLD;
            const ok = panel.replans;
            return (
              <g key={panel.title} transform={`translate(${panel.x} 0)`}>
                <Label x={120} y={24} tone="ink" size={15} weight={700}>
                  {panel.title}
                </Label>
                <TopObject kind="can" x={OLD[0]} y={OLD[1]} ghost opacity={moved ? 1 : 0} />
                <TopObject kind="can" x={moved ? NEW[0] : OLD[0]} y={moved ? NEW[1] : OLD[1]} tone="action" />
                <Path d={`M${START[0]} ${START[1]}L${OLD[0]} ${OLD[1]}`} tone="faint" width={2} dashed />
                {panel.replans ? <Path d={`M${TURN[0]} ${TURN[1]}L${NEW[0]} ${NEW[1]}`} tone="success" width={2.5} drawn={step >= 3} /> : null}
                <TopGripper x={gx} y={gy} closed={done} />
                {ok ? null : <CloseMark x={OLD[0]} y={OLD[1]} opacity={done ? 1 : 0} delay={300} />}
                <Label x={120} y={262} tone={ok ? "success" : "failure"} size={15} weight={700} opacity={done ? 1 : 0} delay={300}>
                  {ok ? "succeeds ✓" : "closes on nothing ✗"}
                </Label>
              </g>
            );
          })}
        </>
      )}
    </AnimationFrame>
  );
}
