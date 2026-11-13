/**
 * The maths behind the lesson, explained with a picture and small numbers.
 * Rendered by the lesson page when present (not imported from lesson.ts).
 */
export const math = [
  {
    title: "The grade: only caption words count",
    formula: String.raw`L = -\frac{1}{|S|}\sum_{t \in S} \log p\left(x_{t+1} \mid x_{1..t}\right)`,
    symbols: [
      [String.raw`S`, "the graded positions: caption words only, not picture seats or padding"],
      [String.raw`|S|`, "how many graded positions there are"],
      [String.raw`x_{1..t}`, "everything so far: the picture's tokens and the words before"],
      [String.raw`p`, "the chance the model gave to the true next word"],
      [String.raw`\log`, "the logarithm; with the minus in front, a confident right guess costs near 0"],
      [String.raw`L`, "the average penalty, which training pushes down"],
    ],
    metaphor: "A quiz where only some questions count, and each counted question costs more the less confident you were in the right answer.",
    example: String.raw`Three graded words. The model gives the true word $0.9$, $0.9$ and $0.2$. Penalties: $-\log 0.9 \approx 0.11$ twice, $-\log 0.2 \approx 1.61$. Average $L \approx 0.61$. The one unsure word, the object name only the picture can tell, dominates the grade.`,
  },
  {
    title: "Where an object lands in the picture",
    formula: String.raw`u = \frac{f\,x}{d}`,
    symbols: [
      [String.raw`x`, "how far right of the camera's centre line the object is, in metres"],
      [String.raw`d`, "how far ahead of the camera it is, in metres"],
      [String.raw`f`, "the camera's zoom: bigger means a narrower view"],
      [String.raw`u`, "the place in the picture, from −1 (left edge) to 1 (right edge)"],
    ],
    metaphor: "Hold up a thumb: a nearby object off to the side swings far across your view, the same offset far away barely moves.",
    example: String.raw`A camera with $f = 2.4$. A cube $0.10$ m to the right and $1.0$ m ahead: $u = 2.4 \times 0.10 / 1.0 = 0.24$, a little right of centre, about column $139$ of $224$. Sorting objects by $u$ gives the left-to-right order the caption states.`,
  },
];
