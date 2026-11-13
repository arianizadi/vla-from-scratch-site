"use client";

import { AnimationFrame, Bar, Label, Path, stagger } from "@/animations";

/** The chapter's single-cube policies: final training loss and success on 50 new scenes. */
const POLICIES = [
  { name: "A", loss: 0.04, success: 0.04, successText: "4%" },
  { name: "B", loss: 0.091, success: 0.3, successText: "30%" },
  { name: "C", loss: 0.058, success: 0.74, successText: "74%" },
];
const COLUMN = [180, 300, 420];
const LOSS_BASE = 130;
const SUCCESS_BASE = 256;

export function LossRanking() {
  return (
    <AnimationFrame
      title="The lowest loss, the weakest robot"
      description="Three policies trained on the same kind of task. A has the lowest training loss, B the highest. Run in the simulator, A succeeds 4% of the time, B 30% and C 74%: the policy with the lowest loss is the weakest robot."
      steps={[
        "Three policies and their training loss at the end. Lower means closer copying.",
        "By loss, A looks best.",
        "Now let each one drive in the simulator.",
        "A succeeds 4% of the time, C 74%. The lowest loss belonged to the weakest robot.",
      ]}
      size={[480, 290]}
    >
      {(step) => {
        const pointed = step === 1 || step === 3;
        return (
          <>
            {POLICIES.map((policy, index) => (
              <g key={policy.name}>
                <Label x={COLUMN[index]} y={24} tone="ink" size={17} weight={700}>
                  {policy.name}
                </Label>
                <Bar
                  x={COLUMN[index]}
                  y={LOSS_BASE}
                  height={80}
                  value={policy.loss / 0.1}
                  width={46}
                  tone={pointed && index === 0 ? "mark" : pointed ? "faint" : "ink"}
                  delay={stagger(index, 80)}
                />
                <Bar
                  x={COLUMN[index]}
                  y={SUCCESS_BASE}
                  height={90}
                  value={step >= 2 ? Math.max(0.02, policy.success) : 0}
                  width={46}
                  tone={step === 3 && index === 0 ? "failure" : "success"}
                  label={step >= 3 ? policy.successText : undefined}
                  opacity={step >= 2 ? 1 : 0}
                  delay={stagger(index, 120)}
                />
              </g>
            ))}
            <Label x={COLUMN[0]} y={LOSS_BASE - 50} tone="ink" size={14} weight={700} opacity={step === 1 ? 1 : 0}>
              lowest
            </Label>
            <Path d={`M118 ${LOSS_BASE}H462`} tone="faint" width={1.5} />
            <Path d={`M118 ${SUCCESS_BASE}H462`} tone="faint" width={1.5} />
            <Label x={16} y={LOSS_BASE - 16} tone="muted" size={14} anchor="start">
              training loss
            </Label>
            <Label x={16} y={SUCCESS_BASE - 16} tone="muted" size={14} anchor="start" opacity={step >= 2 ? 1 : 0}>
              success
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
