/** The maths behind the lesson, explained with a picture and small numbers. Rendered by the lesson page. */
export const math = [
  {
    title: "How many patch notes a picture makes",
    formula: "N_{\\text{patch}} = c \\times \\left(\\frac{S}{p}\\right)^{2}",
    symbols: [
      ["N_{\\text{patch}}", "the number of patch notes the reader hands over"],
      ["c", "how many camera pictures there are"],
      ["S", "the side of one picture, in pixels"],
      ["p", "the side of one patch, in pixels"],
    ],
    metaphor: "Tiling a square floor: the number of tiles grows with the square of the floor's side, so a floor twice as wide needs four times the tiles.",
    example: "Two cameras, pictures $224$ pixels a side, patches of $16$: each picture is $14 \\times 14 = 196$ patches, so $N_{\\text{patch}} = 2 \\times 196 = 392$ notes.",
  },
  {
    title: "Everything the mover reads, in one line",
    formula: "L = 1 + N_{\\text{word}} + N_{\\text{patch}} + 1 + H",
    symbols: [
      ["L", "the length of the line of notes the mover reads"],
      ["1", "first: one note saying how noisy the plan still is; later: one note for the arm's joint angles"],
      ["N_{\\text{word}}", "notes for the instruction's words"],
      ["N_{\\text{patch}}", "notes for the picture patches"],
      ["H", "the moves being planned, one note each"],
    ],
    metaphor: "A train: one engine, carriages of words, carriages of picture patches, one for the arm's pose, and at the back the carriages the mover is filling in.",
    example: "With $32$ word slots, $392$ patches and a plan of $H = 15$ moves: $L = 1 + 32 + 392 + 1 + 15 = 441$. The moves the mover fills in are the last $15$ of those $441$ notes.",
  },
];
