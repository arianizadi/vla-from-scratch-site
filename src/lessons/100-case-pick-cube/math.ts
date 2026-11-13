/**
 * The maths behind this lesson, explained with a picture and small numbers.
 * Not imported by lesson.ts: the lesson page finds and renders it by itself.
 */
export const math = [
  {
    title: "How much a success rate wobbles by chance",
    formula: "\\text{wobble} \\approx \\sqrt{\\frac{p\\,(1 - p)}{n}}",
    symbols: [
      ["p", "the robot's true success rate, as a fraction (0.74 means 74 in 100)"],
      ["n", "how many tries the test runs"],
      ["\\text{wobble}", "how far one test's score typically lands from the true rate"],
    ],
    metaphor:
      "Flip a slightly bent coin 50 times and count heads. Do it again and the count changes, though the coin did not. A robot's test score is the same kind of count.",
    example:
      "A robot with $p = 0.74$ tested on $n = 50$ layouts wobbles by $\\sqrt{0.74 \\times 0.26 / 50} \\approx 0.06$, so scores from about $62\\%$ to $86\\%$ (two wobbles either side) are all normal for it. That is why five settings of one robot spread over $12$ points meant nothing. With $n = 100$ the wobble falls to about $0.044$.",
  },
  {
    title: "Averaged weights: a running average",
    formula: "\\bar{\\theta} \\leftarrow \\beta\\,\\bar{\\theta} + (1 - \\beta)\\,\\theta",
    symbols: [
      ["\\theta", "the robot's numbers (weights) right after the latest training step"],
      ["\\bar{\\theta}", "the running average of those numbers, kept alongside"],
      ["\\beta", "how much of the old average to keep at each step, close to 1"],
      ["\\leftarrow", "“becomes”: the update made after every step"],
    ],
    metaphor:
      "Judging the weather by this week's average rather than by today: one odd day barely moves it, but a real change of season does.",
    example:
      "With $\\beta = 0.9$, an average at $10$ and a new value of $20$: $0.9 \\times 10 + 0.1 \\times 20 = 11$. One jumpy step moves the average a tenth of the way. Saving both sets of weights and testing both is cheap; early in training the average was often, not always, the better robot.",
  },
];
