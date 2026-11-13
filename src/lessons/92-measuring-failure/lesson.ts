import { defineLesson } from "../define";
import { FiveZeros } from "./animations/FiveZeros";
import { LearningOrder } from "./animations/LearningOrder";
import { SlopeFollow } from "./animations/SlopeFollow";
import { Snapshot } from "./animations/Snapshot";
import { Tolerance } from "./animations/Tolerance";

export default defineLesson({
  slug: "92-measuring-failure",
  idea: "A success rate of zero hides very different failures; noting where the gripper first closes tells you which one you have.",
  beats: [
    {
      title: "Many ways to score zero",
      text: "A failed maths test can mean you skipped it, misread the question, guessed, or slipped at the end. A **success rate**, the share of tries that end well, hides the same variety. The gripper may never close, grab the wrong object, close at random or miss slightly. Each needs a different fix.",
      animation: FiveZeros,
    },
    {
      title: "Snapshot the moment it commits",
      text: "Think of a photo finish. A **probe**, a recorder inside the test, notes where the gripper and every object are the instant the gripper first closes. Was the nearest object the one the instruction asked for? With three objects on the table, a policy that guesses is right one time in three.",
      animation: Snapshot,
    },
    {
      title: "Does it follow the object?",
      text: "Roll a ball left, then right: a watching dog runs after it. Move the target between tries and plot where the gripper closed against where the object was. The **slope**, how far one moves when the other does, near 1 means it follows; near 0, it ignores the scene.",
      animation: SlopeFollow,
    },
    {
      title: "How close is close enough",
      text: "A key cut slightly wrong still opens some locks. To learn how much error a grasp forgives, its **tolerance**, take the hand-written controller that made the training examples and shift its grasp on purpose. Two centimetres off, the T-shaped block still lifts almost every time; the round can mostly slips away.",
      animation: Tolerance,
    },
    {
      title: "What our zeros turned out to be",
      text: "We tried this on policies that scored zero: they closed at random spots, not looking at all. Checked at saved stages of training, a later policy first started heading for the right object, then its misses shrank, and only then did success climb. A zero can hide real progress.",
      animation: LearningOrder,
    },
  ],
  edgeCases: [
    "One test is noisy. Landing on the asked-for object 37 times in 100 can still be guessing. Trust a trend across several tests, not one value.",
    "A flat slope does not prove the robot cannot look. One policy looked only when its own previous move pointed the way. Change one input and test again.",
    "A perfect first grab does not prove the robot keeps watching. It may look once at the start and then follow its own arm.",
    "Only the first close counts. A robot that fumbles in the air, opens, then grabs correctly is recorded as a miss.",
    "An average over objects hides the hard one: a rule like “within two centimetres” is fine for a block and too loose for a can.",
  ],
  tips: [
    "Run the hand-written controller through the same test first. Its results are the ruler for every policy.",
    "Ask in order: did it close at all, at the right object, and close enough to grasp it?",
    "Test the saved stages of a training run, not only the last one. Looking shows up before success does.",
    "Measure how much error each object forgives, on the same setup that runs the tests.",
  ],
  takeaway: "Don't only count failures: look where the gripper closed. Random spots mean it isn't looking; near misses mean it needs precision.",
  related: ["90-closed-loop-evaluation", "94-debugging-flowchart", "95-what-a-policy-looks-at", "71-how-much-data-and-training"],
  lab: [
    { label: "Where the failing policies closed the gripper", href: "/lab#before-the-fix" },
    { label: "How much error each object forgives", href: "/lab#grasp-tolerance" },
  ],
  tryIt: ["grasp-map", "tolerance", "onset"],
});
