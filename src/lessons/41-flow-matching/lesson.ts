import { defineLesson } from "../define";
import { AveragingFails } from "./animations/AveragingFails";
import { FlowSampling } from "./animations/FlowSampling";
import { NoisePath } from "./animations/NoisePath";
import { StepCount } from "./animations/StepCount";

export default defineLesson({
  slug: "41-flow-matching",
  idea: "Instead of predicting one action, the policy learns to carry random noise to an action, so two right answers never blur into a wrong one.",
  beats: [
    {
      title: "Averaging two right answers",
      text: "Often more than one action is correct: reach for the left cube or the right one. Trained with squared error to output “the” action, a network learns the **average** of the correct ones. Here that is the empty gap between the cubes, an action no demonstration contains.",
      animation: AveragingFails,
    },
    {
      title: "Train on noisy mixtures",
      text: "Take a demonstrated action and random noise of the same shape. Pick a **noise level** s from 0 to 1 and mix them: a point on the straight line from the action (s = 0) to the noise (s = 1). The network sees that point and learns the line's direction: noise minus action.",
      animation: NoisePath,
    },
    {
      title: "Walk back from noise",
      text: "To act, start from pure noise and take a few **flow steps** against the predicted direction. Each step moves toward the current best guess. Early on that guess is the average; as the noise fades it commits to one side. Every draw ends on one real action.",
      animation: FlowSampling,
    },
    {
      title: "Too few steps fall short",
      text: "With one flow step, the guess is made at full noise: the average again. In the toy, 1 step puts no draw on a target, 2 steps 13.9%, 4 steps 89.6% and 10 steps all of them. Fewer steps are faster, so the right count is a trade.",
      animation: StepCount,
    },
    {
      title: "What the robot showed",
      text: "On one policy, 2 flow steps succeeded in 89 and 90 of 100 layouts, at 25 ms per chunk; 10 steps scored 85 and 83, at 71 ms. On two other policies, 2 steps cost 12 to 19 points. The best count depends on the policy.",
    },
  ],
  edgeCases: [
    "A gripper closing on empty table was never a draw between objects here: those policies ignored the scene. Check the slope before blaming the sampler.",
    "Pick a step count that divides 1000. With 7, the integer step size makes 8 passes and overshoots the path by 13.6%.",
    "Training mixtures are clamped to ±3, but sampling starts from unclamped noise, so a few starting numbers lie outside what the network saw.",
    "Here s = 0 is the action and the target is noise minus action. Papers that put noise at time 0 and predict data minus noise need both flipped.",
    "A policy fed its previous action must keep that row clean: restore it after every flow step, or it drifts along an untrained direction.",
  ],
  tips: [
    "Sweep 1, 2, 4, 10 and 20 flow steps on the exact policy you will run.",
    "Draw twice for one observation. Close together, or about one target apart, means the sampler works.",
    "One flow step is regression: it returns the average chunk. Use it as a baseline.",
    "Time the steps on your hardware: each one is another pass of the action transformer.",
  ],
  takeaway: "Flow matching still trains with plain squared error, but the averaging happens along the path from noise, not at the end, so each draw lands on one real action.",
  related: ["40-action-spaces", "42-chunks-and-execution", "52-history-and-shortcuts", "92-measuring-failure"],
  lab: [
    { label: "Success and latency from 1 to 20 flow steps", href: "/lab#sampler" },
    { label: "Where the failing policies closed the gripper", href: "/lab#before-the-fix" },
  ],
  tryIt: ["flow-matching"],
});
