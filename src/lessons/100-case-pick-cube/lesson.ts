import { defineLesson } from "../define";
import { DuplicateSeats } from "./animations/DuplicateSeats";
import { GradeVsRobot } from "./animations/GradeVsRobot";
import { MissShrinks } from "./animations/MissShrinks";
import { TeacherRecords } from "./animations/TeacherRecords";

export default defineLesson({
  slug: "100-case-pick-cube",
  idea: "Teaching a robot to lift one red cube showed that a good training score can hide a bad robot, and that aiming comes early while precision takes practice.",
  beats: [
    {
      title: "Start with an expert to copy",
      text: "The first task: lift one red cube from a table. Learning by copying needs someone to copy, and the [scripted expert](/learn/70-demonstrations) lifts it 49 times in 50. The robot learns from its demonstrations alone, then drives by itself on layouts it never saw.",
      animation: TeacherRecords,
    },
    {
      title: "A good grade, a bad robot",
      text: "The loss is like a homework grade: how closely the robot's guesses match the expert's moves. One learner squeezed each picture into a single summary and got the better grade. Driving alone, it lifted the cube twice in 50 tries; a learner keeping every patch lifted it 15 times.",
      animation: GradeVsRobot,
    },
    {
      title: "First the right place, then precision",
      text: "Like learning darts: first you hit the board, then the bullseye. With more demonstrations and practice, the robot soon headed for the cube but closed about 4 cm off. Practice shrank that miss below 1 cm, close enough to hold, and success climbed above 9 tries in 10.",
      animation: MissShrinks,
    },
    {
      title: "A rounding error told a false story",
      text: "Giving the robot [history](/learn/52-history-and-shortcuts), its previous picture and move, seemed to hurt: 62 lifts in 100. Then we found that neighbouring pieces of the input shared one [seat number](/learn/12-positions), worse in longer inputs. With exact positions, the history version lifted the cube 96 times. Every comparison had to be redone.",
      animation: DuplicateSeats,
    },
  ],
  edgeCases: [
    "With one cube and one sentence there is nothing to choose, so this task cannot show whether the robot reads its instruction.",
    "A robot that looks once and then follows its own arm still succeeds here, because the cube never moves.",
    "Fifty tries is a small test: two settings can differ by ten points by chance alone.",
    "A flaw shared by both sides of a comparison can hurt them unequally and flip the result.",
  ],
  tips: [
    "Judge a robot by driving it on layouts it never saw, not by its training loss.",
    "Record where the hand closes, not only whether it lifted: the miss tells you what to fix.",
    "Use at least 100 tries before believing a difference of a few points.",
    "After fixing anything shared, rerun both sides of every comparison.",
  ],
  takeaway: "A good training grade does not make a good robot. Test it on the real task, measure how far it misses, and redo comparisons after every fix.",
  related: ["91-loss-is-not-success", "21-pooled-vs-patch-tokens", "12-positions", "101-case-pick-target"],
  lab: [
    { label: "Memory or not, before and after the fix", href: "/lab#history" },
    { label: "The rounding fix and what it changed", href: "/lab#position-fix" },
    { label: "How far off a grasp can be and still hold", href: "/lab#grasp-tolerance" },
  ],
  tryIt: ["loss-vs-success", "tolerance"],
});
