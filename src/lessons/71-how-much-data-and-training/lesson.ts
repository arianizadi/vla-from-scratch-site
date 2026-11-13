import { defineLesson } from "../define";
import { AimThenGrip } from "./animations/AimThenGrip";
import { CutShort } from "./animations/CutShort";
import { LooksLate } from "./animations/LooksLate";
import { TwoDials } from "./animations/TwoDials";

export default defineLesson({
  slug: "71-how-much-data-and-training",
  idea: "A robot learns to move long before it learns to look at which object is named, so a run stopped too early makes a good design look broken.",
  beats: [
    {
      title: "Two dials: scenes and practice",
      text: "A pianist needs both pieces to learn and hours to practise. Here the first dial is the number of demonstrations: how many different scenes the robot sees. The second is the number of training examples: how long it practises on them. One pass through every practice card is an **epoch**.",
      animation: TwoDials,
    },
    {
      title: "It moves first and looks later",
      text: "Early in training the arm reaches smoothly, but to one of the three objects at random, about one time in three. For a long while nothing seems to change. Then, fairly suddenly, it starts closing at the object the instruction named. Learning to look arrives late, and all at once.",
      animation: LooksLate,
    },
    {
      title: "Aim first, grip last",
      text: "Success comes last because a grasp forgives little. Closing near the right object is not enough; the fingers must land within about a centimetre. So the robot aims right long before it picks things up. Watch where it closes, not only whether it succeeded: aiming tells you learning has started.",
      animation: AimThenGrip,
    },
    {
      title: "Stopped too early",
      text: "One run stopped after 1 million examples and scored 3%. It looked like a broken design. The same design on the same data, trained three times as long, took off soon after that point and ended around 60%. The short run had stopped right before the climb.",
      animation: CutShort,
    },
    {
      title: "More scenes, a higher ceiling",
      text: "With 4000 demonstrations instead of 1500, success levelled off higher: about 85% against about 63%. More scenes raise the ceiling; more practice gets you up to it. Where the sudden jump lands also moved by a million examples between two otherwise identical runs, so leave room.",
    },
  ],
  edgeCases: [
    "A flat 0% says nothing about what comes next: the run that ended at 85% was at 0% after 1 million examples.",
    "A shorter run is not the first part of a longer one. Training slows its learning steps toward the end, so a short run slows down sooner.",
    "Two runs that differ only by luck can make the jump a million examples apart.",
    "Ranking two designs after a short run ranks when they start to look, not where they end.",
  ],
  tips: [
    "Check the robot at many points during training, not only at the end.",
    "Read where the gripper closes before reading the success rate.",
    "Give a new design a generous first run; it becomes the yardstick for later ones.",
    "Plan at least twice the practice it took a similar run to start looking.",
  ],
  takeaway: "Learning to look arrives late and suddenly, and success comes after it, so judge a run by where it aims before you judge it by what it lifts.",
  related: ["70-demonstrations", "72-which-demonstrations-teach", "80-the-training-loop", "92-measuring-failure"],
  lab: [
    { label: "How data and training time moved the result", href: "/lab#what-it-depends-on" },
    { label: "How close a grasp has to be", href: "/lab#grasp-tolerance" },
  ],
  tryIt: ["onset"],
});
