import { defineLesson } from "../define";
import { GradientSteps } from "./animations/GradientSteps";
import { LossMeter } from "./animations/LossMeter";
import { NextTokenTargets } from "./animations/NextTokenTargets";

export default defineLesson({
  slug: "13-training-a-language-model",
  idea: "A language model learns by guessing the next word of real text, measuring how surprised it was, and nudging its numbers after every guess.",
  beats: [
    {
      title: "Text is its own answer key",
      text: "Cover the rest of a sentence with your hand and guess the next word. The answer at each place is the word that follows, so any text works and nobody writes labels. With the [causal mask](/learn/11-the-transformer-block), one pass checks every guess in a sentence at once.",
      animation: NextTokenTargets,
    },
    {
      title: "Measuring surprise",
      text: "The **loss** is the model's surprise at the true next word: low when it had given that word a high chance. Knowing nothing is a blind pick among about 50,000 tokens. Our small model ended as unsure as a pick among 60, and it wrote readable English.",
      animation: LossMeter,
    },
    {
      title: "Small steps downhill",
      text: "Walking down a valley in fog, you feel the slope and step downhill. After each **batch**, a handful of texts read together, every number in the model moves a little in the direction that lowers the surprise. Steps start small, grow, then shrink so the model settles.",
      animation: GradientSteps,
    },
    {
      title: "Low loss is not the goal",
      text: "A student can memorise last year's answers and still fail a new exam. A low loss only says the model predicts its practice text well. We judged ours by what was built on it: a model that reads pictures, then a robot policy.",
    },
  ],
  edgeCases: [
    "A low loss on practice text can mean memorising rather than learning; only text the model never saw can tell the two apart.",
    "Steps that are too big overshoot the valley floor, and the loss climbs instead of falling.",
    "One odd batch can give a huge push. Training caps the size of any single push so one bad batch cannot throw it off.",
    "For a robot policy, the loss can fall smoothly while the robot still fails its task.",
  ],
  tips: [
    "Expect the loss to fall fast at first and then flatten. A sudden climb usually means the steps are too big.",
    "Keep some text aside that the model never trains on, and score that too.",
    "Judge a model by what it does, not only by its loss.",
  ],
  takeaway: "A language model learns by guessing the next word, measuring its surprise, and nudging every number a little downhill, thousands of times over.",
  related: ["11-the-transformer-block", "14-generation", "80-the-training-loop", "91-loss-is-not-success"],
  lab: [{ label: "Does the robot need a pretrained backbone?", href: "/lab#backbones" }],
  tryIt: ["training-step", "loss-vs-success"],
});
