"use client";

import { AnimationFrame, Dot, Label, Path, scale, stagger } from "@/animations";
import { FOLLOWS, FOLLOWS_M, IGNORES, IGNORES_M, OBJECT_M, type Fit } from "./slope";

const LEFT = 84;
const RIGHT = 284;
const BOTTOM = 246;
const TOP = 56;
const X = scale([0.35, 0.65], [LEFT, RIGHT]);
const Y = scale([0.35, 0.65], [BOTTOM, TOP]);
const r = (value: number) => Math.round(value * 10) / 10;
const line = ({ slope, intercept }: Fit) =>
  `M${r(X(0.36))} ${r(Y(intercept + slope * 0.36))}L${r(X(0.64))} ${r(Y(intercept + slope * 0.64))}`;
const PLACES = ["left", "middle", "right"];
const PANEL = 318;

export function SlopeFollow() {
  return (
    <AnimationFrame
      title="Does the gripper follow the can?"
      description="A toy chart. Across three tries the can sits left, in the middle or right. Policy A closes the gripper close to wherever the can is, so its points climb and the best straight line through them has a slope near 1. Policy B closes in about the same place every time, so its line is flat, a slope near 0: where it closes does not depend on the scene."
      steps={[
        "Three tries: the can sits left, in the middle, then right.",
        "Policy A closes near wherever the can is. Its points climb.",
        "The straight line through them rises one for one: a slope near 1.",
        "Policy B closes in about the same place every time.",
        "Its line is flat, a slope near 0: it is not looking at the scene.",
      ]}
      size={[480, 316]}
    >
      {(step) => (
        <>
          <path d={`M${LEFT - 14} ${TOP - 14}V${BOTTOM + 14}H${RIGHT + 14}`} className="t-faint a-stroke" strokeWidth={1.5} fill="none" />
          <Label x={20} y={22} tone="muted" size={14} anchor="start">
            where the gripper closed
          </Label>
          <Label x={(LEFT + RIGHT) / 2} y={296} tone="muted" size={14}>
            where the can was
          </Label>
          {OBJECT_M.map((value, index) => (
            <g key={`place-${value}`}>
              <Label x={X(value)} y={BOTTOM + 34} tone="faint" size={13}>
                {PLACES[index]}
              </Label>
              <Label x={LEFT - 22} y={Y(value)} tone="faint" size={13} anchor="end">
                {PLACES[index]}
              </Label>
              <Dot x={X(value)} y={BOTTOM + 14} r={9} tone="action" hollow delay={stagger(index, 150)} />
            </g>
          ))}

          <Path d={line(FOLLOWS)} tone="action" width={3} drawn={step >= 2} />
          {FOLLOWS_M.map((value, index) => (
            <Dot
              key={`a-${index}`}
              x={X(OBJECT_M[index])}
              y={step >= 1 ? Y(value) : BOTTOM + 14}
              r={7}
              tone="action"
              opacity={step >= 1 ? 1 : 0}
              delay={stagger(index, 140)}
            />
          ))}
          <Path d={line(IGNORES)} tone="ink" width={3} drawn={step >= 4} />
          {IGNORES_M.map((value, index) => (
            <Dot
              key={`b-${index}`}
              x={X(OBJECT_M[index])}
              y={step >= 3 ? Y(value) : BOTTOM + 14}
              r={7}
              tone="ink"
              hollow
              opacity={step >= 3 ? 1 : 0}
              delay={stagger(index, 140)}
            />
          ))}

          <Label x={PANEL} y={78} tone="action" size={16} weight={700} anchor="start" opacity={step >= 1 ? 1 : 0}>
            policy A
          </Label>
          <Label x={PANEL} y={104} tone="ink" size={15} anchor="start" opacity={step >= 2 ? 1 : 0}>
            slope ≈ 1
          </Label>
          <Label x={PANEL} y={128} tone="muted" size={14} anchor="start" opacity={step >= 2 ? 1 : 0}>
            follows the can
          </Label>
          <Label x={PANEL} y={176} tone="ink" size={16} weight={700} anchor="start" opacity={step >= 3 ? 1 : 0}>
            policy B
          </Label>
          <Label x={PANEL} y={202} tone="ink" size={15} anchor="start" opacity={step >= 4 ? 1 : 0}>
            slope ≈ 0
          </Label>
          <Label x={PANEL} y={226} tone="muted" size={14} anchor="start" opacity={step >= 4 ? 1 : 0}>
            ignores the scene
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
