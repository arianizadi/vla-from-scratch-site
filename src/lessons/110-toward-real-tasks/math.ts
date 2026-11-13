/**
 * The maths behind this lesson, explained with a picture and small numbers.
 * Not imported by lesson.ts: the lesson page finds and renders it by itself.
 */
export const math = [
  {
    title: "How far the target moves between looks",
    formula: "d = v \\, \\Delta t",
    symbols: [
      ["d", "how far the target moves between two looks"],
      ["v", "the target's speed"],
      ["\\Delta t", "the time between two looks"],
    ],
    metaphor:
      "Catching a ball while blinking: what matters is how far the ball travels while your eyes are shut, not how fast it is in general.",
    example:
      "The robot plans 8 actions at 20 actions per second, so it looks again every $\\Delta t = 8 / 20 = 0.4$ s. A stem sliding at an example speed of $v = 2$ cm/s moves $d = 2 \\times 0.4 = 0.8$ cm between looks, small next to a jaw. At $v = 8$ cm/s it moves $3.2$ cm: a miss unless the robot looks more often.",
  },
  {
    title: "Turning the short way round",
    formula: "\\text{turn} = \\min(\\theta,\\; 360^\\circ - \\theta)",
    symbols: [
      ["\\theta", "how far the shoot is from facing the arm, measured one way round"],
      ["360^\\circ - \\theta", "the same distance measured the other way round"],
      ["\\min", "take the smaller of the two"],
    ],
    metaphor:
      "Like a clock hand at 11 that has to reach 1: going forward two hours beats going backward ten.",
    example:
      "A shoot sits $\\theta = 250^\\circ$ away going clockwise. The other way it is $360 - 250 = 110^\\circ$, so the robot should hold the counter-clockwise button and turn $110^\\circ$. The trained robot picked the short way first in most tries, and still finished when it went the long way.",
  },
];
