/**
 * The maths behind the lesson, for the "maths" panel (discovered by the lesson
 * page; not imported by lesson.ts).
 */
export const math = [
  {
    title: "The loss: how far the guesses are",
    formula: "L = \\frac{1}{N} \\sum_{i=1}^{N} \\left(\\hat a_i - a_i\\right)^2",
    symbols: [
      ["N", "how many numbers are compared"],
      ["a_i", "the expert's number, for example one joint's next angle"],
      ["\\hat a_i", "the model's guess for the same number"],
      ["(\\hat a_i - a_i)^2", "the miss, squared so a miss in either direction counts and big misses count a lot"],
      ["L", "the loss: the average squared miss"],
    ],
    metaphor:
      "Like scoring darts by distance from the bullseye, but squaring each distance: a dart twice as far off costs four times as much, so the thrower fixes big misses first.",
    example:
      "The expert moves three joints by $0.2$, $0.5$ and $-0.1$; the model guesses $0.3$, $0.5$ and $-0.3$. The misses are $0.1$, $0$ and $-0.2$, squared $0.01$, $0$ and $0.04$. Their average is $L = 0.05 / 3 \\approx 0.017$. A training step nudges the guesses so the next $L$ is a little smaller.",
  },
];
