/** The maths behind the lesson, each with a picture and a worked example. */
export const math = [
  {
    title: "From an angle to millimetres",
    formula: String.raw`d = r\,\theta`,
    symbols: [
      [String.raw`d`, "how far the gripper moves, along an arc"],
      [String.raw`r`, "the lever arm: distance from the joint to the gripper"],
      [String.raw`\theta`, "how much the joint turns, in radians (one full turn is about 6.28)"],
    ],
    metaphor: "A door: the same small turn at the hinge moves the handle more than a point near the hinge.",
    example: String.raw`With the gripper $r = 0.5$ m from the base joint and an error of $\theta = 0.01$ rad (about half a degree), the gripper is off by $d = 0.5 \times 0.01 = 0.005$ m, or 5 mm.`,
  },
  {
    title: "Why changes pile up",
    formula: String.raw`\text{spread after } n \text{ steps} = \sigma\sqrt{n}`,
    symbols: [
      [String.raw`\sigma`, "how big one command's random error usually is"],
      [String.raw`n`, "how many changes have been added together"],
    ],
    metaphor: "Counting steps in the dark: each miscount is small, but they add up, while naming the destination resets the error every time.",
    example: String.raw`With an error of $\sigma = 0.01$ rad per command, absolute targets stay about $0.01$ rad off. Adding up $n = 40$ changes gives about $0.01 \times \sqrt{40} \approx 0.063$ rad: more than six times worse.`,
  },
  {
    title: "Putting every number on one scale",
    formula: String.raw`z = \frac{x - \mu}{\sigma}`,
    symbols: [
      [String.raw`x`, "one number of the action, as the robot uses it"],
      [String.raw`\mu`, "that number's average over all demonstrations"],
      [String.raw`\sigma`, "how much that number usually varies"],
      [String.raw`z`, "the same number on the common scale the policy works in"],
    ],
    metaphor: "Grading on a curve: a score becomes “how far above or below the usual, in usual-sized steps”.",
    example: String.raw`A joint that averages $\mu = -1.57$ and varies by $\sigma = 0.05$: the value $x = -1.52$ becomes $z = (-1.52 + 1.57) / 0.05 = 1$, one usual step above its average. The policy's answer is turned back with $x = \mu + \sigma z$.`,
  },
];
