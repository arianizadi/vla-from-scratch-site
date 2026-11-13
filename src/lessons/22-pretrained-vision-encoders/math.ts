/**
 * The maths behind the lesson, explained with a picture and small numbers.
 * Rendered by the lesson page when present (not imported from lesson.ts).
 */
export const math = [
  {
    title: "How caption matching scores a picture",
    formula: String.raw`\text{score}(u, v) = \frac{u \cdot v}{\lVert u \rVert\,\lVert v \rVert}`,
    symbols: [
      [String.raw`u`, "the picture's summary vector"],
      [String.raw`v`, "the caption's vector"],
      [String.raw`u \cdot v`, "multiply matching entries and add them up"],
      [String.raw`\lVert u \rVert`, "the length of u, so only the direction counts"],
    ],
    metaphor: "Two arrows: pointing the same way scores 1, at right angles scores 0. Training turns each picture's arrow towards its own caption's arrow.",
    example: String.raw`Picture $u = (1, 2)$, its caption $v = (2, 4)$: same direction, score $1$. Another caption $w = (2, -1)$: $u \cdot w = 2 - 2 = 0$, score $0$. Slide the cube 3 cm and $u$ barely turns, so the score, the only grade, barely changes.`,
  },
  {
    title: "What a sharper picture costs",
    formula: String.raw`N = \left(\frac{s}{p}\right)^{2}, \qquad C = N^{2}`,
    symbols: [
      [String.raw`s`, "the side of the picture, in pixels"],
      [String.raw`p`, "the side of one patch, in pixels"],
      [String.raw`N`, "the number of patch tokens"],
      [String.raw`C`, "the comparisons between tokens in one layer"],
    ],
    metaphor: "Cutting a cake into smaller squares gives more pieces, and every piece must be compared with every other.",
    example: String.raw`A $224$-pixel picture with $32$-pixel patches: $7^2 = 49$ tokens, $2{,}401$ comparisons. With $14$-pixel patches: $16^2 = 256$ tokens, $65{,}536$ comparisons, about 27 times the work.`,
  },
];
