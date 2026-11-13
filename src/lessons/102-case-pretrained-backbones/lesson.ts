import { defineLesson } from "../define";
import { BackboneHead } from "./animations/BackboneHead";
import { EarlierStart } from "./animations/EarlierStart";
import { FinishRanges } from "./animations/FinishRanges";
import { FloorCompare } from "./animations/FloorCompare";

export default defineLesson({
  slug: "102-case-pretrained-backbones",
  idea: "Starting the robot's eyes from a model that already knew these scenes made it look at the right object much earlier, but it did not finish better.",
  beats: [
    {
      title: "Eyes and hands",
      text: "The robot's model has two parts. The **backbone** turns camera pictures and words into notes; the **action head** turns notes into motion. A backbone can start blank or **pretrained**: already taught another job, here describing these very scenes. Like hiring a cook who already knows the kitchen.",
      animation: BackboneHead,
    },
    {
      title: "A comparison stuck on the floor",
      text: "The first test: both versions lifted the named object 0 and 1 times in 100, and went for it about one time in three, pure guessing. Comparing them was like timing two runners who never left bed. The recipe itself had problems, and those had to be fixed first.",
      animation: FloorCompare,
    },
    {
      title: "An earlier start",
      text: "With the recipe fixed, the pretrained version went for the named object from its first saved snapshot. The blank one guessed for about three quarters of a million more training examples, then rose the same way. The new cook gets going on day one; the other catches up.",
      animation: EarlierStart,
    },
    {
      title: "The same finish, within the wobble",
      text: "At the end they lifted the object 87 and 85 times in 100. A test of 100 tries wobbles by several points, and each version was trained only once, so these scores cannot rank them. On this simple task, pretraining bought time, not a better robot.",
      animation: FinishRanges,
    },
  ],
  edgeCases: [
    "If both sides score near zero, the comparison says nothing. First make sure the recipe can work at all.",
    "Comparing only final scores hides the real difference here: when looking at the right object began.",
    "Changing several things at once, then crediting one of them, is a common trap. Change one thing per comparison.",
    "Bigger is not automatically better: a small model without any language knowledge did as well on this task, and trained about four times faster.",
  ],
  tips: [
    "Compare two versions at equal amounts of training, snapshot by snapshot, not only at the end.",
    "Train each version more than once before trusting a gap of a few points.",
    "Try the small, plain model first; reach for a pretrained one when the task really needs what it knows.",
  ],
  takeaway: "On this simple task, a pretrained backbone made the robot start looking much earlier, but did not make it finish better.",
  related: ["61-pretrained-backbones", "62-the-from-scratch-path", "50-what-the-action-head-sees", "110-toward-real-tasks"],
  lab: [{ label: "The backbone pair, snapshot by snapshot", href: "/lab#backbones" }],
  tryIt: ["onset", "loss-vs-success"],
});
