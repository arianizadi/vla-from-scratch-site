/**
 * The maths behind the lesson, explained with a picture and small numbers.
 * Rendered by the lesson page when present (not imported from lesson.ts).
 */
export const math = [
  {
    title: "What guessing would score",
    formula: String.raw`P_{\text{guess}} = \frac{1}{k\,(k-1)\,(k-2)}`,
    symbols: [
      [String.raw`k`, "how many kinds of object there are, here 4"],
      [String.raw`k\,(k-1)\,(k-2)`, "how many ordered lists of three different objects exist"],
      [String.raw`P_{\text{guess}}`, "the chance a blind guess names all three in the right order"],
    ],
    metaphor: "Drawing three cards from four, one at a time, and needing them in exactly the order on the table.",
    example: String.raw`With $k = 4$: $4 \times 3 \times 2 = 24$ ordered lists, so $P_{\text{guess}} = 1/24$. On $300$ test scenes, luck alone gets about $300 / 24 \approx 12$ right. A model that gets about $256$ right is not guessing.`,
  },
  {
    title: "The swap test: how much the picture matters",
    formula: String.raw`\Delta = L_{\text{wrong}} - L_{\text{right}}`,
    symbols: [
      [String.raw`L_{\text{right}}`, "the model's surprise at the true caption, with its own picture"],
      [String.raw`L_{\text{wrong}}`, "its surprise at the same caption, with another scene's picture"],
      [String.raw`\Delta`, "the gap: how much the picture changed the model's mind"],
    ],
    metaphor: "Read a friend a description of a photo while showing them the wrong photo: if they frown, they were looking.",
    example: String.raw`Fed the way training fed it: $L_{\text{right}} = 0.10$, $L_{\text{wrong}} = 1.18$, so $\Delta \approx 1.1$, a clear gap. Fed the way the first test fed it: $1.93$ and $1.89$, so $\Delta \approx 0$: the picture was not getting through.`,
  },
];
