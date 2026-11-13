import { defineLesson } from "../define";
import { LossMisleads } from "./animations/LossMisleads";
import { QuestionPath } from "./animations/QuestionPath";
import { StringOfLights } from "./animations/StringOfLights";
import { WorkedCase } from "./animations/WorkedCase";

export default defineLesson({
  slug: "94-debugging-flowchart",
  idea: "When a robot policy fails, ask cheap questions in a fixed order, starting upstream, and let each answer choose the next question before retraining anything.",
  beats: [
    {
      title: "A string of lights",
      text: "When one bulb dies, the whole string goes dark, and the dark string won't say which bulb. A robot policy sits at the end of a similar string: task, expert examples, data preparation, training, serving, the robot, the success check. A break anywhere gives the same score of almost zero.",
      animation: StringOfLights,
    },
    {
      title: "Ask questions that steer",
      text: "A plumber checks the main valve before the tap. Check the earliest link first: a fault there spoils every later measurement. And ask only questions whose answer changes your next move. The loss fails that test: one policy ended with a lower loss than another, yet succeeded far less often.",
      animation: LossMisleads,
    },
    {
      title: "Walk down the questions",
      text: "Ask in order. Does the scripted expert pass the same test? Does the policy copy it on recorded examples? Does the gripper close? At the right object? Close enough to grasp? The first “no” points to a likely cause, and to the next thing to check.",
      animation: QuestionPath,
    },
    {
      title: "A worked case",
      text: "One policy succeeded once in 100. The expert passed, the policy copied it well, and it closed the gripper every time. But it closed at the named object only one time in three: guessing. Its setup had never fed it the instruction. Four cheap questions found that, with no retraining.",
      animation: WorkedCase,
    },
  ],
  edgeCases: [
    "Copying the expert on recorded examples only shows the policy fits them. It says nothing about how it acts once its own moves change what it sees.",
    "A mistake that training and the robot share passes the copy check, because both sides agree on the wrong thing.",
    "Early in training, a policy that is not looking yet may only need more time. Watch whether it starts following the object across saved stages.",
    "A policy that passes every question can still fail when the world changes mid-task: move the object and see.",
  ],
  tips: [
    "Run the scripted expert through the very same test before judging any policy.",
    "Before you check something, write down what each answer would make you do. If nothing changes, skip it.",
    "Read the setup before running anything: a missing input needs no experiment.",
    "Sort failed policies by where they left the path, not by their score.",
  ],
  takeaway: "A score near zero names no cause; ask questions from upstream down, and let the first “no” tell you where to look.",
  related: ["91-loss-is-not-success", "92-measuring-failure", "93-train-inference-skew", "95-what-a-policy-looks-at"],
  lab: [
    { label: "The failing policies, read question by question", href: "/lab#before-the-fix" },
    { label: "Policies with and without memory of their last move", href: "/lab#history" },
  ],
  tryIt: ["loss-vs-success", "onset"],
});
