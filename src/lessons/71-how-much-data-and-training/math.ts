/** The maths behind the lesson, explained with a picture and small numbers. Rendered by the lesson page. */
export const math = [
  {
    title: "Practice counted in passes",
    formula: "\\text{epochs} = \\frac{N}{W}",
    symbols: [
      ["N", "training examples drawn: how many practice cards training goes through"],
      ["W", "windows: how many different practice cards the demonstrations make"],
      ["\\text{epochs}", "how many times, on average, each card is seen"],
    ],
    metaphor: "Laps around a running track: the distance you run divided by the length of one lap.",
    example: "$5{,}000{,}000$ examples over $263{,}289$ cards from $4000$ demonstrations: $5{,}000{,}000 / 263{,}289 \\approx 19$ passes. The same $5$ million over $1500$ demonstrations' $98{,}841$ cards would be about $51$ passes over fewer scenes.",
  },
  {
    title: "Weight updates per run",
    formula: "U = \\frac{N}{B}",
    symbols: [
      ["U", "how many times the weights are updated"],
      ["N", "training examples drawn"],
      ["B", "the batch: how many examples are averaged into one update"],
    ],
    metaphor: "A teacher who marks homework in stacks of 64 and gives one round of feedback per stack.",
    example: "$N = 5{,}000{,}000$, $B = 64$: $U = 78{,}125$ updates.",
  },
  {
    title: "Why a short run slows down sooner",
    formula: "\\eta(t) = \\eta_{\\min} + \\tfrac{1}{2}\\left(\\eta_{\\max} - \\eta_{\\min}\\right)\\left(1 + \\cos\\frac{\\pi t}{T}\\right)",
    symbols: [
      ["\\eta(t)", "the learning rate: how big a step each update takes, at update $t$"],
      ["\\eta_{\\max}", "the biggest step, used near the start"],
      ["\\eta_{\\min}", "the smallest step, reached at the very end"],
      ["t", "the update reached so far (after a short warm-up)"],
      ["T", "the run's last update: it depends on the run's length"],
    ],
    metaphor: "A driver who plans to slow down smoothly to arrive exactly at the destination: set a nearer destination and the braking starts earlier.",
    example: "Ignoring the tiny $\\eta_{\\min}$: at $t/T = 0.8$ the step is $\\tfrac{1}{2}(1 + \\cos 0.8\\pi) \\approx 0.10$ of the largest. So after $0.8$ million examples a $1$-million run takes steps about $13\\%$ of its largest, while a $3$-million run is still at about $86\\%$.",
  },
];
