/**
 * The maths behind the lesson, each piece with a picture and a worked example.
 * Rendered by the lesson page when present; not imported by lesson.ts.
 */

export const math = [
  {
    title: "A range instead of one number",
    formula: String.raw`\hat p \pm 1.96 \sqrt{\frac{\hat p\,(1-\hat p)}{n}}`,
    symbols: [
      [String.raw`\hat p`, "the measured success rate"],
      [String.raw`n`, "how many attempts"],
      [String.raw`1.96`, "how wide to cast: the range catches the true rate 95 times in 100"],
    ],
    metaphor: "A fishing net instead of a spear: rather than one guess, cast a range wide enough that it catches the true rate 95 times out of 100.",
    example: String.raw`For $93$ of $100$: $\sqrt{0.93 \times 0.07 / 100} \approx 0.026$.
So $0.93 \pm 1.96 \times 0.026 \approx 0.93 \pm 0.05$: about $88\%$ to $98\%$.
Scoring $96$ on the next $100$ scenes is ordinary wobble. A refined version, the Wilson interval, never spills past $100\%$ and gives $86\%$ to $97\%$ here.`,
  },
  {
    title: "Is a gap bigger than the wobble?",
    formula: String.raw`\text{spread of the gap} \approx \sqrt{\frac{p_1(1-p_1) + p_2(1-p_2)}{n}}`,
    symbols: [
      [String.raw`p_1`, "the first policy's measured success rate"],
      [String.raw`p_2`, "the second policy's measured success rate"],
      [String.raw`n`, "attempts per policy"],
      [String.raw`\text{spread of the gap}`, "how much the difference between two readings wobbles by chance"],
    ],
    metaphor: "Two people on wobbly scales: to say who is heavier, the difference must be bigger than both wobbles combined.",
    example: String.raw`For $83$ and $93$ out of $100$: $\sqrt{(0.83 \times 0.17 + 0.93 \times 0.07)/100} \approx 0.045$. The gap of $0.10$ is about $2.2$ spreads: probably real, even though the two intervals overlap.`,
  },
];
