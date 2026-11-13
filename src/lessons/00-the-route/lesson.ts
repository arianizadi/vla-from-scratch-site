import { defineLesson } from "../define";
import { BuildInOrder } from "./animations/BuildInOrder";
import { CopyTheExpert } from "./animations/CopyTheExpert";
import { CountSuccesses } from "./animations/CountSuccesses";
import { LookAgain } from "./animations/LookAgain";
import { SeeReadMove } from "./animations/SeeReadMove";

export default defineLesson({
  slug: "00-the-route",
  idea: "A robot learns to act by copying many examples: a model looks through its camera, reads the instruction and answers with the arm's next small move.",
  beats: [
    {
      title: "See, read, move",
      text: "Think of cooking from a recipe while watching the pan. The robot's **policy**, the model that decides what to do, gets three things: a camera picture, an instruction in words, and where its own joints are. It answers with one small move for the arm.",
      animation: SeeReadMove,
    },
    {
      title: "Look again after every move",
      text: "Nobody crosses a room with their eyes shut. The policy picks a move, the arm makes it, the camera takes a new picture, and it decides again, about 20 times a second. This is a **closed loop**: each move changes what the robot sees next, so it can correct itself.",
      animation: LookAgain,
    },
    {
      title: "Taught by showing, not by rules",
      text: "Like learning a knot by watching a friend tie it. An expert does the task many times while we record what it saw and did: these are **demonstrations**. Training compares the model's guess with the expert's move and nudges it closer. Nobody writes rules; the examples are the lesson.",
      animation: CopyTheExpert,
    },
    {
      title: "Graded by what it does",
      text: "A student can memorise answers without understanding them. So we never trust the training score alone. We put the robot in front of tables it never saw, let it act, and count how often it lifts the right object. That **success rate** is the grade that counts.",
      animation: CountSuccesses,
    },
    {
      title: "The plan of the course",
      text: "The policy is three skills joined together: reading words, seeing images and making moves. The course builds them in that order, then joins them into one **vision-language-action model**, a VLA for short, and teaches it with demonstrations. Every later lesson zooms into one piece of this picture.",
      animation: BuildInOrder,
    },
  ],
  edgeCases: [
    "“A low training error means it works.” Not for robots: one of our policies had the lowest error of all and never lifted anything.",
    "“The robot plans the whole motion up front.” It decides a few moves at a time, then looks again.",
    "“It understands the instruction.” It only knows what the demonstrations showed it; a word or object it never saw means nothing to it.",
    "“A smarter robot needs more rules.” Nothing here is hand-written. To change what it does, change the examples it learns from.",
  ],
  tips: [
    "Keep the loop in mind: picture and words in, a small move out, repeat. Every lesson zooms into one box of it.",
    "When a lesson names a new part, ask two questions: what does it receive, and what does it pass on?",
    "Colours mean the same thing everywhere: blue is words, green is images, orange is actions.",
  ],
  takeaway: "A robot policy looks, reads and makes a small move, again and again. It learns that from demonstrations, and we grade it only by what it does on tables it never saw.",
  related: ["10-tokens", "20-images-to-tokens", "40-action-spaces", "43-imitation-learning", "90-closed-loop-evaluation"],
  lab: [
    { label: "The task our robot learns", href: "/lab#task" },
    { label: "How our policies scored, run by run", href: "/lab#history" },
  ],
});
