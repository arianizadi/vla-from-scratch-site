import { defineLesson } from "../define";
import { HoldJaws } from "./animations/HoldJaws";
import { Ladder } from "./animations/Ladder";
import { LateClick } from "./animations/LateClick";
import { PlantGoal } from "./animations/PlantGoal";
import { TurnAndCut } from "./animations/TurnAndCut";

export default defineLesson({
  slug: "110-toward-real-tasks",
  idea: "To prune a potted plant, the robot learns one new difficulty at a time, from a moving target to cutting and turning the plant.",
  beats: [
    {
      title: "The goal: prune a potted plant",
      text: "Picture a gardener tidying a houseplant on a turning stand: a main stem, a flower on top, a few **side shoots** (small branches). The robot must cut every side shoot and leave the stem and flower unharmed. Two buttons turn the stand, so any shoot can face the arm.",
      animation: PlantGoal,
    },
    {
      title: "One new difficulty per rung",
      text: "Like learning to drive: car park before motorway. The task became a ladder, each rung adding one difficulty: a moving target, **look-alikes** (objects differing only in colour), leaves in the way, cutting, turning. At each rung: can the scripted expert do it, and what must it demonstrate?",
      animation: Ladder,
    },
    {
      title: "Look-alikes click late, then all at once",
      text: "Three flowers of one shape; only the colour word says which to cut. For a long stretch of training the robot guessed. Then, within one [checkpoint](/learn/80-the-training-loop), it started reading the word. Some training runs click early, some late, some not before the run ends.",
      animation: LateClick,
    },
    {
      title: "Cutting needs a patient hand",
      text: "A cut needs the jaws held shut on the stem for a moment. The first robots reopened too soon: their demonstrations stopped right at the cut, so waiting was never shown. Recording a little longer with the jaws shut fixed it: about 97 cuts in 100.",
      animation: HoldJaws,
    },
    {
      title: "Turn, cut, repeat",
      text: "When a shoot faces away, the robot holds the button that turns it, mostly the short way, and releases it once the shoot faces the arm. With one shoot it prunes 83 to 90 plants in 100; with two or three, about 79 so far, more slowly than the expert.",
      animation: TurnAndCut,
    },
  ],
  edgeCases: [
    "A training run that has not clicked yet looks exactly like one that never will. Only a second run with another random start tells them apart.",
    "More demonstrations can delay the click: four times the data in the same training time means each example is seen a quarter as often.",
    "A success rate hides how a try failed. Running out of time and touching the flower are different problems with different fixes.",
    "A perfect expert is not enough. If the recordings stop too early, the robot never sees the moment that matters, here holding still.",
    "All of this happens in a simulator. Real light, real stems and real cameras differ, and that gap is still untested.",
  ],
  tips: [
    "Split a hard task into rungs that each add one difficulty, and climb them in order.",
    "Before training a robot on a rung, check that the scripted expert can do it.",
    "Watch what the demonstrations show, frame by frame: the robot copies exactly that, including where they stop.",
    "When a run looks stuck, try another random start before deciding the task cannot be learned.",
  ],
  takeaway: "A real task is learned rung by rung: add one difficulty, check that the expert can do it, and make sure the demonstrations show every moment the robot must copy.",
  related: ["103-case-self-correction", "72-which-demonstrations-teach", "71-how-much-data-and-training"],
  lab: [
    { label: "Every step toward pruning, with its numbers and films", href: "/lab#toward-flower-trimming" },
  ],
  tryIt: ["disturbance"],
});
