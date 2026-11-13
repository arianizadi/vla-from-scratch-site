/** The maths behind the lesson, explained with a picture and small numbers. Rendered by the lesson page. */
export const math = [
  {
    title: "Tokens per picture",
    formula: "n = \\left(\\frac{S}{p \\cdot m}\\right)^{2}",
    symbols: [
      ["n", "tokens the reader makes from one picture"],
      ["S", "the side of the picture, in pixels"],
      ["p", "the side of one small square, in pixels"],
      ["m", "how many squares merge along each side (2 means a 2 × 2 block)"],
    ],
    metaphor: "Tiling a floor with small tiles, then gluing each 2 × 2 group into one big tile: the count follows the square of the floor's side.",
    example: "$S = 224$, $p = 16$, $m = 2$: $224 / 32 = 7$, so $n = 7^2 = 49$. Make the picture $256$ a side and $256 / 32 = 8$, so $n = 64$: a picture 14% wider costs 31% more tokens.",
  },
  {
    title: "Why freezing saves memory",
    formula: "M \\approx b \\cdot \\left(P_{\\text{all}} + 3\\,P_{\\text{train}}\\right)",
    symbols: [
      ["M", "memory for the model while training (before the working space of each batch)"],
      ["b", "bytes per stored number; here 2"],
      ["P_{\\text{all}}", "every number in the model: each is stored once"],
      ["P_{\\text{train}}", "the numbers that learn: each also needs a correction and two running notes for the optimiser, 3 more"],
    ],
    metaphor: "A library: every book takes one shelf slot, but a book you are rewriting also needs a draft and two notebooks next to it.",
    example: "Train all $2.2$ billion numbers: $2 \\times (2.2 + 3 \\times 2.2) = 17.6$ GB. Freeze all but $0.306$ billion: $2 \\times (2.2 + 3 \\times 0.306) \\approx 6.2$ GB, about a third.",
  },
];
