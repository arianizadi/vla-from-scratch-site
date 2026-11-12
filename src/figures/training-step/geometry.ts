import { scaleLinear, type LinearScale } from "@/figures/kit";

/** Space around a plot: room for the kit's axes (left ticks, bottom ticks and label, left label on top). */
export const MARGIN = { top: 28, right: 12, bottom: 52, left: 40 } as const;

export interface Plot {
  width: number;
  height: number;
  x: LinearScale;
  y: LinearScale;
  /** Pixels per data unit, the same on both axes. */
  unit: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * A plot whose two axes have the same number of pixels per unit, so a square
 * in the data is a square on screen and a gradient drawn on the loss surface
 * meets its contour line at a right angle. The height follows from the width.
 */
export function equalAspectPlot(width: number, xDomain: [number, number], yDomain: [number, number]): Plot {
  const left = MARGIN.left;
  const right = width - MARGIN.right;
  const unit = (right - left) / (xDomain[1] - xDomain[0]);
  const top = MARGIN.top;
  const bottom = top + unit * (yDomain[1] - yDomain[0]);
  return {
    width,
    height: Math.round(bottom + MARGIN.bottom),
    x: scaleLinear(xDomain, [left, right]),
    y: scaleLinear(yDomain, [bottom, top]),
    unit,
    left,
    right,
    top,
    bottom,
  };
}

/** The `d` of a filled arrowhead whose tip is at (x2, y2), pointing away from (x1, y1). */
export function arrowHead(x1: number, y1: number, x2: number, y2: number, size = 9): string {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const spread = Math.PI / 7;
  const ax = x2 - size * Math.cos(angle - spread);
  const ay = y2 - size * Math.sin(angle - spread);
  const bx = x2 - size * Math.cos(angle + spread);
  const by = y2 - size * Math.sin(angle + spread);
  return `M${x2.toFixed(1)},${y2.toFixed(1)}L${ax.toFixed(1)},${ay.toFixed(1)}L${bx.toFixed(1)},${by.toFixed(1)}Z`;
}

/** Whether a point lies inside the plot area, `inset` pixels in from its edges. */
export function inside(plot: Plot, px: number, py: number, inset = 0): boolean {
  return px >= plot.left + inset && px <= plot.right - inset && py >= plot.top + inset && py <= plot.bottom - inset;
}

/**
 * Where the segment from an inside point (x1, y1) towards (x2, y2) leaves the
 * plot area; (x2, y2) itself when it stays inside.
 */
export function clipToPlot(plot: Plot, x1: number, y1: number, x2: number, y2: number): { x: number; y: number; clipped: boolean } {
  if (inside(plot, x2, y2)) return { x: x2, y: y2, clipped: false };
  let t = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx > 0) t = Math.min(t, (plot.right - x1) / dx);
  if (dx < 0) t = Math.min(t, (plot.left - x1) / dx);
  if (dy > 0) t = Math.min(t, (plot.bottom - y1) / dy);
  if (dy < 0) t = Math.min(t, (plot.top - y1) / dy);
  t = Math.max(0, t);
  return { x: x1 + dx * t, y: y1 + dy * t, clipped: true };
}

/** A React-safe id for SVG references (clip paths): useId() output without the characters url() dislikes. */
export function svgId(raw: string, suffix: string): string {
  return `ts${raw.replace(/[^a-zA-Z0-9_-]/g, "")}-${suffix}`;
}

/** Halo behind text drawn over lines, so it stays readable on the graph paper. */
export const HALO = { stroke: "var(--surface)", strokeWidth: 4, paintOrder: "stroke", strokeLinejoin: "round" } as const;
