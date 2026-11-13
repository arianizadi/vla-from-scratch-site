/**
 * The maths behind the lesson, with a picture and a worked example.
 * Rendered by the lesson page when present; not imported by lesson.ts.
 */

export const math = [
  {
    title: "How much a crash can cost",
    formula: String.raw`\text{lost} \le \frac{T}{N}, \qquad \text{lost on average} \approx \frac{T}{2N}`,
    symbols: [
      [String.raw`T`, "how long the whole run takes"],
      [String.raw`N`, "how many save points the run writes, evenly spaced"],
      [String.raw`\frac{T}{N}`, "the time between two save points"],
      [String.raw`\text{lost}`, "the work redone after a crash: everything since the newest save"],
    ],
    metaphor: "A game that saves at every checkpoint flag: die anywhere, and you replay at most the stretch since the last flag, about half of it on a typical death.",
    example: String.raw`A run of about $76$ minutes with $N = 6$ saves has one every $76 / 6 \approx 13$ minutes. A crash costs at most $13$ minutes, about $6$ on average, if a watcher restarts it at once. With $N = 10$ the worst case drops to about $8$ minutes, at the price of more files on disk.`,
  },
];
