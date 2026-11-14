/**
 * The cosine learning-rate schedule the runs used: the step size falls from its peak to zero along
 * half a cosine stretched over the planned number of training examples (warm-up left out). Points
 * are rounded so the server and the browser draw the same curve.
 */

/** Share of the peak step size after `seen` examples, for a run planned for `planned` examples. */
export function stepShare(seen: number, planned: number): number {
  if (seen >= planned) return 0;
  return 0.5 * (1 + Math.cos((Math.PI * seen) / planned));
}

/** Drawing points of one plan's curve, from 0 to `planned` examples. */
export function scheduleCurve(planned: number, x: (seen: number) => number, y: (share: number) => number, points = 48): [number, number][] {
  return Array.from({ length: points + 1 }, (_, i) => {
    const seen = (i / points) * planned;
    return [Math.round(x(seen) * 10) / 10, Math.round(y(stepShare(seen, planned)) * 10) / 10];
  });
}
