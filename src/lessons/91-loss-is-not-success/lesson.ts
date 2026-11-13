import { defineLesson } from "../define";
import { EasyMoments } from "./animations/EasyMoments";
import { FlatLossRisingSuccess } from "./animations/FlatLossRisingSuccess";
import { LossRanking } from "./animations/LossRanking";
import { Snowball } from "./animations/Snowball";

export default defineLesson({
  slug: "91-loss-is-not-success",
  idea: "A low training loss means the policy copies recorded moves well, not that the robot succeeds; only letting it drive in the simulator tells you that.",
  beats: [
    {
      title: "Two different questions",
      text: "The **loss** asks: on recorded moments, how close are the predicted moves to the demonstrator's? Success asks: left alone, does the robot pick up the object? A student can copy worked examples perfectly and still freeze on a fresh problem. Here, the policy with the lowest loss was the weakest robot.",
      animation: LossRanking,
    },
    {
      title: "Most moments are easy",
      text: "Once the arm is moving, the next move is almost the last one again, like guessing where a rolling ball goes next. Those moments fill nearly all the training data, and a policy can score well on them without looking. The moment that chooses the object is rare, and the loss averages it away.",
      animation: EasyMoments,
    },
    {
      title: "Small misses snowball",
      text: "When the policy drives, its own moves decide what it sees next. A first move slightly off leads to a view no demonstration showed, where the next guess is worse, and the error grows. Recorded data never shows this, because there the demonstrator was always at the wheel.",
      animation: Snowball,
    },
    {
      title: "Test the robot, from the start",
      text: "In one run the loss barely moved while success climbed from almost zero to 85%. Learning to use the camera arrived late, and the loss gave no sign of it. So let the robot drive in the simulator at every save point, from the very first one, and judge it by that.",
      animation: FlatLossRisingSuccess,
    },
  ],
  edgeCases: [
    "Losses from different tasks are not on one scale: each task has its own floor of what cannot be predicted.",
    "Near the end of any run the loss flattens because the steps shrink, whether or not the robot has learned to look.",
    "A policy fed its own previous move can lean on it and score well on recordings. The first move of a real attempt has no such hint.",
    "One save point holds two sets of weights but reports one loss, and their success can differ by tens of points.",
    "Scoring on the training recordings measures memory, not skill.",
  ],
  tips: [
    "Use the loss to catch broken training, which never falls at all, not to rank policies.",
    "Let the robot drive in the simulator from the first save point on.",
    "While success is still near zero, watch whether the gripper heads for the named object. That moves first.",
    "Check the first move of an attempt on its own: that is where the decision happens.",
  ],
  takeaway: "The loss scores copying on recorded moments; success is the robot doing the task on its own. Only success tells you whether the policy works.",
  related: ["90-closed-loop-evaluation", "92-measuring-failure", "43-imitation-learning", "52-history-and-shortcuts"],
  lab: [
    { label: "Success at every save point of one run", href: "/lab#demonstrations-by-checkpoint" },
    { label: "Where the failing policies closed the gripper", href: "/lab#before-the-fix" },
  ],
  tryIt: ["loss-vs-success"],
});
