/**
 * The maths behind the lesson, for the "maths" panel. Not imported by
 * lesson.ts; the lesson page finds this file on its own.
 */
export const math = [
  {
    title: "Turning a pixel into a model input",
    formula: String.raw`\hat{x} = \frac{x / 255 - 0.5}{0.5}`,
    symbols: [
      [String.raw`x`, "the pixel's brightness as stored, from 0 (black) to 255 (white)"],
      [String.raw`x / 255`, "the same brightness on a 0 to 1 scale"],
      [String.raw`- 0.5,\ \div 0.5`, "shift and stretch so mid-grey sits at 0"],
      [String.raw`\hat{x}`, "what the model receives: from −1 (black) to 1 (white)"],
    ],
    metaphor: "Like converting a temperature before reading it off a thermometer the model knows: skip one step of the conversion and every reading lands far off the scale.",
    example: String.raw`Mid-grey, $x = 128$: $\frac{128/255 - 0.5}{0.5} \approx 0.004$, right in the middle. Skip the division and you get $\frac{128 - 0.5}{0.5} = 255$. White, $x = 255$, becomes $1$ on one path and $509$ on the other.`,
  },
];
