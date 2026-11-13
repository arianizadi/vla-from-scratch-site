import { defineLesson } from "../define";
import { BpeMerges } from "./animations/BpeMerges";
import { EmbeddingLookup } from "./animations/EmbeddingLookup";
import { PaddingMask } from "./animations/PaddingMask";
import { SplitIntoTokens } from "./animations/SplitIntoTokens";

export default defineLesson({
  slug: "10-tokens",
  idea: "Before a model can read a sentence, the sentence is cut into small pieces and each piece is swapped for a number.",
  beats: [
    {
      title: "Text has to become numbers",
      text: "A cloakroom: hand in a coat, get a ticket number. A model only does arithmetic, so “pick up the red cube” is cut into **tokens** by a **tokenizer**, and each is swapped for its ticket, an **id**: its number in a fixed list. A robot's instruction arrives only as numbers.",
      animation: SplitIntoTokens,
    },
    {
      title: "Pieces, not letters or words",
      text: "A few common bricks can build almost anything. Single letters make sentences long; whole words fail on any new word. **Subwords** sit in between: start from letters and keep gluing the pair seen side by side most often. A word never seen before still breaks into known pieces.",
      animation: BpeMerges,
    },
    {
      title: "Each number opens a row",
      text: "An id works like a locker number: it opens one row of the **embedding table**, a list of numbers for every token. The model works with that row from then on. The rows are learned in training, so a model understands only the ids of its own tokenizer.",
      animation: EmbeddingLookup,
    },
    {
      title: "Short sentences get padding",
      text: "Training reads many instructions at once, stacked like rows of a grid, so short rows are filled with blank **pad** tokens. A **mask**, a row of 1s and 0s, marks which slots are real. The model reads left to right and blanks come last, so no real word sees them.",
      animation: PaddingMask,
    },
  ],
  edgeCases: [
    "A token is not always a word: a rare word splits into several pieces, and a space usually rides along at the front of the next word.",
    "Capitals and spaces count. “Pick” and “pick” are different tokens with different numbers.",
    "The same kind of task can need different lengths: “red cube” takes fewer tokens than “yellow T block”.",
    "Using a different tokenizer with a trained model scrambles everything: its numbers point to the wrong rows of the table.",
    "Text that is too long gets cut, and the part that is cut may be the part that mattered.",
  ],
  tips: [
    "To see what a model sees, look at the pieces of your sentence, not its letters.",
    "Common words cost one token and rare words several, so plain, consistent instructions stay short and alike.",
    "Keep a model and its tokenizer together, like a lock and its key.",
  ],
  takeaway: "A tokenizer cuts text into known pieces and swaps each piece for a row number; the model only ever sees those numbers.",
  related: ["11-the-transformer-block", "12-positions", "51-language-conditioning"],
  lab: [{ label: "When the robot starts to use the instruction", href: "/lab#before-the-fix" }],
  tryIt: ["tokenizer"],
});
