/**
 * Seeded sketch data for this lesson's charts. Toy numbers that show a
 * pattern the lab measured; rounded so the server and the browser draw the
 * same thing.
 */

/** A small deterministic random stream (a linear congruential generator). */
export function stream(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

export const tidy = (value: number) => Math.round(value * 10) / 10;

/** Plot area of the slope chart. */
export const PLOT = { x: 60, y: 56, w: 380, h: 190 };
export const CX = PLOT.x + PLOT.w / 2;
export const CY = PLOT.y + PLOT.h / 2;
/** Drawing units of "where the hand closed" per unit of "where the object stood". */
export const RISE = PLOT.h / PLOT.w;

/** A point on a line through the centre with the given slope. */
export const onLine = (x: number, slope: number) => tidy(CY - (x - CX) * slope * RISE);

/** One try each: where the named object stood (x) and where the hand closed (y). */
function tries(seed: number, slope: number, spread: number): [number, number][] {
  const next = stream(seed);
  return Array.from({ length: 16 }, (_, i) => {
    const x = PLOT.x + 16 + ((i + next() * 0.8) / 16) * (PLOT.w - 32);
    return [tidy(x), tidy(onLine(x, slope) + (next() - 0.5) * 2 * spread)];
  });
}

/** The first robots: where they closed did not depend on where the object stood. */
export const IGNORING = tries(7, 0, 26);
/** After long enough training: the hand closes where the object is. */
export const LOOKING = tries(11, 1, 8);

/** A sketch of three measures rising over training, one after another (0 at the bottom, 1 at the top). */
export function rise(centre: number, width: number, points = 40): [number, number][] {
  return Array.from({ length: points + 1 }, (_, i) => {
    const t = i / points;
    const fine = (v: number) => Math.round(v * 1000) / 1000;
    return [fine(t), fine(1 / (1 + Math.exp(-(t - centre) / width)))];
  });
}
