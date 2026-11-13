/**
 * The maths behind the lesson, explained with a picture and small numbers.
 * Rendered by the lesson page when present (not imported from lesson.ts).
 */
export const math = [
  {
    title: "How many tokens a picture makes",
    formula: String.raw`N = \left(\frac{s}{p}\right)^{2}`,
    symbols: [
      [String.raw`N`, "the number of patches, so the number of tokens"],
      [String.raw`s`, "the side of the square picture, in pixels"],
      [String.raw`p`, "the side of one square patch, in pixels"],
    ],
    metaphor: "Tiling a square floor: how many tiles fit along one wall, times how many fit along the other.",
    example: String.raw`A $224$-pixel picture with $16$-pixel patches: $224 / 16 = 14$ patches per side, so $N = 14^2 = 196$ tokens. Halve the patch to $p = 8$: $28^2 = 784$ tokens, four times as many.`,
  },
  {
    title: "One recipe for every patch, plus a place tag",
    formula: String.raw`z_i = W x_i + e_i`,
    symbols: [
      [String.raw`x_i`, "the colour numbers of patch i, laid out in one line"],
      [String.raw`W`, "the learned recipe, the same for every patch"],
      [String.raw`e_i`, "the learned place tag for the spot where patch i sat"],
      [String.raw`z_i`, "the token for patch i that the model reads"],
    ],
    metaphor: "Every tile is pressed through the same stamp, then gets a sticker with its seat number.",
    example: String.raw`A toy patch of two grey pixels, $x = (0.2,\ 0.8)$. A toy recipe that adds and subtracts them gives $W x = (1.0,\ -0.6)$. Adding the place tag $e = (0.1,\ 0)$ gives the token $z = (1.1,\ -0.6)$. The same patch in another spot gets another tag, so another token.`,
  },
];
