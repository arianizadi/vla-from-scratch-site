import { defineLesson } from "../define";
import { CountWithNoise } from "./animations/CountWithNoise";
import { DrivingTest } from "./animations/DrivingTest";
import { PairedScenes } from "./animations/PairedScenes";
import { SeedScenes } from "./animations/SeedScenes";
import { TwoLayoutSets } from "./animations/TwoLayoutSets";

export default defineLesson({
  slug: "90-closed-loop-evaluation",
  idea: "To know whether a robot policy works, let it drive in the simulator on scenes it never saw, count the successes, and treat a small gap as possible luck.",
  beats: [
    {
      title: "A driving test, not a written one",
      text: "A written test checks answers against a key; a driving test puts you behind the wheel. **Closed-loop evaluation** is the driving test: the policy moves the arm, and every move changes what the camera sees next. Only this shows whether the robot can pick up the object on its own.",
      animation: DrivingTest,
    },
    {
      title: "Only new scenes count",
      text: "A fair exam reuses no homework questions. Each scene, with its objects, their places and which one is named, is built from one number, its **seed**. Training scenes use small seeds; test scenes start at one million, so every test is new. Success means the named object lifted and held.",
      animation: SeedScenes,
    },
    {
      title: "A score is a count",
      text: "Each attempt passes or fails, like tossing a coin whose bias you want to learn. So 93 out of 100 is an estimate: on the next 100 scenes, the same policy scored 96. A **confidence interval** is the range where the true rate plausibly lies. Fewer attempts give a wider range.",
      animation: CountWithNoise,
    },
    {
      title: "Compare on the same scenes",
      text: "Give two policies the very same scenes, like two students sitting one exam, and compare them question by question. Scenes where both pass or both fail say nothing. Only the disagreements count, and a lopsided split among them is hard to explain as luck.",
      animation: PairedScenes,
    },
    {
      title: "The best score flatters",
      text: "Score many policies and pick the top one, and part of what you picked is luck, like the best of many dice rolls. Eight finished policies, scored again on 100 new scenes, moved by up to 12 points and swapped places. Re-test your pick on fresh scenes and report that.",
      animation: TwoLayoutSets,
    },
  ],
  edgeCases: [
    "Testing on scenes the policy trained on measures memory, not skill.",
    "Settings used while testing, such as how many moves the robot makes before it looks again, are part of the test. A score holds only for its settings.",
    "A high score does not prove the policy watches the scene: on a still table, one look at the start can be enough.",
    "Early checkpoints that all score near zero may still be learning. The skill can arrive late, and all at once.",
    "Overlapping intervals never prove two policies equal. A real gap can hide inside them.",
  ],
  tips: [
    "Run a scripted expert through the same test first. If it succeeds, the task is possible and the success check works.",
    "Use the same scenes for every policy you compare.",
    "Re-test the checkpoint you choose on fresh scenes before you report it.",
    "Write down every test setting next to the score it produced.",
  ],
  takeaway: "A success rate is a count on a handful of random scenes. Test on new scenes, compare on the same ones, and treat a gap of a few points as noise.",
  related: ["91-loss-is-not-success", "92-measuring-failure", "41-flow-matching", "95-what-a-policy-looks-at"],
  lab: [
    { label: "The scripted expert through the same test", href: "/lab#the-scripted-expert" },
    { label: "Final checkpoints on two sets of scenes", href: "/lab#final-checkpoints" },
  ],
  tryIt: ["loss-vs-success", "arm-replay"],
});
