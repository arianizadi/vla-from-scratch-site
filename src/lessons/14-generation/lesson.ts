import { defineLesson } from "../define";
import { GenerationLoop } from "./animations/GenerationLoop";
import { GreedyVsSampling } from "./animations/GreedyVsSampling";
import { KeepNotes } from "./animations/KeepNotes";
import { TemperatureDial } from "./animations/TemperatureDial";

export default defineLesson({
  slug: "14-generation",
  idea: "To write, a language model gives every possible next word a chance, picks one, adds it to the text, and repeats until it decides to stop.",
  beats: [
    {
      title: "One word at a time",
      text: "Tap your phone's suggested next word again and again and a sentence appears. Generation works the same way. The model gives every possible next token a chance, one is picked and added, and the longer text goes back in. The loop stops at a special **end token** or at a length limit.",
      animation: GenerationLoop,
    },
    {
      title: "Take the favourite, or roll a die",
      text: "**Greedy** picking always takes the most likely token: same prompt, same text. **Sampling** rolls a die weighted by the chances, so the text varies. Greedy can get stuck repeating itself; sampling can wander off. To test whether our robot's vision model sees a scene, we ask it to name the objects, greedily, so the test repeats exactly.",
      animation: GreedyVsSampling,
    },
    {
      title: "The boldness dial",
      text: "**Temperature** is a boldness dial. Turned down, the favourite takes almost all the chance; turned up, the chances even out and long shots get picked. A second trick cuts the tail: thousands of tiny chances add up to a real risk of nonsense, so the unlikeliest words are dropped before the die is rolled.",
      animation: TemperatureDial,
    },
    {
      title: "Keep notes, don't re-read",
      text: "Reading aloud, you don't restart the book for every new word. Earlier words never change, so the model keeps their notes in a **cache**, a memory of past work, and works out only the newest token each pass. For one of our captions, that cut the work from about 8,000 token passes to 300.",
      animation: KeepNotes,
    },
  ],
  edgeCases: [
    "Greedy text can loop, repeating one phrase until it hits the length limit.",
    "If the model never saw an end token where answers stop, it keeps writing until the limit.",
    "One unlikely pick changes everything after it, because each picked word becomes part of the input.",
    "Temperature and tail cutting never change which word is the favourite, so they make no difference to greedy picking.",
  ],
  tips: [
    "Use greedy picking for tests and checks; use sampling when you want variety.",
    "Turn the temperature down for focus and up for variety, and cut the tail to avoid nonsense.",
    "If the text repeats itself, try the same prompt with sampling before blaming the model.",
  ],
  takeaway: "Generation is a loop: give every next word a chance, pick one, add it, repeat. How you pick decides whether the text is repeatable or varied.",
  related: ["11-the-transformer-block", "13-training-a-language-model", "32-testing-a-vlm"],
  lab: [{ label: "Robot policies built on the from-scratch models", href: "/lab#backbones" }],
});
