/**
 * The maths behind the positions lesson, explained with a picture and a small
 * worked example. Rendered by the lesson page when present.
 */
export const math = [
  {
    title: "Turning an arrow by its place",
    formula:
      "R(m)\\,\\mathbf{q} = \\begin{bmatrix} \\cos m & -\\sin m \\\\ \\sin m & \\cos m \\end{bmatrix} \\begin{bmatrix} q_1 \\\\ q_2 \\end{bmatrix}",
    symbols: [
      ["\\mathbf{q} = (q_1, q_2)", "a word's arrow: two numbers, read as a point on a page"],
      ["m", "the word's place in the line, counting from 0; also the angle it is turned by"],
      ["\\cos m,\\ \\sin m", "how far across and how far up a unit arrow points after turning by angle m"],
      ["R(m)", "the turning machine: it spins any arrow by angle m without changing its length"],
    ],
    metaphor: "A clock hand that moves on one notch for every place further along the sentence.",
    example:
      "Take the arrow $(1, 0)$, pointing right. At place $m = 0$ it stays $(1, 0)$. At place $m = 3$ (angles measured in radians, about 57° each) it becomes $(\\cos 3, \\sin 3) = (-0.99,\\ 0.14)$: almost pointing left.",
  },
  {
    title: "Only the gap counts",
    formula: "\\big(R(m)\\,\\mathbf{q}\\big) \\cdot \\big(R(n)\\,\\mathbf{k}\\big) = \\mathbf{q} \\cdot R(n - m)\\,\\mathbf{k}",
    symbols: [
      ["\\mathbf{k}", "the arrow of the word being looked at"],
      ["m,\\ n", "the places of the asking word and the word looked at"],
      ["\\cdot", "the match: multiply the two arrows number by number and add"],
      ["n - m", "the gap between the two words"],
    ],
    metaphor: "Two dancers spinning at the same speed: the angle between them depends on how far apart they started, not on when you look.",
    example:
      "With both arrows $(1, 0)$, the match is $\\cos(n - m)$. Places 3 and 5 give $\\cos 2 = -0.42$; places 13 and 15 give the same $-0.42$, because the gap is still 2. Places 3 and 4 give $\\cos 1 = 0.54$.",
  },
];
