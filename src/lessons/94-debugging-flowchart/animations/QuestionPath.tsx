"use client";

import { AnimationFrame } from "@/animations";
import { FLOW_SIZE, Flow } from "./flow";

export function QuestionPath() {
  return (
    <AnimationFrame
      title="Walk down the questions"
      description="A path of five questions, asked in order from the top. Does the hand-written expert pass the same test? Does the policy copy the expert on recorded examples? Does the gripper close? At the named object? Close enough to grasp? Each no leads to the right, to a likely cause: the test itself, training or inputs, the motion, not looking, precision. If every answer is yes, what remains is the grasp itself."
      steps={[
        "Start upstream: does the hand-written expert pass the same test? If not, fix the test.",
        "Does the policy copy the expert on recorded examples? If not, suspect training or its inputs.",
        "Does the gripper close at all? If not, look at the motion.",
        "Does it close at the object it was asked for? If not, it isn’t looking.",
        "Is it close enough to grasp? If not, it needs precision.",
        "Every answer yes: what remains is the grasp itself. The first no tells you where to dig.",
      ]}
      size={FLOW_SIZE}
    >
      {(step) => <Flow at={step} exits={[0, 1, 2, 3, 4].map((i) => step >= i)} leaf={step >= 5} reached={step} />}
    </AnimationFrame>
  );
}
