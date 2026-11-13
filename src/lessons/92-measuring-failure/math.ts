/**
 * The maths behind the lesson, for the "maths" panel. Not imported by
 * lesson.ts; the lesson page finds this file on its own.
 */
export const math = [
  {
    title: "What guessing scores",
    formula: String.raw`p_{\text{chance}} = \frac{1}{k}`,
    symbols: [
      [String.raw`p_{\text{chance}}`, "the share of tries a guesser closes at the asked-for object"],
      [String.raw`k`, "how many objects are on the table"],
    ],
    metaphor: "Pulling a marble from a bag with your eyes shut: with three marbles, you get the red one about a third of the time.",
    example: String.raw`With $k = 3$ objects, a policy that ignores the instruction lands on the asked-for one in about $\frac{1}{3}$ of tries: roughly $33$ in $100$.`,
  },
  {
    title: "How much a score wobbles",
    formula: String.raw`p \pm 2\sqrt{\frac{p\,(1-p)}{n}}`,
    symbols: [
      [String.raw`p`, "the rate you expect, as a fraction"],
      [String.raw`n`, "how many tries you ran"],
      [String.raw`\sqrt{\cdot}`, "square root: the typical size of the wobble"],
    ],
    metaphor: "Flip a fair coin 100 times and you rarely get exactly 50 heads. A test score wobbles the same way.",
    example: String.raw`A guesser has $p = \frac{1}{3}$. Over $n = 100$ tries, $\sqrt{\frac{0.33 \times 0.67}{100}} \approx 0.047$, so it scores anywhere from about $24$ to $43$ in $100$. Seeing $37$ proves nothing; a steady climb over several tests does.`,
  },
  {
    title: "The slope: does the grasp follow the object?",
    formula: String.raw`b = \frac{\sum_i (x_i - \bar{x})(y_i - \bar{y})}{\sum_i (x_i - \bar{x})^2}`,
    symbols: [
      [String.raw`x_i`, "where the object was in try i"],
      [String.raw`y_i`, "where the gripper closed in try i"],
      [String.raw`\bar{x},\ \bar{y}`, "the averages of those positions"],
      [String.raw`\sum_i`, "add up over all tries"],
      [String.raw`b`, "the slope: how far the grasp moves per step the object moves"],
    ],
    metaphor: "Nudge the object 10 cm to the right. If the grasp also moves about 10 cm, the slope is near 1; if the grasp stays put, it is near 0.",
    example: String.raw`Invented numbers: the object sits at $0.40$, $0.50$, $0.60$ m. A gripper closing at $0.41$, $0.49$, $0.60$ m gives $b = \frac{0.019}{0.020} \approx 0.95$: it follows. One closing at $0.52$, $0.47$, $0.51$ m gives $b = \frac{-0.001}{0.020} = -0.05$: it ignores the scene.`,
  },
];
