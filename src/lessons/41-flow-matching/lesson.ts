import { defineLesson } from "../define";
import { AveragingFails } from "./animations/AveragingFails";
import { FlowSampling } from "./animations/FlowSampling";
import { NoisePath } from "./animations/NoisePath";
import { StepCount } from "./animations/StepCount";

export default defineLesson({
  slug: "41-flow-matching",
  idea: "Instead of guessing one action, the policy learns to turn random noise into an action, so two right answers never blur into a wrong one.",
  beats: [
    {
      title: "Two right answers, one wrong average",
      text: "Told “meet me at the left door or the right door”, splitting the difference walks you into the wall. A policy trained to give one answer does exactly that: it learns the **average** of the right answers. With two identical cubes, the robot grabs the empty gap between them.",
      animation: AveragingFails,
    },
    {
      title: "Learn which way is clean",
      text: "Training blends a real action with random noise, sometimes a little, sometimes a lot. The policy sees the blend and learns one thing: the direction from the action toward the noise. Every blend has one clear answer, so nothing gets averaged away. This recipe is called **flow matching**.",
      animation: NoisePath,
    },
    {
      title: "Walk back from noise",
      text: "Like a sculptor revealing a figure, the policy starts from pure noise and takes a few small **flow steps** against that direction. Early on, every point heads for the middle. As the noise fades, each one commits to a side. Every draw ends on one real action.",
      animation: FlowSampling,
    },
    {
      title: "Enough steps to commit",
      text: "One big step is a guess made at full noise: the average again. A handful of steps gives each draw time to pick a side; more steps cost time on the robot. On our policies, few steps were enough for one, too few for others, so test before choosing.",
      animation: StepCount,
    },
  ],
  edgeCases: [
    "A gripper closing on empty table does not always mean averaging. Here it usually meant the policy was not looking at the scene at all.",
    "Too few steps quietly bring the average back. The robot still moves smoothly, but to the wrong place.",
    "Papers disagree on which end is noise and which is the action. Mixing two conventions flips the direction the policy walks.",
    "A policy that is also given its previous action must keep that part clean between steps, or it drifts somewhere it never trained.",
  ],
  tips: [
    "Try a few step counts on the exact policy you will run; the best number varies.",
    "Draw twice for the same scene. Two different but sensible actions mean the walk from noise works.",
    "One step behaves like plain averaging, which makes it a useful yardstick to compare against.",
  ],
  takeaway: "Flow matching teaches a policy to walk from noise to an action, so it lands on one right answer instead of the average of several.",
  related: ["40-action-spaces", "42-chunks-and-execution", "52-history-and-shortcuts", "92-measuring-failure"],
  lab: [
    { label: "Success and speed with different numbers of flow steps", href: "/lab#sampler" },
    { label: "Where the failing policies closed the gripper", href: "/lab#before-the-fix" },
  ],
  tryIt: ["flow-matching"],
});
