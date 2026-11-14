import { defineMath } from "../define";

export default defineMath([
  {
    title: "The same moment in two plans",
    formula: String.raw`\eta(s) = \eta_{\max} \cdot \tfrac{1}{2}\left(1 + \cos\frac{\pi s}{S}\right)`,
    symbols: [
      [String.raw`\eta(s)`, "the size of a training step after s examples", "accent"],
      [String.raw`\eta_{\max}`, "the biggest step, at the start", "ink"],
      [String.raw`s`, "how many examples training has seen so far", "action"],
      [String.raw`S`, "how many examples the whole run is planned for", "vision"],
    ],
    metaphor: "A runner paces a race. Told it is twice as long, they hold a strong pace much further in. The training plan works the same way: only the fraction $s/S$ counts.",
    example: String.raw`Training has seen $s = 3.6$ million examples.
Planned for $S = 10$ million: $s/S = 0.36$ and $\cos(0.36\pi) \approx 0.43$, so the step is $\tfrac12(1 + 0.43) \approx 71\%$ of the biggest.
Planned for $S = 5$ million: $s/S = 0.72$ and $\cos(0.72\pi) \approx -0.64$, so the step is $\tfrac12(1 - 0.64) \approx 18\%$.
Same examples seen, yet the longer plan still takes steps about four times bigger.`,
  },
]);
