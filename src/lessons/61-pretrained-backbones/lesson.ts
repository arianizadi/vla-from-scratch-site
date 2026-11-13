import { defineLesson } from "../define";
import { FrozenStack } from "./animations/FrozenStack";
import { PatchMerge } from "./animations/PatchMerge";
import { PointedNotGrasped } from "./animations/PointedNotGrasped";
import { WordToObject } from "./animations/WordToObject";

export default defineLesson({
  slug: "61-pretrained-backbones",
  idea: "A borrowed reader that learned words and pictures from the web knows early which object you mean, but it is big, slow and still has to learn to grasp.",
  beats: [
    {
      title: "Borrow a reader that already knows",
      text: "Hiring a translator beats teaching someone a language from zero. A pretrained [vision-language model](/learn/30-joining-vision-and-language) learned from huge piles of captioned photos before it met a robot. It already links the words “green can” to the green can in view. A homemade reader must discover that link slowly from demonstrations.",
      animation: WordToObject,
    },
    {
      title: "Every picture costs tokens",
      text: "Like any vision-language model, the reader [glues neighbouring patches](/learn/30-joining-vision-and-language) into tokens, a few dozen per picture. Every token is more work each time the robot looks, and a slightly bigger picture means many more tokens. This big reader trained about 20 times slower than a small homemade one.",
      animation: PatchMerge,
    },
    {
      title: "Freeze most, train the top",
      text: "Renovate the top floor and leave the foundations. The lower blocks already see and read well, so they stay [frozen](/learn/22-pretrained-vision-encoders): training leaves their numbers alone. Only the top few blocks and the mover learn. That keeps the borrowed knowledge and saves a lot of memory.",
      animation: FrozenStack,
    },
    {
      title: "It pointed, but did not grasp",
      text: "Early in training it closed the gripper at the named object far more often than chance, while our homemade readers still guessed. Yet it lifted the object only about 1 time in 20. Knowing which is not knowing how to grip. Handed [many notes](/learn/60-anatomy-of-a-vla), it later reached about 70%.",
      animation: PointedNotGrasped,
    },
  ],
  edgeCases: [
    "Pretrained does not mean ready: the exact grip still has to come from your own demonstrations.",
    "Changing the camera picture size silently changes how many tokens each picture costs, and with it memory and speed.",
    "Frozen layers cannot adapt. If your scenes look nothing like web photos, the frozen part may miss what matters.",
    "A short run proves little: a small model on the same data was also near zero early, then climbed past 60%.",
  ],
  tips: [
    "Try a small model trained from scratch first. Here it trained far faster and solved the task.",
    "Choose the picture size on purpose: it sets the token count, the memory and the speed.",
    "Measure whether the robot aims at the right object separately from whether it succeeds.",
    "Give a big borrowed reader a long enough run before judging it; it learns which object before it learns how.",
  ],
  takeaway: "A borrowed reader knows which object you mean from the start, but pointing is not grasping: the hands still have to learn.",
  related: ["60-anatomy-of-a-vla", "62-the-from-scratch-path", "22-pretrained-vision-encoders", "102-case-pretrained-backbones"],
  lab: [
    { label: "The borrowed reader and the homemade ones side by side", href: "/lab#backbones" },
    { label: "The first round, where one note failed", href: "/lab#before-the-fix" },
  ],
  tryIt: ["patchify", "pooled-vs-tokens"],
});
