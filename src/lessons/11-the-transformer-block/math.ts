/**
 * The maths behind the transformer-block lesson, explained with a picture and
 * a small worked example. Rendered by the lesson page when present.
 */
export const math = [
  {
    title: "Turning match scores into shares",
    formula: "w_j = \\frac{e^{s_j}}{\\sum_k e^{s_k}}",
    symbols: [
      ["s_j", "the match score between the asking word and word j"],
      ["e^{s_j}", "e (about 2.718) raised to that score: always positive, and big scores grow fast"],
      ["\\sum_k", "add up over every word k the asker may look at"],
      ["w_j", "word j's share of the asker's attention; all shares add up to 1"],
    ],
    metaphor: "Splitting a pizza by enthusiasm: everyone gets a slice, but the keenest person gets far more than a fair split.",
    example:
      "When “cube” asks, the scores for pick, up, the, red and cube are $0.5, 0.1, 0.2, 2.0, 1.0$. Taking $e$ to the power of each score gives $1.65, 1.11, 1.22, 7.39, 2.72$, which add up to $14.08$. Dividing each by the total gives shares $0.12, 0.08, 0.09, 0.52, 0.19$: about half goes to “red”. This step is called a softmax.",
  },
  {
    title: "Attention in one line",
    formula: "\\mathrm{Attention}(Q, K, V) = \\mathrm{softmax}\\!\\left(\\frac{Q K^{\\top}}{\\sqrt{d}}\\right) V",
    symbols: [
      ["Q", "the questions: one list of numbers per word, saying what it looks for"],
      ["K", "the labels: one list per word, saying what it can be found by"],
      ["V", "the contents: one list per word, saying what it hands over if chosen"],
      ["Q K^{\\top}", "every question matched against every label (a dot product: multiply place by place, then add)"],
      ["\\sqrt{d}", "the square root of the list length d, which keeps scores from growing too large"],
      ["\\mathrm{softmax}", "turn each word's scores into shares that add up to 1, as above"],
    ],
    metaphor: "A library: you bring a question, compare it with every book's label, and walk out with a blend of the books that matched best.",
    example:
      "With lists of length $d = 4$, a question $(1, 0, 1, 0)$ and a label $(1, 1, 1, 0)$ match with $1 + 0 + 1 + 0 = 2$; divided by $\\sqrt{4} = 2$ the score is $1$. If two words get shares $0.75$ and $0.25$ and hand over contents $(4, 0)$ and $(0, 8)$, the asker takes in $0.75 \\cdot (4, 0) + 0.25 \\cdot (0, 8) = (3, 2)$.",
  },
  {
    title: "Adding, never replacing",
    formula: "\\mathbf{x} \\leftarrow \\mathbf{x} + \\mathrm{Attention}(\\mathbf{x}), \\qquad \\mathbf{x} \\leftarrow \\mathbf{x} + \\mathrm{FFN}(\\mathbf{x})",
    symbols: [
      ["\\mathbf{x}", "a word's running notes: its list of numbers in the stream"],
      ["\\leftarrow", "becomes"],
      ["\\mathrm{FFN}", "the feed-forward network: a small calculator applied to each word alone"],
    ],
    metaphor: "A notebook passed down a line: each person writes in the margin, nobody uses an eraser.",
    example:
      "If a word's notes are $(0.3, 0.6)$ and attention works out the update $(0.3, 0.0)$, the notes become $(0.6, 0.6)$. The feed-forward update $(0.2, 0.3)$ then makes them $(0.8, 0.9)$. The first numbers are still in there.",
  },
];
