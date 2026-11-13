/**
 * The maths behind the training lesson, explained with a picture and a small
 * worked example. Rendered by the lesson page when present.
 */
export const math = [
  {
    title: "Surprise at the true next word",
    formula: "L = -\\frac{1}{N} \\sum_{t=1}^{N} \\log p\\,(x_{t+1} \\mid x_1, \\dots, x_t)",
    symbols: [
      ["x_t", "the token at place t of the text"],
      ["p\\,(x_{t+1} \\mid x_1, \\dots, x_t)", "the chance the model gave the true next token, after reading all before it"],
      ["\\log", "the natural logarithm: a chance of 1 gives 0, small chances give big negatives"],
      ["N", "how many places were scored"],
      ["L", "the loss: the average surprise; the minus sign makes it positive"],
    ],
    metaphor: "A weather forecaster's report card: saying “90% sun” on a sunny day costs little; saying “1% sun” on a sunny day costs a lot.",
    example:
      "If the model gives the true next word a chance of $0.5$, the surprise is $-\\log 0.5 = 0.69$. A chance of $0.01$ costs $-\\log 0.01 = 4.6$. A model that knows nothing spreads its chances evenly over 49,280 tokens and scores $\\log 49{,}280 = 10.8$. A loss of $4.1$ means the true word got about $e^{-4.1} \\approx 1/60$ on average.",
  },
  {
    title: "One step downhill",
    formula: "w \\leftarrow w - \\eta \\, \\frac{\\partial L}{\\partial w}",
    symbols: [
      ["w", "one of the model's numbers (a weight)"],
      ["\\frac{\\partial L}{\\partial w}", "the slope: how much the loss rises if w grows a little"],
      ["\\eta", "the step size, or learning rate: small, then larger, then small again"],
      ["\\leftarrow", "becomes"],
    ],
    metaphor: "Walking down a hill in fog: feel which way the ground rises, then step the other way. The step size is how long a stride you dare.",
    example:
      "Say the loss is $L = w^2$, lowest at $w = 0$, and $w = 2$. The slope is $2w = 4$. With step size $\\eta = 0.1$, $w$ becomes $2 - 0.1 \\times 4 = 1.6$, and the loss drops from $4$ to $2.56$. With $\\eta = 1.1$ it becomes $2 - 4.4 = -2.4$: overshot, and the loss rose to $5.76$.",
  },
];
