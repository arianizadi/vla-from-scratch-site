import { defineLesson } from "../define";
import { Compounding } from "./animations/Compounding";
import { CopyPairs } from "./animations/CopyPairs";
import { Copycat } from "./animations/Copycat";
import { NoRecovery } from "./animations/NoRecovery";

export default defineLesson({
  slug: "43-imitation-learning",
  idea: "A policy that copies an expert works on the expert's path, but its own mistakes take it to places the expert never showed.",
  beats: [
    {
      title: "Learning by copying",
      text: "Think of learning to cook from recordings of a chef. **Behaviour cloning**, the plainest kind of [imitation learning](/learn/02-how-we-got-here), works that way: record an expert's demonstrations, what it saw and did at every moment, then train the policy to give the same action for the same view.",
      animation: CopyPairs,
    },
    {
      title: "Small mistakes grow",
      text: "A tightrope walker who sways a little is suddenly somewhere they never practised. A policy is the same: a tiny error moves the arm off the expert's path, the next view looks unfamiliar, so the next guess is worse. This snowball is called **compounding error**.",
      animation: Compounding,
    },
    {
      title: "Experts never show recovery",
      text: "A driving instructor who never drifts cannot show how to correct a drift. Clean demonstrations contain no misses, so the policy never sees “missed, open, try again”. We moved the object mid-reach: clean-trained policies missed, while policies trained on recovery demonstrations turned back.",
      animation: NoRecovery,
    },
    {
      title: "Copying the wrong clue",
      text: "Forecasting “same as yesterday” is right most days without looking outside. Robot motion is smooth, so “same as the last action” predicts nearly every recorded step without the cameras. A policy can learn that **shortcut** instead of looking. Only the start, which object to reach for, needs the scene.",
      animation: Copycat,
    },
  ],
  edgeCases: [
    "A low loss on recorded data does not mean success on the robot. On recordings the expert's path is handed over; when running, the policy makes its own.",
    "More inputs are not always better. An input that hints at the answer, like the last move, can stop the policy from looking.",
    "Two experts doing the task differently can blur into a wrong average; [flow matching](/learn/41-flow-matching) is the cure for that one.",
    "Keeping only successful demonstrations removes every example of a mistake and its fix.",
  ],
  tips: [
    "Judge a policy by running it, not by its score on recordings.",
    "Put mistakes and recoveries in the demonstrations: nudge the object, vary the start.",
    "Compare against “repeat the last move”. A policy that barely beats it has learned little.",
    "Vary where the arm starts, so its own position does not give the target away.",
  ],
  takeaway: "Copying works on the expert's path; off it, a policy needs examples of recovering, and it must actually look rather than copy its last move.",
  related: ["41-flow-matching", "42-chunks-and-execution", "52-history-and-shortcuts", "103-case-self-correction"],
  lab: [
    { label: "Policies when the object moves mid-reach", href: "/lab#outside-the-training-conditions" },
    { label: "Which demonstrations taught recovery", href: "/lab#demonstrations" },
  ],
  tryIt: ["copycat", "disturbance"],
});
