/**
 * The maths behind the lesson, explained with a picture and small numbers.
 * Rendered by the lesson page when present (not imported from lesson.ts).
 */
export const math = [
  {
    title: "The projector: from picture size to word size",
    formula: String.raw`h_i = W z_i`,
    symbols: [
      [String.raw`z_i`, "the encoder's token for patch i (here 256 numbers)"],
      [String.raw`W`, "the projector: a learned table of weights"],
      [String.raw`h_i`, "the same patch, now as long as a word token (here 512 numbers)"],
    ],
    metaphor: "A travel adapter: the plug is the same patch, the adapter reshapes it to fit the language model's socket.",
    example: String.raw`A toy patch token of 2 numbers, $z = (1, 2)$, and a toy projector with 3 rows $(1, 0)$, $(0, 1)$, $(1, 1)$. Each row multiplies and adds: $h = (1,\ 2,\ 1 + 2) = (1, 2, 3)$. Two numbers in, three out, the size a toy word token has.`,
  },
  {
    title: "How long the row is",
    formula: String.raw`T = 3 + n\,N + w + 2`,
    symbols: [
      [String.raw`T`, "the length of the row the language model reads"],
      [String.raw`3`, "the start tokens of the prompt"],
      [String.raw`n`, "how many pictures"],
      [String.raw`N`, "seats per picture, one per patch"],
      [String.raw`w`, "how many word tokens the text has"],
      [String.raw`2`, "the closing tokens"],
    ],
    metaphor: "Booking a table: a few seats for the hosts, a block for each family of patches, then the words.",
    example: String.raw`One picture of $256$ patches and a $24$-token caption: $3 + 256 + 24 + 2 = 285$. Four pictures and the $5$-token “pick up the red cube”: $3 + 4 \times 256 + 5 + 2 = 1{,}034$. The pictures fill almost all of it.`,
  },
  {
    title: "Gluing neighbours together",
    formula: String.raw`N' = \frac{N}{r^{2}}, \qquad d' = d\,r^{2}`,
    symbols: [
      [String.raw`r`, "how many patches per side are glued into one, here 2"],
      [String.raw`N, N'`, "tokens per picture before and after"],
      [String.raw`d, d'`, "numbers per token before and after"],
    ],
    metaphor: "Packing four small parcels into one bigger box: fewer boxes to carry, same contents, but you no longer know which corner each parcel sat in.",
    example: String.raw`$256$ patch tokens of $256$ numbers, glued with $r = 2$: $256 / 4 = 64$ tokens of $256 \times 4 = 1{,}024$ numbers. Same information, a quarter of the seats.`,
  },
];
