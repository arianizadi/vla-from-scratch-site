/** The maths behind the lesson, each with a picture and a worked example. */
export const math = [
  {
    title: "How many pieces an image makes",
    formula: String.raw`P = \left(\frac{S}{p}\right)^2`,
    symbols: [
      [String.raw`S`, "the image's side, in pixels"],
      [String.raw`p`, "the side of one square piece, in pixels"],
      [String.raw`P`, "how many pieces, and so how many tokens, one image becomes"],
    ],
    metaphor: "Cutting a square cake into a grid: halve the slice width and you get four times as many slices.",
    example: String.raw`A $224 \times 224$ image cut into $16 \times 16$ pieces gives $(224/16)^2 = 14^2 = 196$ tokens. Two cameras give $392$.`,
  },
  {
    title: "The length of the row",
    formula: String.raw`L = 1 + N + 1 + C`,
    symbols: [
      [String.raw`1`, "one token for the noise level, then one for the arm's joints"],
      [String.raw`N`, "the scene tokens handed over by the backbone"],
      [String.raw`C`, "one slot per future action in the chunk"],
      [String.raw`L`, "how many tokens the action head reads"],
    ],
    metaphor: "Packing a tray: a label, the ingredients, a note about the oven, and one empty plate per course to fill.",
    example: String.raw`With 32 word slots and two images of 196 pieces, $N = 32 + 392 = 424$, and with $C = 15$ the row is $1 + 424 + 1 + 15 = 441$ tokens. With one summary, $N = 1$ and the row is only $18$ long.`,
  },
  {
    title: "What a long row costs",
    formula: String.raw`\text{comparisons per layer} = L^2`,
    symbols: [[String.raw`L`, "the length of the row: every token is compared with every other"]],
    metaphor: "A party where everyone greets everyone: double the guests and the handshakes go up four times.",
    example: String.raw`A row of $441$ tokens makes $441^2 \approx 194{,}000$ comparisons per layer, against $18^2 = 324$ for the one-summary row, and the action head repeats this at every flow step.`,
  },
];
