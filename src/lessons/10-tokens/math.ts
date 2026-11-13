/**
 * The maths behind the tokens lesson, explained with a picture and a small
 * worked example. Rendered by the lesson page when present.
 */
export const math = [
  {
    title: "Looking up a row",
    formula: "\\mathbf{e}_t = E[\\,x_t\\,]",
    symbols: [
      ["x_t", "the id of the token at place t, a whole number"],
      ["E", "the embedding table: one row of numbers per token in the list"],
      ["E[\\,x_t\\,]", "row number x_t of that table"],
      ["\\mathbf{e}_t", "the list of numbers the model works with for that token"],
    ],
    metaphor: "A locker room: the id is the locker number, and the row is what is inside the locker.",
    example:
      "With a toy table of three rows, $E = \\begin{bmatrix} 0.1 & 0.4 \\\\ 0.9 & 0.2 \\\\ 0.3 & 0.7 \\end{bmatrix}$, counting rows from 0, the id $x_t = 2$ gives $\\mathbf{e}_t = (0.3,\\ 0.7)$. Nothing is computed: the model copies the row out.",
  },
  {
    title: "The same lookup as a multiplication",
    formula: "\\mathbf{e}_t = \\mathbf{h}(x_t)^{\\top} E",
    symbols: [
      ["\\mathbf{h}(x_t)", "a list of 0s with a single 1 at place x_t (a “one-hot” list)"],
      ["^{\\top}", "lay the list on its side, as a row"],
      ["E", "the embedding table"],
    ],
    metaphor: "A row of light switches with one switch on: only that row of the table gets through.",
    example:
      "For id 2 out of three tokens, $\\mathbf{h} = (0, 0, 1)$. Multiplying by the table above adds $0 \\times$ row 0, $0 \\times$ row 1 and $1 \\times$ row 2, which is $(0.3,\\ 0.7)$ again. This is why the table can be learned like every other number in the model.",
  },
];
