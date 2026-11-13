import { defineLesson } from "../define";
import { LateJump } from "./animations/LateJump";
import { MovedObject } from "./animations/MovedObject";
import { ScoreVsRobot } from "./animations/ScoreVsRobot";
import { Shortcut } from "./animations/Shortcut";

export default defineLesson({
  slug: "121-edge-cases",
  idea: "Robot policies fail quietly: the training score looks fine while the robot misses, takes shortcuts, or stops watching once something changes.",
  beats: [
    {
      title: "A good score, a robot that fails",
      text: "A student who memorises the answer key aces practice and fails the exam. Most of a demonstration can be guessed from how the arm is already moving; only the first moments need the camera. So the training loss falls even when the robot never looks. Grade by [real tries](/learn/91-loss-is-not-success) only.",
      animation: ScoreVsRobot,
    },
    {
      title: "Learning arrives late",
      text: "Like popcorn: nothing, nothing, then everything at once. A policy can sit near zero for a long time, then start using its eyes and climb fast. One of our runs scored nothing early on and about 85% at the end. Stop too soon and a good design looks [broken](/learn/71-how-much-data-and-training).",
      animation: LateJump,
    },
    {
      title: "The shortcut of the last move",
      text: "Hand a student last week's answers and they may copy instead of learning. Fed its own last move, a policy finds that in smooth demonstrations the next move nearly equals the last. It copies that and never learns to look. Leaving the [last move](/learn/52-history-and-shortcuts) out fixed it for us.",
      animation: Shortcut,
    },
    {
      title: "It only looked once",
      text: "Clean demonstrations never show anything going wrong, so the policy learns to look once and then follow through, like reaching for a cup with your eyes shut. Move the object mid-reach and it grabs air. Demonstrations that include [recoveries](/learn/103-case-self-correction) teach it to keep watching.",
      animation: MovedObject,
    },
  ],
  edgeCases: [
    "Two right answers can average into a wrong one: torn between two cubes, a policy may reach for the gap. [Flow matching](/learn/41-flow-matching) is the fix.",
    "A few points of difference is often noise: 37 successes in 50 tries could mean anything from about 60% to 84%.",
    "A high success rate does not prove the robot watches. With nothing moving, one look at the start can be enough.",
    "Training and testing must feed the policy exactly the same inputs. A small mismatch, like one word shifted, changes what it sees.",
    "Some objects are harder to grasp than others: each forgives a different amount of error.",
  ],
  tips: [
    "Grade every saved copy of the model by letting it act, not by its training score.",
    "Train long enough to see the jump before judging a design.",
    "Test hard cases on purpose: move the object, freeze the camera, start from a new pose.",
    "Change one thing at a time, and repeat a promising result before believing it.",
  ],
  takeaway: "A falling training score proves little. A robot policy is only as good as what it does when it acts: on new tables, with things that change.",
  related: ["91-loss-is-not-success", "71-how-much-data-and-training", "52-history-and-shortcuts", "95-what-a-policy-looks-at", "94-debugging-flowchart"],
  lab: [
    { label: "Low error, no success: the first round", href: "/lab#before-the-fix" },
    { label: "How the policies cope when things change", href: "/lab#outside-the-training-conditions" },
  ],
  tryIt: ["loss-vs-success", "copycat"],
});
