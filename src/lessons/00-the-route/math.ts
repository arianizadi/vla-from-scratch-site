/**
 * The maths behind the lesson, for the "maths" panel (discovered by the lesson
 * page; not imported by lesson.ts).
 */
export const math = [
  {
    title: "A success rate, and how sure it is",
    formula: "\\hat p = \\frac{k}{n} \\qquad \\text{margin} \\approx 2\\sqrt{\\frac{\\hat p\\,(1-\\hat p)}{n}}",
    symbols: [
      ["k", "how many tries succeeded"],
      ["n", "how many tries in total"],
      ["\\hat p", "the measured success rate"],
      ["\\text{margin}", "how far the true rate could plausibly be from the measured one"],
    ],
    metaphor:
      "Like judging a basketball player from a few free throws: ten shots give a rough idea, a hundred a much better one. The margin shrinks with the square root of the number of tries, so four times as many tries halve it.",
    example:
      "A policy lifts the cube in $k = 37$ of $n = 50$ new tables: $\\hat p = 0.74$. The margin is $2\\sqrt{0.74 \\times 0.26 / 50} \\approx 0.12$, so the true rate is somewhere around 62% to 86%. A careful version of this rule gives 60% to 84%. Two policies at 74% and 78% on 50 tries are not really different.",
  },
];
