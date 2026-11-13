/**
 * The maths behind the lesson, each piece with a picture and a worked example.
 * Rendered by the lesson page when present; not imported by lesson.ts.
 */

export const math = [
  {
    title: "The loss is an average over moments",
    formula: String.raw`L = \frac{1}{N} \sum_{i=1}^{N} (\hat a_i - a_i)^2`,
    symbols: [
      [String.raw`L`, "the loss: one number for how far off the policy is"],
      [String.raw`N`, "how many recorded moments are averaged"],
      [String.raw`\hat a_i`, "the move the policy predicts at moment i"],
      [String.raw`a_i`, "the move the expert actually made at moment i"],
      [String.raw`(\hat a_i - a_i)^2`, "the miss at that moment, squared so that misses in either direction count"],
    ],
    metaphor: "A class average: one failed exam hides easily among 65 good ones, even if that one exam was the only one that mattered.",
    example: String.raw`A toy demonstration of $66$ moments. Policy A misses every easy moment by $0.05$ but the deciding first moment by $0.5$, heading for the wrong object: $L = (65 \times 0.0025 + 0.25)/66 \approx 0.006$. Policy B misses every moment, the first included, by $0.1$: $L = 66 \times 0.01 / 66 = 0.01$. A has the lower loss, yet only B goes to the right object.`,
  },
];
