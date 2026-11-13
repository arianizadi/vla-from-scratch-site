/**
 * A toy loss valley for one weight: loss(w) = w². Its slope is 2w, so a
 * gradient step with learning rate (stride) η is w ← w − η · 2w. The
 * animations draw these positions; nothing here is a measured number.
 */

export const loss = (w: number) => w * w;
export const slope = (w: number) => 2 * w;

const tidy = (value: number) => Math.round(value * 1000) / 1000;

/** Positions of the weight after 0, 1, 2, ... steps from `start` with stride `eta`. */
export function descend(start: number, eta: number, steps: number, limit = 2.3): number[] {
  const out = [start];
  for (let i = 0; i < steps; i += 1) {
    const w = out[i] - eta * slope(out[i]);
    out.push(tidy(Math.max(-limit, Math.min(limit, w))));
  }
  return out;
}

/** A smooth polyline of the valley between -limit and limit, mapped through toX/toY. */
export function valleyPath(toX: (w: number) => number, toY: (l: number) => number, limit: number, points = 40): string {
  const parts: string[] = [];
  for (let i = 0; i <= points; i += 1) {
    const w = -limit + (2 * limit * i) / points;
    parts.push(`${i === 0 ? "M" : "L"}${tidy(toX(w))} ${tidy(toY(loss(w)))}`);
  }
  return parts.join("");
}
