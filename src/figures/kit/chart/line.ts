/**
 * Builds the `d` attribute of an SVG path through a list of points.
 *
 *   <path d={linePath(rows, (row) => x(row.step), (row) => y(row.loss))}
 *         fill="none" stroke={SERIES[0]} strokeWidth={2} />
 */

export type Curve = "linear" | "step" | "monotone";

export interface LineOptions<T> {
  /**
   * linear    straight segments (the default; right for measured points)
   * step      hold each value until the next point (counts, checkpoints)
   * monotone  a smooth curve that never overshoots the points (dense curves)
   */
  curve?: Curve;
  /** Points for which this returns false break the line. */
  defined?: (datum: T, index: number) => boolean;
}

type Point = readonly [number, number];

const format = (value: number) => (Math.round(value * 100) / 100).toString();

function segment(points: Point[], curve: Curve): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  let d = `M${format(first[0])},${format(first[1])}`;
  if (rest.length === 0) return d;

  if (curve === "step") {
    for (const point of rest) d += `H${format(point[0])}V${format(point[1])}`;
    return d;
  }

  if (curve === "monotone" && points.length > 2) {
    // Fritsch-Carlson tangents: the curve stays between neighbouring points.
    const n = points.length;
    const dx: number[] = [];
    const slope: number[] = [];
    for (let i = 0; i < n - 1; i += 1) {
      dx.push(points[i + 1][0] - points[i][0]);
      slope.push(dx[i] === 0 ? 0 : (points[i + 1][1] - points[i][1]) / dx[i]);
    }
    const tangent: number[] = [slope[0]];
    for (let i = 1; i < n - 1; i += 1) {
      tangent.push(slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2);
    }
    tangent.push(slope[n - 2]);
    for (let i = 0; i < n - 1; i += 1) {
      if (slope[i] === 0) {
        tangent[i] = 0;
        tangent[i + 1] = 0;
        continue;
      }
      const a = tangent[i] / slope[i];
      const b = tangent[i + 1] / slope[i];
      const length = Math.hypot(a, b);
      if (length > 3) {
        tangent[i] = (3 * a * slope[i]) / length;
        tangent[i + 1] = (3 * b * slope[i]) / length;
      }
    }
    for (let i = 0; i < n - 1; i += 1) {
      const [x0, y0] = points[i];
      const [x1, y1] = points[i + 1];
      const third = dx[i] / 3;
      d += `C${format(x0 + third)},${format(y0 + tangent[i] * third)} ${format(x1 - third)},${format(y1 - tangent[i + 1] * third)} ${format(x1)},${format(y1)}`;
    }
    return d;
  }

  for (const point of rest) d += `L${format(point[0])},${format(point[1])}`;
  return d;
}

export function linePath<T>(
  data: readonly T[],
  x: (datum: T, index: number) => number,
  y: (datum: T, index: number) => number,
  options: LineOptions<T> = {},
): string {
  const { curve = "linear", defined } = options;
  const runs: Point[][] = [[]];
  data.forEach((datum, index) => {
    const px = x(datum, index);
    const py = y(datum, index);
    const ok = (defined ? defined(datum, index) : true) && Number.isFinite(px) && Number.isFinite(py);
    if (ok) runs[runs.length - 1].push([px, py]);
    else if (runs[runs.length - 1].length > 0) runs.push([]);
  });
  return runs
    .filter((run) => run.length > 0)
    .map((run) => segment(run, curve))
    .join("");
}
