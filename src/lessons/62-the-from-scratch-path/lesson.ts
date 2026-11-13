import { defineLesson } from "../define";
import { CaptionCheck } from "./animations/CaptionCheck";
import { ControlPair } from "./animations/ControlPair";
import { ThreeStages } from "./animations/ThreeStages";
import { TwinTest } from "./animations/TwinTest";

export default defineLesson({
  slug: "62-the-from-scratch-path",
  idea: "Instead of borrowing a reader, you can train every part yourself, one stage at a time, and then test fairly whether the earlier stages really help.",
  beats: [
    {
      title: "Three stages, like school",
      text: "First learn to read: a word model studies web text. Then learn to see: add eyes and train on captioned pictures of the robot's scenes. Then learn to act: add a mover and train on demonstrations. Each stage starts from what the last one learned: that head start is [pretraining](/learn/03-the-landscape).",
      animation: ThreeStages,
    },
    {
      title: "Test each stage before the next",
      text: "The seeing stage learns from captions that list the objects [from left to right](/learn/31-training-a-vlm). Before moving on, test it: on scenes it had never seen, our model listed the objects in the right order most of the time. A stage that fails its test spoils every stage after it.",
      animation: CaptionCheck,
    },
    {
      title: "A fair test needs a twin",
      text: "To test a plant fertiliser, grow two plants in the same soil and feed only one. A **control** is that second plant: a run identical except for the one thing tested. Here the twin's reader starts from random numbers. Any difference between the two is what the earlier stages bought.",
      animation: TwinTest,
    },
    {
      title: "A head start, not a higher finish",
      text: "Our first twin test failed: both twins scored near zero, and a test where both fail cannot show a difference. After fixing the recipe, the pretrained twin started aiming at the named object about four times sooner. By the end both did the task.",
      animation: ControlPair,
    },
  ],
  edgeCases: [
    "A low training loss can hide a broken stage: one picture model trained well, then failed its test because it saw pictures differently in use.",
    "Each stage must pass its own test before the next is worth training. A half-trained stage is accepted without complaint.",
    "If both twins fail, the comparison says nothing. Both must be clearly above luck before you compare them.",
    "One run of each twin is thin evidence; run-to-run luck can move results by several points.",
  ],
  tips: [
    "Judge the seeing stage by a test of what its captions teach, not by its training loss.",
    "Compare the twins at the same moments in training, not only at the end.",
    "Change exactly one thing between the twins, and write down what it was.",
    "Watch when a run starts aiming at the named object: that is where a head start shows first.",
  ],
  takeaway: "Building every stage yourself makes a fair twin test possible; here pretraining gave a head start, not a better ending.",
  related: ["61-pretrained-backbones", "60-anatomy-of-a-vla", "31-training-a-vlm", "102-case-pretrained-backbones"],
  lab: [
    { label: "The stage results and both twin tests", href: "/lab#backbones" },
  ],
  tryIt: ["onset"],
});
