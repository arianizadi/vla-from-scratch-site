import { defineLesson } from "../define";
import { LeverArm } from "./animations/LeverArm";
import { Normalise } from "./animations/Normalise";
import { SayWhere } from "./animations/SayWhere";
import { TargetsTick } from "./animations/TargetsTick";

export default defineLesson({
  slug: "40-action-spaces",
  idea: "A robot action is a short list of target angles plus open or closed, sent many times a second, and its accuracy counts at the fingertips.",
  beats: [
    {
      title: "An action is a list of targets",
      text: "Picture a puppeteer calling out where each limb should point. A robot **action** is that call: one target angle per joint, plus one number for the gripper, open or closed. Twenty times a second a new action arrives, and motors push every joint toward its target.",
      animation: TargetsTick,
    },
    {
      title: "Say where, not how far",
      text: "“Walk to the bakery” beats “take a hundred steps, then a hundred more”, because miscounted steps add up. So each action names an **absolute** target, the angle itself, not a change from the last one. A small error then stays one small error instead of piling up over a reach.",
      animation: SayWhere,
    },
    {
      title: "Tiny turns, real millimetres",
      text: "A small turn at a door's hinge moves its far edge a lot. The gripper sits about half a metre from the base joint, so half a degree there moves it 5 mm. That matters, because a grasp forgives only a centimetre or two before it starts to fail.",
      animation: LeverArm,
    },
    {
      title: "One scale for every number",
      text: "A joint that barely moves sits beside a gripper that flips fully open or closed: millimetres beside kilometres. So each number is **normalised**: shifted to centre on zero and stretched to a similar spread. The policy works on that common scale; its answers are stretched back for the arm.",
      animation: Normalise,
    },
  ],
  edgeCases: [
    "“A small angle error is a small error” is a misconception. At the fingertips it is multiplied by the arm's length.",
    "A number that never changes in the data has no spread to divide by. Stretching it blows the first unusual value up enormously.",
    "Pairing each action with the picture taken after it hands the answer to the model. Training looks great; the robot does not.",
    "The arm's joint limits quietly cut commands that ask for too much, so what was sent and what happened can differ.",
  ],
  tips: [
    "Turn angle errors into millimetres before judging them: multiply by the distance to the fingertips.",
    "Look at how much each number varies in your demonstrations before training.",
    "Judge a policy by where its gripper closes, not only by pass or fail.",
  ],
  takeaway: "An action is a list of joint targets plus open or closed; judge it at the fingertips, where half a degree becomes millimetres.",
  related: ["41-flow-matching", "42-chunks-and-execution", "92-measuring-failure"],
  lab: [{ label: "How far off a grasp can be and still work", href: "/lab#grasp-tolerance" }],
  tryIt: ["tolerance"],
});
