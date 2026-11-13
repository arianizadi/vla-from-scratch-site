/**
 * The maths behind this lesson, explained with a picture and small numbers.
 * Not imported by lesson.ts: the lesson page finds and renders it by itself.
 */
export const math = [
  {
    title: "Aiming at the middle",
    formula: "\\bar{x} = \\frac{x_1 + x_2 + x_3}{3} \\quad\\Rightarrow\\quad \\text{slope} = \\frac{\\Delta \\bar{x}}{\\Delta x_1} = \\frac{1}{3}",
    symbols: [
      ["x_1", "where the named object stands (left to right)"],
      ["x_2", "where the second object stands"],
      ["x_3", "where the third object stands"],
      ["\\bar{x}", "the middle of the three: where a robot aiming between them closes"],
      ["\\Delta", "“the change in”: how far something moves"],
    ],
    metaphor:
      "Three friends stand in a line and you aim at the middle of the group. If one friend steps aside, the middle of the group moves only a third as far.",
    example:
      "The named can moves $30$ cm to the right; the other objects stay.\nThe middle moves $(30 + 0 + 0)/3 = 10$ cm, so the slope is $10/30 = 1/3$.\nA robot that follows the can moves $30$ cm (slope $1$); one that ignores the scene moves $0$ cm (slope $0$). The first robots measured about $0$.",
  },
];
