import { defineLesson } from "../define";
import { LateLooking } from "./animations/LateLooking";
import { OneVsMany } from "./animations/OneVsMany";
import { SequenceRow } from "./animations/SequenceRow";
import { WhichVsWhere } from "./animations/WhichVsWhere";

export default defineLesson({
  slug: "50-what-the-action-head-sees",
  idea: "The part that writes the robot's moves sees only one row of tokens, so where things are must reach it through that row.",
  beats: [
    {
      title: "One row of tokens",
      text: "A chef cooks with what is on the tray. The **action head**, the part that writes the moves, reads one row of **tokens** (small lists of numbers): the noise level, the scene from the **backbone** (the part reading images and words), the arm's joints, and one slot per future action.",
      animation: SequenceRow,
    },
    {
      title: "A summary or the pieces",
      text: "A postcard saying “a red cube, top left” is not the photo. Some designs squeeze the scene into one summary; others pass every **image piece**, a small square of the picture, as its own token. With pieces, the cube's position comes free: it is the piece that shows the cube.",
      animation: OneVsMany,
    },
    {
      title: "Which object, and exactly where",
      text: "Picking the right object is easier than finding its exact spot. We saw a policy given one summary learn which object, but miss it by about 8 cm; a grasp forgives about one. Policies given every image piece closed within millimetres. Other things differed between them too.",
      animation: WhichVsWhere,
    },
    {
      title: "Being there is not being used",
      text: "A map on the passenger seat does not mean the driver reads it. The scene is in the row from the start, yet our policies ignored it for a long stretch, then started to look suddenly. Other inputs, like the arm's own position, can say where to go instead.",
      animation: LateLooking,
    },
  ],
  edgeCases: [
    "“If the information is in the input, the model uses it” is a misconception. Check where the gripper closes before trusting it.",
    "One summary has plenty of room for a position. The hard part is learning to write it there precisely enough to grasp.",
    "More tokens cost more: every token is compared with every other, at every refining step of the draft.",
    "The arm's own position or last move can take over the job of saying where to go, and then the cameras matter less.",
  ],
  tips: [
    "Sketch the row your action head reads before training: what is in it, and roughly how many tokens.",
    "Look at where the gripper closes, not only at success, to see whether the scene gets through.",
    "If precision is the problem, pass the image pieces rather than a single summary.",
  ],
  takeaway: "The action head knows only its row of tokens; pass it the image pieces so “where” can reach it, then check it actually looks.",
  related: ["21-pooled-vs-patch-tokens", "51-language-conditioning", "52-history-and-shortcuts", "71-how-much-data-and-training"],
  lab: [
    { label: "When policies start to look at the scene", href: "/lab#what-it-depends-on" },
    { label: "Built-from-scratch and pretrained backbones", href: "/lab#backbones" },
  ],
  tryIt: ["sequence-layout", "pooled-vs-tokens"],
});
