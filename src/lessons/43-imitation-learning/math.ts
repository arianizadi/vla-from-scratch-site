/** The maths behind the lesson, each with a picture and a worked example. */
export const math = [
  {
    title: "Copying is fitting pairs",
    formula: String.raw`\min_{\pi}\; \frac{1}{N}\sum_{i=1}^{N} \big\lVert \pi(o_i) - a_i \big\rVert^2`,
    symbols: [
      [String.raw`\pi`, "the policy: a function from what it sees to what it does"],
      [String.raw`o_i`, "the i-th recorded view (camera images and joint angles)"],
      [String.raw`a_i`, "the action the expert took at that view"],
      [String.raw`N`, "how many recorded pairs there are"],
      [String.raw`\big\lVert \pi(o_i) - a_i \big\rVert^2`, "squared distance between the policy's guess and the expert's action"],
      [String.raw`\min_{\pi}`, "find the policy that makes this average as small as possible"],
    ],
    metaphor: "Marking a practice exam against the answer key, question by question.",
    example: String.raw`If the expert moved the gripper $3$ cm right at some view and the policy says $2$ cm, that pair costs $(2 - 3)^2 = 1$. Training nudges the policy to shrink the average cost over all pairs.`,
  },
  {
    title: "How mistakes snowball",
    formula: String.raw`\text{extra cost} \;\lesssim\; \varepsilon\, T^2 \quad \text{instead of} \quad \varepsilon\, T`,
    symbols: [
      [String.raw`\varepsilon`, "how often the policy errs on views the expert saw"],
      [String.raw`T`, "how many steps an episode lasts"],
    ],
    metaphor: "One wrong turn on a road trip puts you on unfamiliar roads, where the next turns are guesses too.",
    example: String.raw`With $\varepsilon = 1\%$ and $T = 66$ steps, independent mistakes would cost about $0.01 \times 66 \approx 0.7$ steps. Mistakes that lead to unfamiliar views can cost up to $0.01 \times 66^2 \approx 44$ steps.`,
  },
];
