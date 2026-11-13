import { defineLesson } from "../define";
import { BpeMerges } from "./animations/BpeMerges";
import { EmbeddingLookup } from "./animations/EmbeddingLookup";
import { PaddingMask } from "./animations/PaddingMask";
import { SplitIntoTokens } from "./animations/SplitIntoTokens";

export default defineLesson({
  slug: "10-tokens",
  idea: "A tokenizer turns text into a list of whole numbers, and each number picks one row of numbers the model has learned.",
  beats: [
    {
      title: "Text has to become numbers",
      text: "A network only does arithmetic, so “pick up the red cube” must become integers. The **tokenizer** cuts the text into pieces called **tokens** and swaps each one for its **id**: its position in a fixed list, the **vocabulary**. Same text in, same ids out, every time.",
      animation: SplitIntoTokens,
    },
    {
      title: "Pieces, not letters or words",
      text: "Letters make sequences long. Whole words fail on a word never seen. **Subwords** sit in between. Byte-pair encoding learns them: start from single characters and keep merging the most frequent neighbouring pair. New text replays the merges in order, so `cubed`, never seen, still becomes `cube` + `d`.",
      animation: BpeMerges,
    },
    {
      title: "Each id picks a row",
      text: "The model keeps an **embedding table**: one row of numbers per token. An id is a row number. The model reads that row and works with the vector from then on. The table is learned in training, which is why a model can only read ids from the tokenizer it was trained with.",
      animation: EmbeddingLookup,
    },
    {
      title: "Batches need padding",
      text: "Training stacks prompts into one rectangle, so short rows get a **pad** token at the end. An **attention mask** marks real tokens 1 and pads 0. The language model reads left to right, and the pads sit on the right, so no real token ever sees one.",
      animation: PaddingMask,
    },
  ],
  edgeCases: [
    "`pick`, `Pick` and ` pick` (with a leading space) are three different tokens. A trailing full stop adds one more id.",
    "The same task can need different lengths: here the red cube takes 5 ids and the yellow T block 6, so rows differ before padding.",
    "A token appended after the padding sits behind the pads in training but right after the text when served alone. Insert it after the last real token.",
    "Too long gets cut. This tokenizer cuts from the left, so an over-long prompt loses its first ids, image placeholders included.",
    "A tokenizer without a pad token may add one with an id one past the last row of the table: an index error at lookup.",
  ],
  tips: [
    "Print the ids and the tokens of your longest instruction before you set any length budget.",
    "Check that the tokenizer's length equals the model's vocabulary size before training, not after.",
    "Zero out pad positions before the embedding lookup: never look up an id you are about to ignore.",
    "A big vocabulary costs memory. The model scores every token at every position: one batch of those scores took 6.5 GB here.",
  ],
  takeaway: "A tokenizer is a fixed lookup from text to row numbers. When tokens go wrong, look at padding, lengths and which tokenizer made the ids before you look at the model.",
  related: ["11-the-transformer-block", "12-positions", "51-language-conditioning", "93-train-inference-skew"],
  lab: [
    { label: "When the instruction's ids start to matter", href: "/lab#before-the-fix" },
    { label: "The position-table bug and the models it reached", href: "/lab#position-fix" },
  ],
  tryIt: ["tokenizer", "padding-shift"],
});
