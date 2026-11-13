/**
 * The maths behind the lesson, explained with a picture and small numbers.
 * Rendered by the lesson page when present (not imported from lesson.ts).
 */
export const math = [
  {
    title: "Pooling is an average",
    formula: String.raw`\bar{z} = \frac{1}{N}\sum_{i=1}^{N} z_i`,
    symbols: [
      [String.raw`z_i`, "the token of patch i"],
      [String.raw`N`, "how many patches the picture has"],
      [String.raw`\sum`, "add up over every patch"],
      [String.raw`\bar{z}`, "the one summary vector that is handed on"],
    ],
    metaphor: "Blend a fruit salad into a smoothie: you can still taste the strawberry, but not where it sat in the bowl.",
    example: String.raw`Four patches, one number each, 1 where the cube is. Cube top left: $(1, 0, 0, 0)$, average $0.25$. Cube bottom right: $(0, 0, 0, 1)$, average $0.25$. Two different scenes, the same summary.`,
  },
  {
    title: "Comparisons grow with the square",
    formula: String.raw`C = N^{2}`,
    symbols: [
      [String.raw`N`, "the number of tokens the model reads"],
      [String.raw`C`, "the number of token-to-token comparisons in one layer"],
    ],
    metaphor: "Guests at a party who all greet each other: double the guests, four times the greetings.",
    example: String.raw`$4$ tokens make $16$ comparisons, $8$ make $64$. A summary-based robot reading about $24$ tokens makes $576$; one reading about $800$ patch tokens makes about $640{,}000$.`,
  },
];
