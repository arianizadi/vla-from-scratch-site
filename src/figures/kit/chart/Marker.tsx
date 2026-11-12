import type { SVGProps } from "react";

export type MarkerShape = "circle" | "square" | "triangle" | "diamond" | "hexagon" | "tee";

export interface MarkerProps extends Omit<SVGProps<SVGGElement>, "x" | "y" | "shape"> {
  shape?: MarkerShape;
  /** Centre, in SVG user units. */
  x: number;
  y: number;
  /** Width of the marker. Default 8, the smallest size the design allows. */
  size?: number;
  /** A CSS colour, normally one of SERIES. */
  color: string;
  /** Draw the outline only (a reference or a deselected point). */
  hollow?: boolean;
  /** A 2px ring in the surface colour, so overlapping markers stay apart. Default true. */
  ring?: boolean;
}

function outline(shape: MarkerShape, r: number): string {
  switch (shape) {
    case "square":
      return `M${-r},${-r}h${2 * r}v${2 * r}h${-2 * r}z`;
    case "triangle":
      return `M0,${-r * 1.15}L${r * 1.1},${r * 0.8}H${-r * 1.1}z`;
    case "diamond":
      return `M0,${-r * 1.25}L${r * 1.25},0L0,${r * 1.25}L${-r * 1.25},0z`;
    case "hexagon": {
      const h = r * 1.1;
      const points = Array.from({ length: 6 }, (_, index) => {
        const angle = (Math.PI / 3) * index;
        return `${(h * Math.cos(angle)).toFixed(2)},${(h * Math.sin(angle)).toFixed(2)}`;
      });
      return `M${points.join("L")}z`;
    }
    case "tee": {
      const t = r * 0.7;
      return `M${-r * 1.1},${-r}h${2.2 * r}v${t}h${-(1.1 * r - t / 2)}v${2 * r - t}h${-t}v${-(2 * r - t)}h${-(1.1 * r - t / 2)}z`;
    }
    case "circle":
      return "";
  }
}

/**
 * A data point. The shape identifies the entity together with the colour, so
 * a chart still reads without colour vision or in a black-and-white print.
 */
export function Marker({ shape = "circle", x, y, size = 8, color, hollow = false, ring = true, ...rest }: MarkerProps) {
  const r = size / 2;
  const paint = {
    fill: hollow ? "var(--surface)" : color,
    stroke: hollow ? color : ring ? "var(--surface)" : "none",
    strokeWidth: hollow ? 1.5 : ring ? 2 : 0,
    // The ring is drawn behind the fill, so it adds to the marker instead of eating into it.
    paintOrder: "stroke" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <g transform={`translate(${x},${y})`} {...rest}>
      {shape === "circle" ? <circle r={r} {...paint} /> : <path d={outline(shape, r)} {...paint} />}
    </g>
  );
}
