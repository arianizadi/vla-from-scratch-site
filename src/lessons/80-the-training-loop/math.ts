/**
 * The maths behind the lesson, each piece with a picture and a worked example.
 * Rendered by the lesson page when present; not imported by lesson.ts.
 */

export const math = [
  {
    title: "A stride that shrinks on a plan",
    formula: String.raw`\eta(t) = \eta_{\min} + \tfrac{1}{2}\,(\eta_{\max} - \eta_{\min})\left(1 + \cos\frac{\pi t}{T}\right)`,
    symbols: [
      [String.raw`\eta(t)`, "the stride at training step t"],
      [String.raw`\eta_{\max}`, "the largest stride, reached right after the warm-up"],
      [String.raw`\eta_{\min}`, "the smallest stride, reached at the very end"],
      [String.raw`t`, "how many steps have been taken since the warm-up"],
      [String.raw`T`, "how many steps the whole run is planned to take"],
    ],
    metaphor: "A car slowing to park: full speed on the road, a smooth slowdown, and a crawl at the spot. A shorter road means braking sooner.",
    example: String.raw`With $\eta_{\max} = 0.0005$ and $\eta_{\min} = 0.00001$: at the start $\cos 0 = 1$, so $\eta = 0.0005$. Halfway, $\cos\frac{\pi}{2} = 0$, so $\eta = 0.00001 + \tfrac12 \times 0.00049 \approx 0.00026$. At the end $\cos\pi = -1$, so $\eta = 0.00001$. Halve $T$ and every one of these moments comes twice as early.`,
  },
  {
    title: "The averaged copy",
    formula: String.raw`\bar w \leftarrow d\,\bar w + (1 - d)\,w`,
    symbols: [
      [String.raw`\bar w`, "the averaged copy of one weight"],
      [String.raw`w`, "the trained weight right after this step"],
      [String.raw`d`, "how much of the old average to keep, a number just below 1"],
    ],
    metaphor: "A slow follower on a leash: each step it closes a small part of the gap to the walker, so the walker's zigzags barely reach it.",
    example: String.raw`With $d = 0.9$, $\bar w = 1.0$ and a new trained value $w = 2.0$: $0.9 \times 1.0 + 0.1 \times 2.0 = 1.1$. One jolt of $+1$ moves the average by only $0.1$. The average remembers roughly the last $1/(1-d) = 10$ steps; with $d = 0.9999$, about $10{,}000$.`,
  },
];
