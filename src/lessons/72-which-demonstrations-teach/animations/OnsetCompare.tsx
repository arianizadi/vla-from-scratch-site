"use client";

import { AnimationFrame, Bar, Label, Path } from "@/animations";

/* The chapter's numbers, one run each, 4000 demonstrations, 100 new scenes per
   check. Left: how often the gripper closed at the named object. Right:
   success when the object is moved mid-reach. */

const BASELINE = 220;
const HEIGHT = 136;
const CHECKS = [
  { name: "0.5M", plain: 36, varied: 50, x: 76 },
  { name: "1M", plain: 65, varied: 100, x: 150 },
  { name: "1.5M", plain: 98, varied: 100, x: 224 },
];
const chanceY = BASELINE - HEIGHT * 0.33;

export function OnsetCompare() {
  return (
    <AnimationFrame
      title="Looking sooner, coping with surprises"
      description="Two robots trained on 4000 demonstrations each. Trained on plain demonstrations, the robot closed at the named object 36%, 65% and 98% of the time after 0.5, 1 and 1.5 million examples; trained with random starts and bumps, 50%, 100% and 100%. With the object moved mid-reach, the plain one succeeded in none of 97 tries, the varied one in 89 to 94% depending on the move."
      steps={[
        "Plain demonstrations: the robot starts aiming at the named object by 1.5M.",
        "With random starts and bumps, it aims right already at 1M.",
        "Now move the object mid-reach. The plain robot: 0 of 97.",
        "The robot that saw bumps: about 9 in 10.",
      ]}
      size={[480, 290]}
    >
      {(step) => (
        <>
          <rect className="a-t t-muted a-fill" x={40} y={14} width={14} height={14} rx={3} />
          <Label x={62} y={21} tone="ink" size={14} anchor="start">
            plain
          </Label>
          <rect className="a-t t-accent a-fill" x={126} y={14} width={14} height={14} rx={3} style={{ opacity: step >= 1 ? 1 : 0.35 }} />
          <Label x={148} y={21} tone="ink" size={14} anchor="start" opacity={step >= 1 ? 1 : 0.35}>
            random starts and bumps
          </Label>

          <Label x={40} y={52} tone="muted" size={13} anchor="start">
            aimed at the named object
          </Label>
          <Path d={`M40 ${BASELINE}H266`} tone="faint" width={1.5} />
          <Path d={`M40 ${chanceY}H266`} tone="muted" width={1.25} dashed />
          <Label x={36} y={chanceY} tone="faint" size={13} anchor="end">
            luck
          </Label>
          {CHECKS.map((check, index) => (
            <g key={check.name}>
              <Bar x={check.x - 13} y={BASELINE} height={HEIGHT} value={check.plain / 100} width={22} tone="muted" delay={index * 120} />
              <Bar x={check.x + 13} y={BASELINE} height={HEIGHT} value={step >= 1 ? check.varied / 100 : 0} width={22} tone="accent" delay={index * 120} />
              <Label x={check.x} y={BASELINE + 18} tone="faint" size={13} mono>
                {check.name}
              </Label>
            </g>
          ))}
          <Label x={266} y={BASELINE + 40} tone="faint" size={13} anchor="end">
            training examples seen
          </Label>

          <Path d={`M296 40V${BASELINE + 40}`} tone="faint" width={1} />

          <Label x={386} y={52} tone="muted" size={13} opacity={step >= 2 ? 1 : 0}>
            object moved mid-reach
          </Label>
          <Path d={`M322 ${BASELINE}H450`} tone="faint" width={1.5} opacity={step >= 2 ? 1 : 0} />
          <Bar x={356} y={BASELINE} height={HEIGHT} value={0.005} width={40} tone="muted" label={step >= 2 ? "0%" : undefined} opacity={step >= 2 ? 1 : 0} />
          <Bar x={416} y={BASELINE} height={HEIGHT} value={step >= 3 ? 0.91 : 0} width={40} tone="accent" label={step >= 3 ? "89-94%" : undefined} opacity={step >= 2 ? 1 : 0} />
          <Label x={386} y={BASELINE + 18} tone="faint" size={13} opacity={step >= 2 ? 1 : 0}>
            success
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
