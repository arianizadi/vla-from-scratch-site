/**
 * The maths behind the lesson, for the "maths" panel (discovered by the lesson
 * page; not imported by lesson.ts).
 */
export const math = [
  {
    title: "Why two right answers average into a wrong one",
    formula: "E(x) = (x - a)^2 + (x - b)^2 \\quad\\text{is smallest at}\\quad x = \\frac{a + b}{2}",
    symbols: [
      ["a", "where one demonstration reached: the left cube"],
      ["b", "where another demonstration reached: the right cube"],
      ["x", "the single answer the model learns for this scene"],
      ["E(x)", "the total squared error the model is trained to make small"],
    ],
    metaphor:
      "Two friends wait for you, one at each end of a street, and you must pick one meeting point that keeps the total walking (squared) small. The answer is the middle of the street, where nobody is.",
    example:
      "Put the left cube at $a = -10$ cm and the right one at $b = +10$ cm. Reaching for the left cube costs $E(-10) = 0 + 400 = 400$. Reaching for the gap costs $E(0) = 100 + 100 = 200$, half as much. So training pulls the reach to $x = 0$: empty table.",
  },
  {
    title: "How much a success count can wobble",
    formula: "\\text{margin} \\approx 2\\sqrt{\\frac{p\\,(1-p)}{n}}",
    symbols: [
      ["p", "the measured success rate"],
      ["n", "how many tries it was measured on"],
      ["\\text{margin}", "how far the true rate could plausibly be from the measured one"],
    ],
    metaphor:
      "Toss a fair coin ten times and you may well see seven heads. A handful of tries wobbles; only many tries settle down.",
    example:
      "With $n = 100$ tries at $p = 0.9$, the margin is $2\\sqrt{0.9 \\times 0.1 / 100} = 0.06$: 90% could be anything from about 84% to 96%. One of our policies did score 84 and 93 on two sets of 100 tables.",
  },
];
