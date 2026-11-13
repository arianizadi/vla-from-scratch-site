"use client";

import { AnimationFrame, Bar, Label, Path, stagger } from "@/animations";

/** The first comparison (lab notebook, pick_target first round): out of 100 tries each. */
const SIDES = [
  { name: "pretrained", lifted: 0, named: 33 },
  { name: "blank", lifted: 1, named: 29 },
];
const BASE = 236;
const H = 150;
const CHANCE = 100 / 3;

export function FloorCompare() {
  return (
    <AnimationFrame
      title="A comparison stuck on the floor"
      description="The first comparison of a pretrained and a blank backbone. Out of 100 tries, they lifted the named object 0 and 1 times, and went for the named object 33 and 29 times: about one time in three, which is what guessing among three objects gives. With both sides on the floor, no difference between them could show."
      steps={[
        "The first try: the same robot, once with a pretrained backbone, once with a blank one.",
        "Lifted the named object: 0 and 1 times in 100.",
        "Went for the named object: about 1 time in 3, the same as guessing among three.",
        "Both on the floor: no difference can show. The recipe had to work first.",
      ]}
      size={[480, 302]}
      hold={[2400, 2400, 2800, 3600]}
    >
      {(step) => (
        <>
          <Label x={120} y={42} tone="muted" size={13} opacity={step >= 1 ? 1 : 0}>
            lifted it, per 100 tries
          </Label>
          <Label x={350} y={42} tone="muted" size={13} opacity={step >= 2 ? 1 : 0}>
            went for it, per 100 tries
          </Label>
          <rect x={30} y={BASE - 64} width={420} height={96} rx={10} className="a-t t-mark a-fill-soft" style={{ opacity: step === 3 ? 0.6 : 0 }} />
          <Path d={`M50 ${BASE}H190M270 ${BASE}H440`} tone="faint" width={1.5} />
          {SIDES.map((side, i) => (
            <g key={side.name}>
              <Bar x={90 + i * 60} y={BASE} height={H} value={step >= 1 ? side.lifted / 100 : 0} width={34} tone="muted" label={step >= 1 ? `${side.lifted}` : undefined} name={side.name} delay={stagger(i, 120)} />
              <Bar x={320 + i * 70} y={BASE} height={H} value={step >= 2 ? side.named / 100 : 0} width={34} tone="muted" name={side.name} delay={stagger(i, 120)} />
              <g className="a-t" style={{ opacity: step >= 2 ? 1 : 0, transitionDelay: "300ms" }}>
                <text x={320 + i * 70} y={BASE - (H * side.named) / 200} fontSize={14} fontWeight={700} textAnchor="middle" dominantBaseline="central" className="a-label" style={{ fill: "var(--surface)" }}>
                  {side.named}
                </text>
              </g>
            </g>
          ))}
          <Path d={`M280 ${BASE - (H * CHANCE) / 100}H436`} tone="failure" width={2} dashed drawn={step >= 2} />
          <Label x={436} y={BASE - (H * CHANCE) / 100 - 30} tone="failure" size={13} weight={700} anchor="end" opacity={step >= 2 ? 1 : 0}>
            guessing: 1 in 3
          </Label>
          <Label x={240} y={BASE + 50} tone="ink" size={14} weight={700} opacity={step === 3 ? 1 : 0}>
            both on the floor: nothing to compare
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
