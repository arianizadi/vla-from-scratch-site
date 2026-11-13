import { defineLesson } from "../define";
import { DemoHabit } from "./animations/DemoHabit";
import { FrozenCamera } from "./animations/FrozenCamera";
import { MoveTarget } from "./animations/MoveTarget";
import { TwoHabits } from "./animations/TwoHabits";

export default defineLesson({
  slug: "95-what-a-policy-looks-at",
  idea: "A success rate says how often a policy finishes, not what it pays attention to; changing one thing mid-task shows whether it keeps looking.",
  beats: [
    {
      title: "Same score, different habits",
      text: "Two drivers reach the same parking spot. One watches the road; the other memorised the route. On an empty road you can't tell them apart. A policy can **look every time** it plans, or **look once** and then carry on. On a still table, both score the same.",
      animation: TwoHabits,
    },
    {
      title: "Move the target",
      text: "A **probe** changes one thing and keeps everything else equal. Here: slide the can aside halfway through the reach. A policy that keeps looking follows it; one that looked once closes where the can used to be. Ours lifted the object 85 times in 100; slid aside midway, not once.",
      animation: MoveTarget,
    },
    {
      title: "Freeze the cameras",
      text: "Tape a photo over the windscreen: show the policy only the first camera picture, for the whole try. It still headed for the right object nearly every time, so it chose its target at that first look. But it almost always fumbled the grasp: the last centimetres need fresh pictures.",
      animation: FrozenCamera,
    },
    {
      title: "The habit comes from the examples",
      text: "The scripted expert planned once per try, from one starting pose, and nothing ever moved. Probe it the same way and it fails the same way: the policy copied that habit. Examples with varied starts and moved objects, which the expert chases, taught a policy to turn back.",
      animation: DemoHabit,
    },
  ],
  edgeCases: [
    "A frozen first picture still shows every object, so it can't reveal how the target was chosen, only whether later pictures are needed.",
    "Closing the gripper a second time is not a recovery. It may close again where the object used to be.",
    "If the expert fails a probe too, the probe asks for something the examples never showed. Fix the examples, not the policy.",
    "A probe tells you what this policy used, not what every policy of its kind does: other policies answer the same probe differently.",
  ],
  tips: [
    "Before running a probe, write down what a look-once and a look-every-time policy would each do.",
    "Change one thing at a time, on the same table layouts and the same trained policy.",
    "Move the object at different moments: early in the reach, late, and as the gripper closes.",
    "Run the expert through every probe first. It tells you which failures are fair to expect.",
  ],
  takeaway: "A score says how often, not how: change one thing mid-task and watch whether the policy notices.",
  related: ["92-measuring-failure", "94-debugging-flowchart", "72-which-demonstrations-teach", "103-case-self-correction"],
  lab: [
    { label: "What the working policy depends on", href: "/lab#what-it-depends-on" },
    { label: "Moved objects and other changes it never saw", href: "/lab#outside-the-training-conditions" },
    { label: "Which examples teach it to turn back", href: "/lab#demonstrations" },
  ],
  tryIt: ["disturbance", "grasp-map"],
});
