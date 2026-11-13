import { defineLesson } from "../define";
import { AttentionMix } from "./animations/AttentionMix";
import { CausalMask } from "./animations/CausalMask";
import { IdsToLogits } from "./animations/IdsToLogits";
import { ResidualStream } from "./animations/ResidualStream";

export default defineLesson({
  slug: "11-the-transformer-block",
  idea: "In a transformer block, every word gathers what it needs from the other words, then adds what it learned to a running set of notes.",
  beats: [
    {
      title: "From numbers to a guess",
      text: "Picture an assembly line. Each token's row of numbers passes through a stack of stations called **blocks**, all built alike but tuned differently. At the end, every place in the sentence gives a score to each possible next token. A robot's instruction travels down the same line before any action is chosen.",
      animation: IdsToLogits,
    },
    {
      title: "Listening to the right words",
      text: "At a noisy party you listen most to whoever matters to you. **Attention** works the same way: each word asks a question, every word offers a label, and good matches get a bigger share. In “pick up the red cube”, `cube` listens mostly to `red`, so it now carries the colour of the right object.",
      animation: AttentionMix,
    },
    {
      title: "No peeking at the answer",
      text: "The model learns by guessing the next word at every place at once, like a quiz with the answers covered. If a word could see the word after it, it would copy the answer. The **causal mask**, a rule that hides later words, keeps it honest. A robot's action part drops this mask, because it plans all its steps together.",
      animation: CausalMask,
    },
    {
      title: "Adding notes, never erasing",
      text: "Think of a shared notebook passed down the line. Each block reads it, works something out and writes it in the margin. Attention adds what words learned from each other; a **feed-forward network**, a small calculator for each word alone, adds its own result. Nothing is erased, so later blocks can read everything.",
      animation: ResidualStream,
    },
  ],
  edgeCases: [
    "Attention is not understanding. It is a weighted mix decided by learned matches, and it can lean on the wrong word.",
    "Blocks look alike but are not copies: each has its own learned numbers.",
    "Without the mask in training, the model would score perfectly and learn nothing, because it would read the answer.",
    "In a small model, most of the numbers can sit in the word table and the final scorer, not in the blocks.",
  ],
  tips: [
    "To guess what a word attends to, ask which other word would help you understand it.",
    "Picture the running notes: every block may add a line, none may erase one.",
    "Mask the future when guessing one step after another; drop the mask when planning all steps at once.",
  ],
  takeaway: "In each block, every word gathers what it needs from the others and adds it to shared notes that later blocks keep reading.",
  related: ["10-tokens", "12-positions", "13-training-a-language-model", "14-generation"],
  lab: [{ label: "The robot policy whose action part is built from these blocks", href: "/lab#what-it-depends-on" }],
  tryIt: ["attention"],
});
