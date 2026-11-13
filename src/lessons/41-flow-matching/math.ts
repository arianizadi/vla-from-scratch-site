/** The maths behind the lesson, each with a picture and a worked example. */
export const math = [
  {
    title: "Why one answer averages two",
    formula: String.raw`\arg\min_{y}\; \tfrac{1}{2}(y - a_1)^2 + \tfrac{1}{2}(y - a_2)^2 = \frac{a_1 + a_2}{2}`,
    symbols: [
      [String.raw`y`, "the one action the policy outputs"],
      [String.raw`\arg\min_{y}`, "the output y that makes what follows as small as possible"],
      [String.raw`a_1`, "one correct action from the demonstrations"],
      [String.raw`a_2`, "another correct action, seen just as often"],
      [String.raw`(y - a_1)^2`, "squared error: how far off the output is, squared"],
    ],
    metaphor: "A referee who must stand in one spot to be closest, on average, to two players ends up halfway between them, where neither is.",
    example: String.raw`Cubes at $a_1 = -10$ cm and $a_2 = +10$ cm. Output $y = 0$ scores $\tfrac12(100) + \tfrac12(100) = 100$; output $y = -10$ scores $\tfrac12(0) + \tfrac12(400) = 200$. The middle wins, and the middle is empty table.`,
  },
  {
    title: "A training example: blend, then point",
    formula: String.raw`x_s = (1 - s)\,a + s\,\varepsilon, \qquad \text{target} = \varepsilon - a`,
    symbols: [
      [String.raw`a`, "a real action from a demonstration"],
      [String.raw`\varepsilon`, "random noise of the same size"],
      [String.raw`s`, "the noise level, from 0 (all action) to 1 (all noise)"],
      [String.raw`x_s`, "the blend the policy is shown"],
      [String.raw`\varepsilon - a`, "the direction from the action to the noise: what the policy must output"],
    ],
    metaphor: "Mixing paint: a little grey in the blue, or a lot. Whatever the mix, the answer is the same arrow from blue to grey.",
    example: String.raw`Action $a = 2$, noise $\varepsilon = -1$, level $s = 0.25$: the blend is $0.75 \times 2 = 1.5$ plus $0.25 \times (-1) = -0.25$, so $x = 1.25$. The target is $-1 - 2 = -3$. At $s = 0.5$ the blend is $0.5$, and the target is still $-3$.`,
  },
  {
    title: "Walking back: one flow step",
    formula: String.raw`x \leftarrow x - \Delta s \cdot v(x, s)`,
    symbols: [
      [String.raw`x`, "where the draw is now, starting from pure noise"],
      [String.raw`v(x, s)`, "the direction the policy predicts at that point and noise level"],
      [String.raw`\Delta s`, "the step size: 1 divided by the number of flow steps"],
    ],
    metaphor: "Walking home in fog by asking “which way is away from home?” at every corner, and going the other way.",
    example: String.raw`With 4 flow steps, $\Delta s = 0.25$. Start at $x = 1.0$; if the policy says $v = -2$, the next point is $1.0 - 0.25 \times (-2) = 1.5$. Three more steps, each asking again, end on an action.`,
  },
];
