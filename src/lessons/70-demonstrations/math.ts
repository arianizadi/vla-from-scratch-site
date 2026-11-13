/** The maths behind the lesson, explained with a picture and small numbers. Rendered by the lesson page. */
export const math = [
  {
    title: "How many practice cards a dataset makes",
    formula: "W = \\sum_{i=1}^{E} F_i \\approx E \\times \\bar{F}",
    symbols: [
      ["W", "windows: the practice cards training draws from"],
      ["E", "how many demonstrations were recorded"],
      ["F_i", "how many moments demonstration $i$ lasted"],
      ["\\bar{F}", "the average number of moments per demonstration"],
    ],
    metaphor: "Every frame of a flip-book becomes its own card, so a thicker flip-book gives more cards, not just one.",
    example: "$4000$ demonstrations averaging about $65.8$ moments each: $W \\approx 4000 \\times 65.8 \\approx 263{,}000$ cards. At $20$ moments a second, one run of $66$ moments lasts about $3.3$ seconds.",
  },
];
