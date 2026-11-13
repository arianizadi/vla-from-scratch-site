/** The maths behind the lesson, each with a picture and a worked example. */
export const math = [
  {
    title: "How often the policy looks",
    formula: String.raw`\text{looks per second} = \frac{f}{h}`,
    symbols: [
      [String.raw`f`, "how many actions the robot plays per second (its tick rate)"],
      [String.raw`h`, "how many actions of each chunk are played before looking again"],
    ],
    metaphor: "A reader who glances up from a map every few lines instead of after every word.",
    example: String.raw`At $f = 20$ actions a second, playing $h = 8$ per chunk means $20 / 8 = 2.5$ looks a second, one every $0.4$ s. Deciding every tick ($h = 1$) would mean 20 looks a second.`,
  },
  {
    title: "How many examples one demonstration gives",
    formula: String.raw`\text{examples} = \sum_{\text{demos}} T_i`,
    symbols: [
      [String.raw`T_i`, "the number of frames in demonstration i"],
      [String.raw`\sum`, "add up over all demonstrations"],
    ],
    metaphor: "Cutting a film into clips that start at every frame: a film of 66 frames gives 66 clips.",
    example: String.raw`1500 demonstrations of about 66 frames each give about $1500 \times 66 \approx 99{,}000$ examples. The ones near the end of a demonstration have fewer than 15 real future actions; the missing ones are copies and are not graded.`,
  },
  {
    title: "Thinking time in ticks",
    formula: String.raw`\text{ticks late} = \frac{\text{thinking time}}{\text{tick length}}`,
    symbols: [
      [String.raw`\text{thinking time}`, "how long the model takes to produce a chunk"],
      [String.raw`\text{tick length}`, "the time between two actions"],
    ],
    metaphor: "Answering a question about traffic you saw a few seconds ago: the road has moved on.",
    example: String.raw`At 20 actions a second a tick is $50$ ms. A model that thinks for $190$ ms is $190 / 50 \approx 4$ ticks late on a real robot.`,
  },
];
