"use client";

import { AnimationFrame, Bar, Label, Path } from "@/animations";

/** The chapter's table: the borrowed-reader policy, checked every 0.1M training examples (100 tries each). */
const CHECKS = [
  { name: "0.1M", aimed: 33, lifted: 1 },
  { name: "0.2M", aimed: 60, lifted: 3 },
  { name: "0.3M", aimed: 60, lifted: 2 },
  { name: "0.4M", aimed: 71, lifted: 5 },
];

const BASELINE = 236;
const HEIGHT = 170;
const GROUP_X = [120, 200, 280, 360];
const chanceY = BASELINE - HEIGHT * 0.33;

export function PointedNotGrasped() {
  return (
    <AnimationFrame
      title="Pointing is not grasping"
      description="The policy built on the borrowed reader, checked four times during training. The share of tries in which it closed the gripper at the named object rose from 33%, what luck gives with three objects, to 71%. The share in which it picked the object up stayed between 1% and 5%."
      steps={[
        "Three objects: closing at the named one by luck happens 1 time in 3.",
        "During training it aimed at the named object more and more: up to 71%.",
        "But it picked it up in only 5% of tries.",
        "It knew which object. It had not learned how to grip it.",
      ]}
      size={[480, 290]}
    >
      {(step) => (
        <>
          <rect className="a-t t-accent a-fill" x={60} y={18} width={14} height={14} rx={3} />
          <Label x={82} y={25} tone="ink" size={14} anchor="start">
            closed at the named object
          </Label>
          <rect className="a-t t-action a-fill" x={290} y={18} width={14} height={14} rx={3} />
          <Label x={312} y={25} tone="ink" size={14} anchor="start">
            picked it up
          </Label>

          <Path d={`M70 ${BASELINE}H420`} tone="faint" width={1.5} />
          <Path d={`M70 ${chanceY}H420`} tone="muted" width={1.5} dashed />
          <Label x={424} y={chanceY} tone="muted" size={13} anchor="start">
            luck
          </Label>

          {CHECKS.map((check, index) => (
            <g key={check.name}>
              <Bar
                x={GROUP_X[index] - 14}
                y={BASELINE}
                height={HEIGHT}
                value={step >= 1 ? check.aimed / 100 : 0}
                width={24}
                tone="accent"
                label={index === 3 && step >= 1 ? "71%" : undefined}
                delay={index * 120}
              />
              <Bar
                x={GROUP_X[index] + 14}
                y={BASELINE}
                height={HEIGHT}
                value={step >= 2 ? check.lifted / 100 : 0}
                width={24}
                tone="action"
                label={index === 3 && step >= 2 ? "5%" : undefined}
                delay={index * 120}
              />
              <Label x={GROUP_X[index]} y={BASELINE + 18} tone="faint" size={13} mono>
                {check.name}
              </Label>
            </g>
          ))}
          <Label x={420} y={BASELINE + 40} tone="faint" size={13} anchor="end">
            training examples seen
          </Label>

          <Label x={240} y={64} tone="ink" size={15} weight={700} opacity={step === 3 ? 1 : 0}>
            which: yes. how: not yet.
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
