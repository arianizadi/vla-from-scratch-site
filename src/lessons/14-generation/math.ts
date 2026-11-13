/**
 * The maths behind the generation lesson, explained with a picture and a
 * small worked example. Rendered by the lesson page when present.
 */
export const math = [
  {
    title: "Chances with a boldness dial",
    formula: "p_i = \\frac{e^{z_i / T}}{\\sum_j e^{z_j / T}}",
    symbols: [
      ["z_i", "the model's raw score for word i (a logit): higher means more likely"],
      ["T", "the temperature: below 1 sharpens the chances, above 1 flattens them"],
      ["e^{z_i / T}", "e (about 2.718) to the power of the scaled score: always positive"],
      ["\\sum_j", "add up over every word j in the list"],
      ["p_i", "the chance of picking word i; all chances add up to 1"],
    ],
    metaphor: "A spotlight with a focus ring: turn it one way and all the light falls on the favourite, turn it the other and it spreads over the whole stage.",
    example:
      "Four words with scores $2, 1, 0, -1$. At $T = 1$ the chances are $0.64, 0.24, 0.09, 0.03$. At $T = 0.5$ the scores double to $4, 2, 0, -2$ and the chances become $0.87, 0.12, 0.02, 0.00$. At $T = 2$ they halve to $1, 0.5, 0, -0.5$ and the chances flatten to $0.46, 0.28, 0.17, 0.10$. The favourite stays the favourite every time.",
  },
  {
    title: "Cutting the tail (top-p)",
    formula: "\\text{keep the fewest top words with } \\sum p_i > p, \\text{ then divide each kept } p_i \\text{ by their total}",
    symbols: [
      ["p", "how much of the chance to keep, such as 0.9"],
      ["p_i", "the chance of word i, sorted from most to least likely"],
    ],
    metaphor: "Picking a restaurant: shortlist the favourites until they cover most of the group's votes, ignore the rest, then draw from the shortlist.",
    example:
      "With chances $0.644, 0.237, 0.087, 0.032$ and $p = 0.9$: the first two add up to $0.881$, not yet above $0.9$, so the third joins ($0.968$). The last word is dropped. Dividing the kept three by $0.968$ gives $0.665, 0.245, 0.090$, and $0$ for the last.",
  },
  {
    title: "What the cache saves",
    formula: "\\underbrace{nP + \\tfrac{n(n-1)}{2}}_{\\text{re-read each time}} \\quad\\text{vs.}\\quad \\underbrace{P + n - 1}_{\\text{keep old notes}}",
    symbols: [
      ["P", "the number of tokens in the prompt"],
      ["n", "the number of new tokens to write"],
      ["nP", "re-reading the whole prompt on every pass"],
      ["\\tfrac{n(n-1)}{2}", "re-reading the words already written, which grows with the square of n"],
    ],
    metaphor: "Copying a letter by hand: without notes you would rewrite the whole letter every time you add a word.",
    example:
      "A toy prompt of $P = 3$ and $n = 5$ new tokens: $15 + 10 = 25$ token passes without the cache, $3 + 4 = 7$ with it. A real caption of $P = 270$ and $n = 28$: $7{,}560 + 378 = 7{,}938$ against $297$.",
  },
];
