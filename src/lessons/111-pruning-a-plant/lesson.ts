import { defineLesson } from "../define";
import { LongerPlan } from "./animations/LongerPlan";
import { PruneJob } from "./animations/PruneJob";
import { PruneLadder } from "./animations/PruneLadder";
import { Takeover } from "./animations/Takeover";
import { TurnWithFilm } from "./animations/WithFilm";
import { WanderWithFilm } from "./animations/WithFilm";

export default defineLesson({
  slug: "111-pruning-a-plant",
  idea: "A robot learned to prune a potted plant one small step at a time, helped by a longer training plan and a short memory, hurt by examples that disagreed.",
  beats: [
    {
      title: "The job: every shoot, never the flower",
      text: "Picture a gardener tidying a houseplant on a turning tray. The plant has a main stem, a flower on top and a few **side shoots**, small branches off the stem. The robot must cut every shoot. Two buttons turn the stand, one each way. Touching the flower fails the try.",
      animation: PruneJob,
    },
    {
      title: "A ladder of small steps",
      text: "Nobody learns to drive on the motorway. The task became four rungs: one shoot already facing the robot; one facing anywhere, so the plant turns first; the whole plant, two or three shoots; then only the shoot the instruction names, such as the lowest. Each rung adds one difficulty.",
      animation: PruneLadder,
    },
    {
      title: "Press only when the shoot faces away",
      text: "The arm only cuts a shoot facing it. When one points away, the robot holds the button that brings it round, then releases it. On purpose, or luck? Presses were recorded on 60 new plants: it pressed for 43 of 46 shoots out of reach, never for one facing it.",
      animation: TurnWithFilm,
    },
    {
      title: "A longer plan learns faster",
      text: "The **learning rate** is the size of each training step. It shrinks on a curve planned for the whole run. Plan twice as long: steps stay big longer. At the same point, the long plan pruned 29 plants in 100, the short 2 to 6. More examples did not help.",
      animation: LongerPlan,
    },
    {
      title: "Slow and wandering; a memory helps",
      text: "The robot gets there, but slowly. Between shoots it often drifts, near no shoot and no button, until time runs out. It rarely hurts the flower. A **memory**, an extra picture taken one second earlier, makes it fail less often, not faster: 83 plants in 100 on average, against 71.",
      animation: WanderWithFilm,
    },
    {
      title: "Let the expert take over",
      text: "To learn from its own wanderings, the robot drives and the expert takes over from wherever it ended up. The first try collapsed. After a takeover the expert backed out, a move normal examples never make: one picture, two opposite answers. Fixed, it stopped collapsing but did not help either.",
      animation: Takeover,
    },
  ],
  edgeCases: [
    "A success rate hides how a try failed. Running out of time and touching the flower are different problems with different fixes.",
    "More time is no cure for wandering. Doubling the clock pruned more plants, but the flower got touched more often too.",
    "Two training runs that differ only in their random start can end far apart: about 80 against 56. One run proves little.",
    "Picking the best saved copy of many flatters the result. Scores jump by up to 13 between neighbours, so judge the last one.",
    "A robot that follows the instructions it trained on can stumble on new words. Calling the lowest shoot the bottom one cost far more than a new sentence around a known word.",
  ],
  tips: [
    "Split a hard job into rungs that each add one difficulty, and check that the expert can climb every rung.",
    "To test whether a behaviour is on purpose, record it on new scenes and check it happens only when it should.",
    "When you change how long training is planned, compare runs after the same number of examples, not at the same save point.",
    "Before mixing in new examples, find similar moments in both sets and check that they show the same move.",
    "A memory must reach back far enough. A picture from the instant before did worse than none; one from a second earlier helped.",
  ],
  takeaway: "Climb a hard task in small rungs, give training a long enough plan, and make sure every example shows the same move in the same situation.",
  related: ["110-toward-real-tasks", "43-imitation-learning", "80-the-training-loop", "92-measuring-failure"],
  lab: [
    { label: "Every step toward pruning, with its numbers and films", href: "/lab#toward-flower-trimming" },
    { label: "The three pruning tasks and every run", href: "/lab#flower-runs-in-progress" },
  ],
});
