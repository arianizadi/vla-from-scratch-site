/**
 * The maths behind the lesson, for the "maths" panel. Not imported by
 * lesson.ts; the lesson page finds this file on its own.
 */
export const math = [
  {
    title: "The slope, measured",
    formula: String.raw`b = \frac{\sum_i (x_i - \bar{x})(y_i - \bar{y})}{\sum_i (x_i - \bar{x})^2}`,
    symbols: [
      [String.raw`x_i`, "where the object was in try i"],
      [String.raw`y_i`, "where the gripper closed in try i"],
      [String.raw`\bar{x}`, "the object's average position"],
      [String.raw`\bar{y}`, "the gripper's average closing position"],
      [String.raw`\sum_i`, "add up over all tries"],
      [String.raw`b`, "the slope: how far the grasp moves per step the object moves"],
    ],
    metaphor: "Nudge the object 10 cm to the right. If the grasp also moves about 10 cm, the slope is near 1; if the grasp stays put, it is near 0.",
    example: String.raw`Invented numbers: the object sits at $0.40$, $0.50$, $0.60$ m. A gripper closing at $0.41$, $0.49$, $0.60$ m gives $b = \frac{0.019}{0.020} \approx 0.95$: it follows. One closing at $0.52$, $0.47$, $0.51$ m gives $b = \frac{-0.001}{0.020} = -0.05$: it ignores the scene.`,
  },
];
