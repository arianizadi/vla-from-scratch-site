/**
 * The maths behind the lesson, each piece with a picture and a worked example.
 * Rendered by the lesson page when present; not imported by lesson.ts.
 */

export const math = [
  {
    title: "How much a success rate wobbles",
    formula: String.raw`\hat p = \frac{k}{n}, \qquad \text{spread} \approx \sqrt{\frac{p\,(1-p)}{n}}`,
    symbols: [
      [String.raw`k`, "how many attempts succeeded"],
      [String.raw`n`, "how many attempts, one per new scene"],
      [String.raw`\hat p`, "the measured success rate"],
      [String.raw`p`, "the true rate the policy would reach over every possible scene"],
      [String.raw`\text{spread}`, "the standard deviation: how far a reading typically lands from the true rate"],
    ],
    metaphor: "Tossing a coin with an unknown bias. Ten tosses tell you little, a hundred tell you more, and a thousand pin it down: the wobble shrinks with the square root of the number of tosses.",
    example: String.raw`With $p = 0.93$ and $n = 100$: $\sqrt{0.93 \times 0.07 / 100} \approx 0.026$, about $2.6$ points. So $93$ one time and $96$ the next is ordinary wobble. With only $25$ scenes the spread doubles to about $5$ points, because $\sqrt{100/25} = 2$.`,
  },
  {
    title: "A range instead of one number",
    formula: String.raw`\hat p \pm 1.96 \sqrt{\frac{\hat p\,(1-\hat p)}{n}}`,
    symbols: [
      [String.raw`\hat p`, "the measured success rate"],
      [String.raw`n`, "how many attempts"],
      [String.raw`1.96`, "how many spreads wide to go so the range catches the true rate about 95 times in 100"],
    ],
    metaphor: "A fishing net instead of a spear: rather than one guess, cast a range wide enough that it catches the true rate 95 times out of 100.",
    example: String.raw`For $93$ of $100$: $0.93 \pm 1.96 \times 0.026 \approx 0.93 \pm 0.05$, so about $88\%$ to $98\%$. The site uses a refined version, the Wilson interval, which never spills past $100\%$ and gives $86\%$ to $97\%$ here.`,
  },
  {
    title: "Is a gap bigger than the wobble?",
    formula: String.raw`\text{spread of the gap} \approx \sqrt{\frac{p_1(1-p_1) + p_2(1-p_2)}{n}}`,
    symbols: [
      [String.raw`p_1,\ p_2`, "the two measured success rates"],
      [String.raw`n`, "attempts per policy"],
      [String.raw`\text{spread of the gap}`, "how much the difference between two readings wobbles by chance"],
    ],
    metaphor: "Two people on wobbly scales: to say who is heavier, the difference must be bigger than both wobbles combined.",
    example: String.raw`For $83$ and $93$ out of $100$: $\sqrt{(0.83 \times 0.17 + 0.93 \times 0.07)/100} \approx 0.045$. The gap of $0.10$ is about $2.2$ spreads: probably real, even though the two intervals overlap.`,
  },
];
