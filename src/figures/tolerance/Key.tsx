import { Marker, type MarkerShape } from "@/figures/kit";

export interface KeyItem {
  label: string;
  color: string;
  shape?: MarkerShape;
  /** A stroke-dasharray: the reference line and the other build are told apart by their dash. */
  dash?: string;
}

/**
 * The chart's legend. The kit's Legend has one kind of dash; this figure
 * needs two (the dashed all-objects reference and the dotted other build),
 * so it draws its own, with the kit's classes.
 */
export function Key({ items }: { items: readonly KeyItem[] }) {
  return (
    <ul aria-label="Legend" className="fig-legend">
      {items.map((item) => (
        <li key={item.label}>
          <svg width={22} height={12} viewBox="0 0 22 12" aria-hidden="true" focusable="false">
            <line
              x1={1}
              x2={21}
              y1={6}
              y2={6}
              stroke={item.color}
              strokeWidth={item.dash ? 1.5 : 2}
              strokeDasharray={item.dash}
              strokeLinecap={item.dash ? "round" : undefined}
            />
            {item.shape ? <Marker shape={item.shape} x={11} y={6} color={item.color} /> : null}
          </svg>
          {item.label}
        </li>
      ))}
    </ul>
  );
}
