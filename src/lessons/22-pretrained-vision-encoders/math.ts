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
];
