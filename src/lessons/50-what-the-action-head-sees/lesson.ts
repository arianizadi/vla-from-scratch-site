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
      text: "A chef cooks with what is on the tray. The [action head](/learn/03-the-landscape) reads one row of tokens and nothing else: the noise level, the scene handed over by the backbone, the arm's joint angles, and one empty slot per future action.",
      animation: SequenceRow,
    },
    {
      title: "A summary or every patch",
      text: "A postcard saying “a red cube, top left” is not the photo. As in [pooling](/learn/21-pooled-vs-patch-tokens), some designs squeeze the scene into one summary; others put every patch token in the row. With patches, the cube's position comes free: it is the token that shows the cube.",
      animation: OneVsMany,
    },
    {
      title: "Which object, and exactly where",
      text: "Picking the right object is easier than finding its exact spot. We saw a policy given one summary learn which object, but miss it by about 8 cm; a grasp forgives about one. Policies given every patch token closed within millimetres. Other things differed between them too.",
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
    "More tokens cost more: every token is compared with every other, at every flow step.",
    "The arm's own position or last move can take over the job of saying where to go, and then the cameras matter less.",
  ],
  tips: [
    "Sketch the row your action head reads before training: what is in it, and roughly how many tokens.",
    "Look at where the gripper closes, not only at success, to see whether the scene gets through.",
    "If precision is the problem, pass the patch tokens rather than a single summary.",
  ],
  takeaway: "The action head knows only its row of tokens; pass it the patch tokens so “where” can reach it, then check it actually looks.",
  related: ["21-pooled-vs-patch-tokens", "51-language-conditioning", "52-history-and-shortcuts", "71-how-much-data-and-training"],
  lab: [
    { label: "When policies start to look at the scene", href: "/lab#what-it-depends-on" },
    { label: "Built-from-scratch and pretrained backbones", href: "/lab#backbones" },
  ],
  tryIt: ["sequence-layout", "pooled-vs-tokens"],
});
