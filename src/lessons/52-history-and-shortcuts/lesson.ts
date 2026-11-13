import { defineLesson } from "../define";
import { KeepGoing } from "./animations/KeepGoing";
import { OneSwap } from "./animations/OneSwap";
import { SlotMismatch } from "./animations/SlotMismatch";
import { TwoFrames } from "./animations/TwoFrames";

export default defineLesson({
  slug: "52-history-and-shortcuts",
  idea: "Telling a policy what it did a moment ago shows motion, but it also offers a shortcut: keep going, without ever looking at the scene.",
  beats: [
    {
      title: "A memory of the moment before",
      text: "One photo cannot tell a flying ball from a resting one; two photos can. **History** gives the policy the moment before: the previous camera frame, the previous joint angles, and the **last action** it sent. It shows motion, and a new plan can carry on from the old one.",
      animation: TwoFrames,
    },
    {
      title: "The easy answer: keep going",
      text: "Forecasting “same as yesterday” is right most days. The expert moves smoothly, so “the last action, a bit further” predicts almost every recorded step without the cameras. Only the very first step, where the reach chooses which object, truly needs the scene. That is a tempting **shortcut**.",
      animation: KeepGoing,
    },
    {
      title: "Trained on the expert, run on itself",
      text: "In training, the last action is the expert's, and even the first one already points at the target. On the robot, the first last action is the arm at rest, which points nowhere. A policy that learned to read the target from its last action now has nothing to read.",
      animation: SlotMismatch,
    },
    {
      title: "Caught with one swap",
      text: "We had a history policy that nearly always failed and ignored the scene. Swapping one input, giving it the expert's first move instead of “at rest”, sent it to the named object almost every time: it had been reading the answer from there. Without history, the same recipe worked.",
      animation: OneSwap,
    },
  ],
  edgeCases: [
    "“More context always helps” is a misconception. Context that predicts the answer can replace looking.",
    "Starting every demonstration with a moment at rest did not cure it. After the first step, keep going still worked.",
    "The arm's own position is a milder version: once the arm is moving, it hints where it is heading.",
    "Recorded data hides the problem, because the expert's history is always there. It shows only when the policy drives.",
  ],
  tips: [
    "Test a history policy by swapping one input. If the result jumps, it reads the answer from that input.",
    "Start without history; add it only when the task really needs motion.",
    "Vary start poses and nudge objects, so the past stops predicting the future.",
  ],
  takeaway: "History tells a policy what it was doing, and that alone predicts the next move; if the cameras are never needed, the policy never learns to look.",
  related: ["43-imitation-learning", "50-what-the-action-head-sees", "93-train-inference-skew", "95-what-a-policy-looks-at"],
  lab: [
    { label: "What the history policy depended on", href: "/lab#history" },
    { label: "Where the failing policies closed the gripper", href: "/lab#before-the-fix" },
  ],
  tryIt: ["copycat"],
});
