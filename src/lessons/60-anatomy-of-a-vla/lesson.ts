import { defineLesson } from "../define";
import { ManyNotes } from "./animations/ManyNotes";
import { SamplingPass } from "./animations/SamplingPass";
import { TwoParts } from "./animations/TwoParts";

export default defineLesson({
  slug: "60-anatomy-of-a-vla",
  idea: "A robot model that sees, reads and acts has two parts: a reader that turns pictures and words into notes, and a mover that turns notes into motion.",
  beats: [
    {
      title: "A reader and a mover",
      text: "Think of reading a sticky note, glancing at the table, then reaching. A **VLA** (vision-language-action model) splits the job the same way. The **backbone** reads the camera picture and the instruction into notes: lists of numbers. The **action head** turns those notes into arm motion. Reading and moving are different skills, so each part can be trained its own way.",
      animation: TwoParts,
    },
    {
      title: "Many notes, not one summary",
      text: "Describe a room in one word and nobody can find the keys. The reader cuts each picture into small squares, **patches**, and can hand over one note per patch and per word. When we squeezed everything into a single note, the arm moved smoothly and closed on empty table. Many notes keep where things are.",
      animation: ManyNotes,
    },
    {
      title: "From a scribble to a plan",
      text: "The mover plans the next 15 moves at once, a **chunk**. It starts from random noise and cleans it up in a few passes, like sharpening a sketch ([how that works](/learn/41-flow-matching)). The reader looks once per plan. The arm carries out about half the moves, then looks again, so it can react if something changed.",
      animation: SamplingPass,
    },
    {
      title: "What made it work",
      text: "We tried a small reader, a homemade one and a big borrowed one. Every version that worked handed the mover many notes and did not feed it its own last move, which it could copy instead of looking. What the reader handed over mattered more than how big the reader was.",
    },
  ],
  edgeCases: [
    "A low training error does not mean the robot works: the one-note version learned smooth, confident motions and still closed on nothing.",
    "Feeding the mover its own previous move sounds helpful, yet it can coast on that move and never learn to look.",
    "The mover never sees the camera itself. Whatever the notes leave out, it cannot get back.",
    "A bigger reader is not automatically better. It is slower, and it still has to hand over the right notes.",
  ],
  tips: [
    "When a robot fails, ask first what the mover was given, then how good the reader is.",
    "Watch where the gripper closes, not only whether it succeeded: slightly off the object and nowhere near it are different problems.",
    "Start with the simplest inputs. Add the robot's own last move only once that version works.",
    "Fewer clean-up passes make the mover faster. Check the success on your own robot before trimming them.",
  ],
  takeaway: "A VLA is a reader and a mover. What the reader hands the mover matters more than how big the reader is.",
  related: ["61-pretrained-backbones", "62-the-from-scratch-path", "41-flow-matching", "50-what-the-action-head-sees", "52-history-and-shortcuts"],
  lab: [
    { label: "Which designs worked, and with what reader", href: "/lab#backbones" },
    { label: "The one-note policies that closed on nothing", href: "/lab#before-the-fix" },
  ],
  tryIt: ["pooled-vs-tokens", "action-chunks"],
});
