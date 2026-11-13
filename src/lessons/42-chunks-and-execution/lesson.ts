import { defineLesson } from "../define";
import { Decisions } from "./animations/Decisions";
import { Dither } from "./animations/Dither";
import { MovedObject } from "./animations/MovedObject";
import { TrainingWindow } from "./animations/TrainingWindow";

export default defineLesson({
  slug: "42-chunks-and-execution",
  idea: "A policy plans a short run of moves, plays part of it, then looks again; looking again helps only if the policy uses what it sees.",
  beats: [
    {
      title: "Plan a little, act, look again",
      text: "A driver glances at the road, then drives a moment on that glance. A policy does the same. It predicts an **action chunk**, a run of future actions (here 15, under a second), plays the first 8, then looks at the cameras again and plans a fresh chunk: a **re-plan**.",
      animation: Decisions,
    },
    {
      title: "Why not decide every step",
      text: "Someone who rethinks every step zigzags. A policy's choice has some randomness in it, so two fresh picks may choose different good paths, and flipping between them makes a bad path. A chunk is one coherent motion. Fewer decisions also means fewer calls to a slow model.",
      animation: Dither,
    },
    {
      title: "Every frame is a lesson",
      text: "To learn chunks, each recorded demonstration is cut like a film into overlapping clips. Every frame becomes one example: what the robot saw there, and the next 15 actions to predict. Near the end the future runs short, so the gap is filled with copies that are not graded.",
      animation: TrainingWindow,
    },
    {
      title: "Looking again is not seeing",
      text: "A re-plan hands the policy fresh images, but nothing forces it to use them. We moved the object halfway through a reach: the policy kept going to the old spot, and re-planning more often did not help. Demonstrations that showed [recovering](/learn/103-case-self-correction) did.",
      animation: MovedObject,
    },
  ],
  edgeCases: [
    "“Re-plan more often and the robot reacts better” is a misconception. It reacts only if the policy actually reads the new images.",
    "On a real robot the world keeps moving while the model thinks. A slow model acts on a view that is already out of date.",
    "Playing very few actions per chunk brings back some of the zigzag; playing all of them leaves the robot blind for longer.",
    "The first plan of an episode has no earlier plan to continue. Make sure training and use agree on what fills that gap.",
  ],
  tips: [
    "Test reactivity by moving the object mid-reach. A scene where nothing moves cannot show it.",
    "Count the model's thinking time in robot ticks: anything over one tick means acting on old plans.",
    "Compare a few “how many to play” settings on the same scenes before drawing a conclusion.",
  ],
  takeaway: "Plan a short run, play part of it, look again; a fresh look helps only if the policy actually uses what it sees.",
  related: ["41-flow-matching", "40-action-spaces", "43-imitation-learning", "103-case-self-correction"],
  lab: [
    { label: "Success against how many actions are played per chunk", href: "/lab#sampler" },
    { label: "The policy when the object moves mid-reach", href: "/lab#outside-the-training-conditions" },
  ],
  tryIt: ["action-chunks", "disturbance"],
});
