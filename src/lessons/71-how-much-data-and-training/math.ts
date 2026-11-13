export const math = [
  {
    title: "Practice counted in passes",
    formula: "\\text{epochs} = \\frac{N}{W}",
    symbols: [
      ["N", "training examples drawn: how many practice cards training goes through"],
      ["W", "how many different practice cards the demonstrations make, about 66 each"],
      ["\\text{epochs}", "how many times, on average, each card is seen"],
    ],
    metaphor: "Laps around a running track: the distance you run divided by the length of one lap.",
    example: "$4000$ demonstrations make about $263{,}000$ cards.\nDrawing $N = 5{,}000{,}000$ examples gives $5{,}000{,}000 / 263{,}000 \\approx 19$ passes.\nWith $1500$ demonstrations, about $99{,}000$ cards, the same practice is about $50$ passes over fewer scenes.",
  },
];
