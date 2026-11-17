import { defineMath } from "../define";

export default defineMath([
  {
    title: "The best a word lookup can do",
    formula: String.raw`\text{best} = \sum_{w} P(w)\,\max_{s} P(s \mid w)`,
    symbols: [
      [String.raw`w`, "one instruction, word for word", "language"],
      [String.raw`P(w)`, "how often that instruction is given", "ink"],
      [String.raw`s`, "a shoot it could mean", "action"],
      [String.raw`P(s \mid w)`, "how often the instruction means that shoot", "accent"],
    ],
    metaphor: "A clerk who never looks at the shelf. For each request they always hand over the jar that is most often the right one.",
    example: String.raw`Take one instruction: “cut the second shoot from the top”.
Suppose, as an example, half the plants have three shoots and half have two.
It means the middle shoot on half the plants and the lowest on the other half, so $\max_{s} P(s \mid w) = 0.5$.
Whatever one answer a lookup gives, it is wrong on half the plants.`,
  },
  {
    title: "Only pieces that fit the grammar",
    formula: String.raw`p_A(t) = \frac{p(t)\,[t \in A]}{\sum_{u \in A} p(u)}`,
    symbols: [
      [String.raw`t`, "a possible next piece of text", "language"],
      [String.raw`p(t)`, "how likely the language model finds it", "ink"],
      [String.raw`A`, "the pieces the grammar allows next", "accent"],
      [String.raw`u`, "each allowed piece, to add them up", "ink"],
      [String.raw`p_A(t)`, "its chance once the grammar has filtered", "action"],
    ],
    metaphor: "A form with boxes: only what fits the next box may be written. Among what fits, the model still picks what it likes best.",
    example: String.raw`The program so far reads “Cut(Rank(2,”. As an example, the model likes three next pieces: “top” $0.5$, “the” $0.3$, “bottom” $0.2$.
The grammar allows only “top” and “bottom”: together $0.5 + 0.2 = 0.7$.
After the filter: “top” $0.5 / 0.7 \approx 0.71$, “bottom” $0.2 / 0.7 \approx 0.29$, “the” $0$.
The program is always well formed, but its meaning can still be wrong.`,
  },
]);
