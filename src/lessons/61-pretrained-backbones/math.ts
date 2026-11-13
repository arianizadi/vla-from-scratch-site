/** The maths behind the lesson, explained with a picture and small numbers. Rendered by the lesson page. */
export const math = [
  {
    title: "Why freezing saves memory",
    formula: "M \\approx b \\cdot \\left(P_{\\text{all}} + 3\\,P_{\\text{train}}\\right)",
    symbols: [
      ["M", "memory the model needs while it trains"],
      ["b", "bytes per stored number; here 2"],
      ["P_{\\text{all}}", "every number in the model: each is stored once"],
      ["P_{\\text{train}}", "the numbers that learn: each also keeps its correction and two running notes"],
      ["3", "those three extra copies per learning number"],
    ],
    metaphor: "A library: every book takes one shelf slot, but a book you are rewriting also needs a draft and two notebooks next to it.",
    example: "Train all $2.2$ billion numbers: $2 \\times (2.2 + 3 \\times 2.2) = 17.6$ GB.\nFreeze all but $0.3$ billion: $2 \\times (2.2 + 3 \\times 0.3) = 6.2$ GB.\nThat is about a third of the memory.",
  },
];
