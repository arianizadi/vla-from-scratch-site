import { defineLesson } from "../define";
import { HeadStart } from "./animations/HeadStart";
import { ReaderAndMover } from "./animations/ReaderAndMover";
import { SummaryOrPieces } from "./animations/SummaryOrPieces";
import { TwoWaysToMove } from "./animations/TwoWaysToMove";

export default defineLesson({
  slug: "03-the-landscape",
  idea: "Today's robot models all pair a reader with a mover; they differ in how they produce moves, what they start from, and how much the mover sees.",
  beats: [
    {
      title: "A reader and a mover",
      text: "Think of a navigator and a driver. Every robot model has a **backbone**, the part that reads the picture and the words and turns them into numbers, and an **action head**, the part that turns those numbers into motion. Today's model families differ in how each half is built.",
      animation: ReaderAndMover,
    },
    {
      title: "Writing moves, or sketching them",
      text: "Some models write a motion like a sentence: each joint's move is rounded to one of 256 notches and said as a number, one after another. Others start from a random scribble and clean it into a smooth motion in a few steps, so two equally good moves never blur together.",
      animation: TwoWaysToMove,
    },
    {
      title: "A fresh start, or a head start",
      text: "A model can learn everything from robot demonstrations, or start from a big model that has already read and seen much of the web. That **pretraining**, learning from general data first, brings knowledge of objects and words. On our simple task it mainly helped the robot start using its eyes sooner.",
      animation: HeadStart,
    },
    {
      title: "One summary, or every piece",
      text: "Describe a room in one sentence and you lose where things are. A mover given one summary of the picture knows a cube is there, not exactly where. Hand it every patch and it can find the cube. We tried both: every patch grasped far more often.",
      animation: SummaryOrPieces,
    },
  ],
  edgeCases: [
    "“Bigger is always better.” Our big pretrained models failed while they handed the mover one summary; the fix was showing it every piece, not more size.",
    "Writing moves one number at a time is slow: every number is another full pass through the model.",
    "Scores from different papers rarely compare: each model was tested on its own robots, tasks and data.",
    "A downloadable model is not a working robot. A new robot body still needs its own demonstrations to learn from.",
  ],
  tips: [
    "To place any new model, ask three questions: how does it make moves, what did it start from, and what does the mover see?",
    "If grasps must be precise, make sure the mover sees the picture's pieces, not only a summary.",
    "Start small: a model built from scratch on a simple task shows you each part at work.",
  ],
  takeaway: "Every robot model is a reader plus a mover. To understand one, ask how it makes moves, what it starts from, and how much of the picture the mover sees.",
  related: ["02-how-we-got-here", "21-pooled-vs-patch-tokens", "41-flow-matching", "60-anatomy-of-a-vla", "61-pretrained-backbones"],
  lab: [
    { label: "Pretrained against from-scratch backbones", href: "/lab#backbones" },
    { label: "Policies that saw one summary, and how they failed", href: "/lab#before-the-fix" },
  ],
  tryIt: ["pooled-vs-tokens"],
});
