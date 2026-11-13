/** The maths behind the lesson, each with a picture and a worked example. */
export const math = [
  {
    title: "What chance looks like",
    formula: String.raw`P(\text{named, by luck}) = \frac{1}{k}`,
    symbols: [
      [String.raw`k`, "how many objects are on the table"],
      [String.raw`P`, "how often a policy that ignores the words still ends at the named object"],
    ],
    metaphor: "Guessing a multiple-choice question with three options: you are right one time in three without reading it.",
    example: String.raw`With $k = 3$ objects, a deaf policy scores about $1/3 \approx 33\%$. Scoring $30\%$ or $35\%$ says nothing; scoring $95\%$ says it listens.`,
  },
  {
    title: "Does it follow the object? The slope",
    formula: String.raw`\text{closed at} \approx b \cdot (\text{object position}) + c`,
    symbols: [
      [String.raw`b`, "the slope: how much the closing point moves when the named object moves"],
      [String.raw`c`, "a fixed offset"],
    ],
    metaphor: "A dog following a thrown ball: if the ball lands 1 m further, a dog that watches runs 1 m further too.",
    example: String.raw`Move the named object $10$ cm across many trials. If the gripper's closing point moves $10$ cm too, $b = 1$: it follows the object. If it stays put, $b = 0$: the scene is ignored. Halfway, $b = 0.5$, it follows only roughly.`,
  },
];
