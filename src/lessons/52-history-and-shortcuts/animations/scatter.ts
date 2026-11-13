/**
 * Seeded toy dots: where a gripper first closed, around the named object, at a
 * chosen typical distance. Rounded so the server and the browser draw the same.
 */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (value: number) => Math.round(value * 10) / 10;

/** `count` points spread evenly over a w x h box centred on (0, 0). */
export function spread(count: number, w: number, h: number, seed: number): [number, number][] {
  const random = mulberry32(seed);
  return Array.from({ length: count }, () => [round((random() - 0.5) * w), round((random() - 0.5) * h)]);
}

/** `count` points around (0, 0) whose distance from it has the given median, in drawing units. */
export function scatter(count: number, median: number, seed: number): [number, number][] {
  const random = mulberry32(seed);
  return Array.from({ length: count }, () => {
    const angle = 2 * Math.PI * random();
    // Distances from a half-normal shape scaled so that the median lands on `median`.
    const u = Math.max(random(), 1e-6);
    const v = random();
    const z = Math.abs(Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v));
    const distance = (z / 0.674) * median;
    return [round(Math.cos(angle) * distance), round(Math.sin(angle) * distance)];
  });
}
