import { Label } from "@/animations";

/**
 * The task seen from above: three objects on a table, the instruction names
 * the can. Shared by the animations of this lesson so the scene stays the same.
 */
export const CUBE: [number, number] = [82, 130];
export const CAN: [number, number] = [178, 206];
export const NUT: [number, number] = [244, 116];
export const TABLE = { x: 16, y: 48, w: 284, h: 222 };

export function TopTable({ dimOthers = false }: { dimOthers?: boolean }) {
  const other = dimOthers ? 0.45 : 1;
  return (
    <>
      <rect x={TABLE.x} y={TABLE.y} width={TABLE.w} height={TABLE.h} rx={16} className="t-faint a-fill-soft" />
      <Label x={TABLE.x + TABLE.w / 2} y={24} tone="language" size={15}>
        “pick up the can”
      </Label>
      <g className="a-t t-muted" style={{ opacity: other }}>
        <rect x={CUBE[0] - 16} y={CUBE[1] - 16} width={32} height={32} rx={5} className="a-fill-soft a-stroke" strokeWidth={2} />
        <path
          d={`M${NUT[0] - 17} ${NUT[1]}L${NUT[0] - 8.5} ${NUT[1] - 15}H${NUT[0] + 8.5}L${NUT[0] + 17} ${NUT[1]}L${NUT[0] + 8.5} ${NUT[1] + 15}H${NUT[0] - 8.5}Z`}
          className="a-fill-soft a-stroke"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </g>
      <g className="t-action">
        <circle cx={CAN[0]} cy={CAN[1]} r={16} className="a-fill-soft a-stroke" strokeWidth={2.5} />
      </g>
      <Label x={CUBE[0]} y={CUBE[1] + 30} tone="muted" size={14} opacity={other}>
        cube
      </Label>
      <Label x={NUT[0]} y={NUT[1] + 30} tone="muted" size={14} opacity={other}>
        nut
      </Label>
      <Label x={CAN[0]} y={CAN[1] + 36} tone="action" size={14} weight={700}>
        can
      </Label>
    </>
  );
}

/** Where the gripper first closed, seen from above: a ring with a dot. */
export function CloseMark({ x, y, opacity = 1, delay, tone = "accent" }: { x: number; y: number; opacity?: number; delay?: number; tone?: "accent" | "ink" | "failure" }) {
  return (
    <g
      className={`a-t t-${tone}`}
      style={{ transform: `translate(${x}px, ${y}px)`, opacity, transitionDelay: delay ? `${delay}ms` : undefined }}
    >
      <circle r={10} className="a-stroke" fill="none" strokeWidth={2.5} />
      <circle r={3.5} className="a-fill" />
    </g>
  );
}
