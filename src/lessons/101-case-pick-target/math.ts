/**
 * The maths behind this lesson, explained with a picture and small numbers.
 * Not imported by lesson.ts: the lesson page finds and renders it by itself.
 */
export const math = [
  {
    title: "Why aiming at the middle gives a slope of one third",
    formula: "\\bar{x} = \\frac{x_1 + x_2 + x_3}{3} \\quad\\Rightarrow\\quad \\text{slope} = \\frac{\\Delta \\bar{x}}{\\Delta x_1} = \\frac{1}{3}",
    symbols: [
      ["x_1", "where the named object stands (left to right)"],
      ["x_2,\\ x_3", "where the other two objects stand"],
      ["\\bar{x}", "the middle (average) of the three: where a robot that aims between them would close its hand"],
      ["\\Delta", "“the change in”: how far something moves"],
    ],
    metaphor:
      "Three friends stand in a line and you aim at the middle of the group. If one friend steps aside, the middle of the group moves only a third as far.",
    example:
      "The named can moves $30$ cm to the right; the other objects stay. The middle moves $(30 + 0 + 0)/3 = 10$ cm, so the slope is $10/30 = 1/3$. A robot that follows the can moves $30$ cm (slope $1$); one that ignores the scene moves $0$ cm (slope $0$). The first robots measured about $0$.",
  },
  {
    title: "Why a short training run never clicks",
    formula: "\\eta(t) = \\eta_{\\min} + \\tfrac{1}{2}\\,(\\eta_{\\max} - \\eta_{\\min})\\left(1 + \\cos\\frac{\\pi t}{T}\\right)",
    symbols: [
      ["\\eta(t)", "the learning rate: how big a correction each training step makes, right now"],
      ["\\eta_{\\max},\\ \\eta_{\\min}", "the largest and smallest learning rate"],
      ["t", "how much training has happened so far"],
      ["T", "the planned length of the whole run"],
    ],
    metaphor:
      "A driver who slows down as the destination approaches. On a short trip the brakes come on early, so the car never gets up to speed on the open stretch.",
    example:
      "Halfway through ($t = T/2$), $\\cos(\\pi/2) = 0$, so the rate is the midpoint of the two. With $\\eta_{\\max} = 5$ and $\\eta_{\\min} = 0.1$ (in units of $10^{-4}$), a run planned for $1$ million examples is at $0.1$ after $1$ million, its floor. A run planned for $5$ million is still near $4.5$ there ($\\cos(0.2\\pi) \\approx 0.81$), so it is still taking big steps when the click comes.",
  },
];
