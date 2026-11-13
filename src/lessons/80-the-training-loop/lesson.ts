import { defineLesson } from "../define";
import { CheckpointPair } from "./animations/CheckpointPair";
import { Downhill } from "./animations/Downhill";
import { EmaSmoothing } from "./animations/EmaSmoothing";
import { ScheduleCurves } from "./animations/ScheduleCurves";
import { StrideSize } from "./animations/StrideSize";

export default defineLesson({
  slug: "80-the-training-loop",
  idea: "Training repeats one small move millions of times: guess, measure the miss, and nudge every weight a little downhill, with steps that start big and shrink.",
  beats: [
    {
      title: "Walking downhill in the dark",
      text: "Picture a hiker in fog, feeling the ground underfoot. The **loss**, a score of how far the model's guessed actions are from the demonstrated ones, is the height. The **gradient** is the slope: which way is down. Each training step moves every **weight**, one of the model's adjustable numbers, a little downhill.",
      animation: Downhill,
    },
    {
      title: "How big a step",
      text: "The **learning rate** is the stride. Too big, and the hiker leaps over the valley floor and lands higher up. Too small, and the run ends before reaching the bottom. For a robot policy, the right stride is the difference between a model that learns and one that thrashes.",
      animation: StrideSize,
    },
    {
      title: "Slow down as you arrive",
      text: "Runs start with a brief **warm-up**, then shrink the stride smoothly, like slowing a car near its parking spot. The slowdown is planned for the run's total length. So a short run is already crawling early on, and can stop before the robot has learned to use its camera.",
      animation: ScheduleCurves,
    },
    {
      title: "A calmer copy of the weights",
      text: "Every batch of examples jolts the weights, like a shaky hand on a camera. Training also keeps a **moving average**: a second copy that moves only a small fraction toward the trained weights after each step. It keeps the trend and leaves out the shake.",
      animation: EmaSmoothing,
    },
    {
      title: "Save both, test both",
      text: "A **checkpoint** is a save point: the training state, written to disk at intervals. Each keeps both copies. Usually they score alike. In one run, midway through learning to use the camera, the averaged copy succeeded nine times as often. Testing both costs one extra file.",
      animation: CheckpointPair,
    },
  ],
  edgeCases: [
    "A falling loss is not a working robot. The loss can sit nearly flat while success climbs from zero: see [Loss is not success](/learn/91-loss-is-not-success).",
    "Changing a run's planned length halfway changes its stride too, because the slowdown is computed from the total.",
    "Two scores for the same save point may come from the two copies. Always note which copy was tested.",
    "Neighbouring save points a few points apart are noise, not progress: the same weights move that much on new scenes.",
    "A run judged too early looks like a failed design: the skill of looking at the scene can arrive late and fast.",
  ],
  tips: [
    "Decide the run's length first; the stride plan follows from it.",
    "Judge a design only after a run as long as one that worked.",
    "Keep the averaged copy at every save point and test both copies.",
    "Look at the loss to catch broken training, which never falls at all, not to rank models.",
  ],
  takeaway: "Training is millions of small downhill steps whose size shrinks on a plan set by the run's length. Keep a calm averaged copy too, and test both.",
  related: ["41-flow-matching", "71-how-much-data-and-training", "81-surviving-long-runs", "91-loss-is-not-success"],
  lab: [{ label: "Final checkpoints, trained and averaged weights", href: "/lab#final-checkpoints" }],
  tryIt: ["training-step"],
});
