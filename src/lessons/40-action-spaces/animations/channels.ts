/**
 * Toy values for three action channels, seeded so the server and the browser
 * draw the same dots. Only joint 4's centre (-1.57 rad, its home angle) and the
 * gripper's two values (1 open, 0 closed) come from the chapter; the spreads
 * are made up to show the shape of the problem.
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

function normals(count: number, seed: number): number[] {
  const random = mulberry32(seed);
  const values: number[] = [];
  while (values.length < count) {
    const u = Math.max(random(), 1e-9);
    const v = random();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    if (Math.abs(z) < 2.4) values.push(z);
  }
  return values;
}

const round = (value: number) => Math.round(value * 1000) / 1000;

export interface Channel {
  name: string;
  /** Raw values in radians (joints) or the command (gripper). */
  raw: number[];
  mean: number;
  std: number;
}

function channel(name: string, raw: number[]): Channel {
  const mean = raw.reduce((sum, v) => sum + v, 0) / raw.length;
  const std = Math.sqrt(raw.reduce((sum, v) => sum + (v - mean) ** 2, 0) / raw.length);
  return { name, raw: raw.map(round), mean: round(mean), std: round(std) };
}

const COUNT = 14;

export const CHANNELS: Channel[] = [
  channel("stiff joint", normals(COUNT, 3).map((z) => -1.57 + 0.05 * z)),
  channel("busy joint", normals(COUNT, 11).map((z) => 0.22 * z)),
  channel("gripper", Array.from({ length: COUNT }, (_, i) => (i % 5 < 3 ? 1 : 0))),
];
