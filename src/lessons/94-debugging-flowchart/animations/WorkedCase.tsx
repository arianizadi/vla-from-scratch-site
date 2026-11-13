"use client";

import { AnimationFrame, Box, Label } from "@/animations";
import { EXIT_X, FLOW_SIZE, Flow, rowY } from "./flow";

/** The chapter's worked example: a policy at 1 success in 100 on the three-object task. */
const AT: (number | `exit-${number}`)[] = [0, 1, 2, 3, "exit-3", "exit-3"];

export function WorkedCase() {
  return (
    <AnimationFrame
      title="One failing policy, four questions"
      description="A policy succeeded once in 100 tries. The expert passes the same test, so the test is sound. The policy copies the expert on recorded examples and closes its gripper every time. But it closes at the asked-for object only about one time in three, which is guessing: not looking. Reading its setup shows it was never given the instruction. Found without retraining anything."
      steps={[
        "A policy succeeded once in 100 tries. Start at the top: does the expert pass?",
        "Yes, 99 times in 100: the test is sound. Does the policy copy the expert?",
        "Yes, closely. Does the gripper close?",
        "Yes, every time. But does it close at the object it was asked for?",
        "Only about 1 time in 3: guessing. It isn’t looking.",
        "Its setup never fed it the instruction. Found without retraining anything.",
      ]}
      size={FLOW_SIZE}
    >
      {(step) => (
        <Flow
          at={AT[step]}
          exits={[false, false, false, step >= 4, false]}
          leaf={false}
          reached={Math.min(step, 3)}
          yes={["yes, 99 in 100", "yes, closely", "yes, every time"]}
        >
          <Label x={EXIT_X} y={rowY(3) + 32} tone="failure" size={14} weight={700} opacity={step >= 4 ? 1 : 0}>
            only 1 in 3
          </Label>
          <Box
            x={EXIT_X}
            y={rowY(4) + 24}
            w={140}
            h={52}
            label="its setup"
            sub="no instruction"
            tone="ink"
            filled
            active={step === 5}
            opacity={step >= 5 ? 1 : 0}
          />
        </Flow>
      )}
    </AnimationFrame>
  );
}
