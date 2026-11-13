/** The maths behind the lesson, explained with a picture and small numbers. Rendered by the lesson page. */
export const math = [
  {
    title: "How much of the data teaches looking",
    formula: "s = \\frac{k}{F}",
    symbols: [
      ["s", "the share of practice cards that need the picture"],
      ["k", "moments per demonstration that cannot be guessed without looking"],
      ["F", "all moments in a demonstration"],
    ],
    metaphor: "A quiz where most answers are printed on the back of the question: only the few without one make you think.",
    example: "Plain demonstrations: about $k = 8$ of $F = 66$ moments, so $s = 8/66 \\approx 12\\%$. With random starts nearly every moment needs the picture, so $s$ approaches $100\\%$.",
  },
  {
    title: "Adding extra copies of the hard cards",
    formula: "s' = \\frac{k\\,(1 + r)}{F + k\\,r}",
    symbols: [
      ["s'", "the new share of cards that need the picture"],
      ["r", "how many extra copies of each early card are added"],
      ["k", "early moments per demonstration"],
      ["F", "all moments per demonstration"],
    ],
    metaphor: "Shuffling extra copies of the hard flashcards into the deck: you meet them more often, and the easy ones less often.",
    example: "$k = 8$, $F = 66$, $r = 5$: $s' = 48 / 106 \\approx 45\\%$, up from $12\\%$. The catch: within the same practice time every other card is seen less, which hurt when those other cards were the valuable recoveries.",
  },
];
