import { defineLesson } from "../define";
import { ChunkAndSteps } from "./animations/ChunkAndSteps";
import { LossFalls } from "./animations/LossFalls";
import { ModelParts } from "./animations/ModelParts";
import { ReplayOrLive } from "./animations/ReplayOrLive";
import { WhatGoesIn } from "./animations/WhatGoesIn";

export default defineLesson({
  slug: "120-glossary",
  idea: "A handful of words carry the whole course: what goes into the robot's model, what comes out, its parts, how it learns and how we test it.",
  beats: [
    {
      title: "What goes in",
      text: "The model takes three inputs. **Tokens** are pieces of text, each swapped for a number. **Patches** are small squares cut from a camera picture. The **state** is the arm's own position: its joint angles and how open the gripper is. Everything the robot knows arrives this way.",
      animation: WhatGoesIn,
    },
    {
      title: "What comes out",
      text: "An **action** is one command: where each joint should go next and whether to close the gripper. A **control step** is one tick of the robot's clock, about 20 a second. Most models plan an **action chunk**, a run of actions, carry out part of it, then plan again.",
      animation: ChunkAndSteps,
    },
    {
      title: "The parts of the model",
      text: "The **backbone** reads the pictures and words, like eyes and ears. What it hands on is the **conditioning**: numbers that sum up the scene. The **action head** turns the conditioning into actions, like hands. The **policy** is the whole thing: whatever maps what the robot senses to what it does.",
      animation: ModelParts,
    },
    {
      title: "How it learns",
      text: "A **demonstration** is one recorded run of an expert doing the task. The **loss** measures how far the model's guesses are from the expert's moves. Each **training step** nudges the model to shrink it. A **checkpoint** is a save point: a copy of the model partway through.",
      animation: LossFalls,
    },
    {
      title: "How we test it",
      text: "Replaying a recording and checking the guesses is **open loop**. Letting the robot act, so its own moves make its next picture, is **closed loop**. We test closed loop on **unseen layouts**, tables arranged in ways training never showed, and report the **success rate**, the share of tries that work.",
      animation: ReplayOrLive,
    },
  ],
  edgeCases: [
    "“Step” has several meanings: a training step, a control step, one clean-up step while making a move. Always ask which one.",
    "Loss and success are different things. A low loss can come with a robot that never succeeds.",
    "A token is not always a word: a common word may be one token, a rare word several.",
    "“Policy” and “model” mean nearly the same here: the thing that maps what the robot senses to what it does.",
  ],
  tips: [
    "When a new word appears, place it on the loop: does it go in, come out, sit inside the model, or belong to training or testing?",
    "Colours carry meaning on every page: blue for words, green for pictures, orange for actions.",
    "The technical details of this page list every term in alphabetical order, with the lesson that explains it.",
  ],
  takeaway: "Tokens, patches and state go in; actions come out in chunks; a backbone and an action head sit between. Loss trains the model, and closed-loop success grades it.",
  related: ["00-the-route", "10-tokens", "20-images-to-tokens", "42-chunks-and-execution", "90-closed-loop-evaluation"],
  tryIt: ["action-chunks"],
});
