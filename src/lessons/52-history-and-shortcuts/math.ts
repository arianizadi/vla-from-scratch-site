/** The maths behind the lesson, each with a picture and a worked example. */
export const math = [
  {
    title: "The keep-going guess",
    formula: String.raw`\hat{a}_t = a_{t-1} + (a_{t-1} - a_{t-2})`,
    symbols: [
      [String.raw`a_{t-1}`, "the action one step earlier"],
      [String.raw`\hat{a}_t`, "the guess for the action at step t"],
      [String.raw`a_{t-1} - a_{t-2}`, "the last change: how far the previous step moved"],
    ],
    metaphor: "Catching a ball by assuming it keeps flying the way it was flying.",
    example: String.raw`If the gripper's target went from $100$ mm to $124$ mm on the last step, the guess for the next is $124 + 24 = 148$ mm. On a smooth reach that is almost exactly right, and no camera was used.`,
  },
  {
    title: "How few examples reward looking",
    formula: String.raw`\text{share} = \frac{\text{demos}}{\text{examples}}`,
    symbols: [
      [String.raw`\text{demos}`, "how many demonstrations, each with one first step"],
      [String.raw`\text{examples}`, "how many training examples, one per frame"],
    ],
    metaphor: "A test where only the first question of each page needs reading; the rest can be answered by copying the line above.",
    example: String.raw`1500 demonstrations cut into about $99{,}000$ examples: only $1500 / 99{,}000 \approx 1.5\%$ start at a demonstration's first step, where the scene decides the direction.`,
  },
];
