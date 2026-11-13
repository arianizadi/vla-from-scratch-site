import { defineLesson } from "../define";
import { Bump } from "./animations/Bump";
import { ExpertPeeks } from "./animations/ExpertPeeks";
import { RecordEpisode } from "./animations/RecordEpisode";
import { SlidingWindow } from "./animations/SlidingWindow";

export default defineLesson({
  slug: "70-demonstrations",
  idea: "A robot learns by copying recorded examples, what it saw and what the expert did next, so it can only learn what those examples show.",
  beats: [
    {
      title: "Learning by copying",
      text: "Think of a dashcam in a driving lesson: each frame shows the road and what the instructor did next. A demonstration is one recorded run of the task done right. Each moment stores the camera pictures, the arm's position and the next command. The robot learns to copy that pairing.",
      animation: RecordEpisode,
    },
    {
      title: "A teacher that peeks",
      text: "In a simulator the teacher can be a **scripted expert**: a hand-written program. It cheats by reading each object's exact position, which the robot, seeing only pictures, never gets. Small random changes in speed and aim keep every demonstration slightly different, so the robot learns a skill, not one path.",
      animation: ExpertPeeks,
    },
    {
      title: "One run, many practice cards",
      text: "Training does not swallow whole runs. As with [action chunks](/learn/42-chunks-and-execution), each moment becomes one practice card, a **window**: the picture then, plus the next 15 moves. A run of about 66 moments gives about 66 cards, and the cards from all runs are shuffled together.",
      animation: SlidingWindow,
    },
    {
      title: "Clean examples teach clean habits",
      text: "If the object never moves and every run starts the same way, the robot never sees a [recovery](/learn/43-imitation-learning), and fails the first time something is bumped. An expert that plans again after every look can show recoveries, but only if some demonstrations contain bumps.",
      animation: Bump,
    },
  ],
  edgeCases: [
    "A failed demonstration is quietly dropped, so an expert that struggles on hard scenes leaves you mostly easy ones.",
    "The expert sees what the robot cannot. A move that depends on that hidden knowledge cannot be copied from pictures alone.",
    "Near the end of a run the next 15 moves run past the finish, so the last moment is repeated to fill the card.",
    "An expert that never makes mistakes never shows how to fix one.",
  ],
  tips: [
    "Watch a handful of demonstrations before training on thousands of them.",
    "Check how often the expert itself succeeds; it sets the ceiling for the robot.",
    "Decide on purpose what varies between runs: start pose, object places, bumps.",
    "Keep the scenes you test on separate from the scenes you train on.",
  ],
  takeaway: "A robot can only copy what its demonstrations show, so put every situation you want it to handle into them.",
  related: ["71-how-much-data-and-training", "72-which-demonstrations-teach", "42-chunks-and-execution", "43-imitation-learning"],
  lab: [
    { label: "The scripted expert and how often it succeeds", href: "/lab#task" },
    { label: "What each demonstration set contains", href: "/lab#demonstrations" },
  ],
  tryIt: ["pipeline", "disturbance"],
});
