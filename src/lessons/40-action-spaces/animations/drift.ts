/**
 * Toy data for "say where, not how far": the same 40 small random errors,
 * either kept apart (absolute targets) or added up (changes). Seeded and
 * rounded, so the server and the browser draw the same points.
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

/** `count` draws from a standard normal (Box-Muller). */
export function normals(count: number, seed: number): number[] {
  const random = mulberry32(seed);
  const values: number[] = [];
  while (values.length < count) {
    const u = Math.max(random(), 1e-9);
    const v = random();
    values.push(Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v));
  }
  return values;
}

const round = (value: number) => Math.round(value * 100) / 100;

export const COUNT = 40;
/** One error per command, in units of the error's spread. */
export const ERRORS = normals(COUNT, 10).map(round);
/** The same errors added up, as they would be if every command were a change from the last. */
export const SUMMED = ERRORS.reduce<number[]>((sums, e) => [...sums, round((sums.at(-1) ?? 0) + e)], []);
