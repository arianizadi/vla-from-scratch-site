/**
 * The maths behind this lesson, explained with a picture and small numbers.
 * Not imported by lesson.ts: the lesson page finds and renders it by itself.
 */
export const math = [
  {
    title: "Guessing among three",
    formula: "P(\\text{right by luck}) = \\frac{1}{k}",
    symbols: [
      ["k", "how many objects stand on the table"],
      ["P(\\text{right by luck})", "the chance of going for the named one without looking"],
    ],
    metaphor:
      "Picking a cup at random from three on a shelf: you get the right one about a third of the time without reading any label.",
    example:
      "With $k = 3$ objects, guessing goes for the named one $1/3 \\approx 33$ times in $100$. The first two versions scored $33$ and $29$: no sign of looking. A version that really looks scores near $100$.",
  },
  {
    title: "How sure is a score out of 100?",
    formula: "p \\pm 1.96 \\sqrt{\\frac{p\\,(1 - p)}{n}}",
    symbols: [
      ["p", "the measured success rate, as a fraction"],
      ["n", "the number of tries in the test"],
      ["1.96", "the width that catches the true rate 95 times in 100"],
      ["\\pm", "plus or minus: the band runs from the lower to the upper value"],
    ],
    metaphor:
      "A fishing net cast around the score: the true rate is very probably somewhere inside it. Two nets that overlap a lot cannot tell their fish apart.",
    example:
      "The pretrained robot: $p = 0.87$, $n = 100$, so $0.87 \\pm 1.96 \\times 0.034 \\approx 0.87 \\pm 0.07$: from about $80$ to $94$. The blank one: $0.85 \\pm 0.07$, from about $78$ to $92$. The bands overlap almost entirely. (The lab uses a slightly better formula, the Wilson interval, which gives nearly the same bands: $79$ to $92$ and $77$ to $91$.)",
  },
];
