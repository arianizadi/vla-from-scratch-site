/**
 * A worked example of a lesson's math.ts ("The math, step by step"), kept
 * outside every lesson folder: it is not a lesson, nothing discovers it as
 * one. The preview page /preview/math renders it, and the build checks it
 * with the same validator as a real math.ts. Copy its shape, not its text.
 */

import { defineMath } from "../define";

export default defineMath([
  {
    title: "A point on the straight path",
    formula: "x_t = (1 - t)\\,x_0 + t\\,x_1",
    symbols: [
      ["x_0", "where we start: random noise", "ink"],
      ["x_1", "where we want to end: a good action", "action"],
      ["t", "how far along we are, from 0 to 1", "accent"],
      ["x_t", "the point that far along the path", "vision"],
    ],
    metaphor: "Two pins on a map and a string between them. $t$ says how far along the string you stand.",
    example:
      "Start at $x_0 = 2$ and aim for $x_1 = 5$.\nHalfway means $t = 0.5$.\nThen $x_t = 0.5 \\times 2 + 0.5 \\times 5 = 3.5$, exactly between the two pins.",
  },
  {
    title: "Score the model's guess",
    formula: "\\mathcal{L} = \\big(v - (x_1 - x_0)\\big)^2",
    symbols: [
      ["v", "the direction the model guesses at that point", "accent"],
      ["x_1 - x_0", "the true direction: goal minus start", "action"],
      ["\\mathcal{L}", "the score to make small: zero means a perfect guess", "ink"],
    ],
    metaphor: "A coach watching each step: the further your step points from the goal, the louder the coach shouts.",
    example:
      "The true direction is $5 - 2 = 3$.\nThe model guesses $v = 2.5$.\nThe score is $(2.5 - 3)^2 = 0.25$: small, but not zero, so training nudges the guess up.",
  },
]);
