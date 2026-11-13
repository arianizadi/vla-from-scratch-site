import { defineLesson } from "../define";
import { Giveaway } from "./animations/Giveaway";
import { OnsetCompare } from "./animations/OnsetCompare";
import { RandomStarts } from "./animations/RandomStarts";
import { Recovery } from "./animations/Recovery";

export default defineLesson({
  slug: "72-which-demonstrations-teach",
  idea: "A robot only learns to look at the scene in moments it cannot get right without looking, so good demonstrations contain many such moments.",
  beats: [
    {
      title: "Most moments give the answer away",
      text: "Watch a friend walk toward one of three doors: after a few steps you know which, without being told. The arm is the same. From the usual start, its pose a few moments into the reach already says where it is going. Only the first moments of each demonstration force the robot to look.",
      animation: Giveaway,
    },
    {
      title: "Random starts hide the giveaway",
      text: "Start every demonstration from a different place. Now a pose in mid-reach lies on the way to several objects, so the arm's pose alone no longer gives the goal away. Every moment needs the picture, and every moment becomes practice in looking. This cost nothing on the plain task.",
      animation: RandomStarts,
    },
    {
      title: "A recovery is a lesson in looking",
      text: "In some demonstrations, move the object mid-reach and let the teacher plan again. The arm was heading one way and suddenly turns. Nothing in its own pose explains the turn; only the picture does. Those moments teach looking, and they teach recovering too.",
      animation: Recovery,
    },
    {
      title: "Looking sooner, coping with surprises",
      text: "With random starts and bumps, the robot aimed at the named object much earlier in training. Final scores on the plain task ended close together. The big difference showed when the object moved mid-reach: the robot from plain demonstrations failed every time, the one that had seen bumps succeeded about 9 times in 10.",
      animation: OnsetCompare,
    },
  ],
  edgeCases: [
    "Repeating the first moments more often helped plain demonstrations but hurt varied ones: it took practice away from the correction moments.",
    "Naming every object in the same scene made the robot look sooner but did not end higher, and it meant fewer different scenes.",
    "Looking early is not succeeding early: a robot can aim at the right object long before it grips it well.",
    "Two runs of the same recipe ended a few points apart, so a small win between single runs may be luck.",
  ],
  tips: [
    "Walk through one demonstration moment by moment and ask: could the next move be guessed without the picture?",
    "Vary whatever gives the answer away: the start pose here, maybe a fixed order or height in your task.",
    "Put the behaviour you want into the data: a teacher that plans again, and bumps in some runs.",
    "Test under the surprises the data was meant to teach, not only on the plain task.",
  ],
  takeaway: "A demonstration teaches looking only where the next move cannot be guessed without looking, so make those moments common.",
  related: ["70-demonstrations", "71-how-much-data-and-training", "52-history-and-shortcuts", "103-case-self-correction"],
  lab: [
    { label: "Seven kinds of demonstrations compared", href: "/lab#demonstrations" },
    { label: "What happens when the object moves", href: "/lab#outside-the-training-conditions" },
  ],
  tryIt: ["onset", "disturbance"],
});
