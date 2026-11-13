import { at, round, toneClass, type Animated, type Tone } from "./shared";

/* The robot, drawn from the side: a two-link arm on a base, a wrist and a
   parallel gripper, and the four objects of the tasks. Angles are degrees,
   clockwise, 0 pointing straight up. Joint angles animate with the frame's
   transition, so a new pose sweeps the arm there. */

export interface GripperProps extends Animated {
  /** The wrist: top centre of the gripper. */
  x?: number;
  y?: number;
  /** 0 closed, 1 fully open. */
  open?: number;
  /** Degrees, clockwise; 0 points the fingers down. */
  angle?: number;
  tone?: Tone;
  /** 1 is about 44 units wide when open. */
  size?: number;
}

/** A parallel-jaw gripper, fingers pointing down. Animate `open` to grasp. */
export function Gripper({ x = 0, y = 0, open = 1, angle = 0, tone = "ink", size = 1, opacity, delay }: GripperProps) {
  const spread = 5 + Math.min(1, Math.max(0, open)) * 13;
  return (
    <g className={`a-t ${toneClass(tone)}`} style={at(x, y, { opacity, delay, rotate: angle, scale: size })}>
      <rect className="a-fill" x={-5} y={0} width={10} height={10} rx={2} />
      <rect className="a-fill" x={-24} y={10} width={48} height={7} rx={3} />
      <g className="a-t" style={{ transform: `translate(${round(-spread)}px, 0px)`, transitionDelay: delay ? `${delay}ms` : undefined }}>
        <rect className="a-fill" x={-6} y={16} width={6} height={26} rx={2} />
      </g>
      <g className="a-t" style={{ transform: `translate(${round(spread)}px, 0px)`, transitionDelay: delay ? `${delay}ms` : undefined }}>
        <rect className="a-fill" x={0} y={16} width={6} height={26} rx={2} />
      </g>
    </g>
  );
}

/** Length from the wrist to the fingertips, in gripper units. */
export const GRIPPER_REACH = 42;

export interface ArmProps extends Animated {
  /** Where the base stands on the table. */
  base: [number, number];
  /** Shoulder, elbow and wrist angles in degrees (see `reach` to aim at a point). */
  angles: [number, number, number];
  /** Upper arm and forearm lengths. Default [110, 100]. */
  lengths?: [number, number];
  /** Gripper opening, 0 closed to 1 open. */
  open?: number;
  tone?: Tone;
}

/**
 * A two-link arm with a wrist and a gripper. Give it a pose with `reach()` and
 * change the pose between steps: the joints rotate there together.
 */
export function Arm({ base, angles, lengths = [110, 100], open = 1, tone = "ink", opacity, delay }: ArmProps) {
  const [l1, l2] = lengths;
  const [a1, a2, a3] = angles;
  const lag = (extra: number) => ({ transitionDelay: `${(delay ?? 0) + extra}ms` });
  return (
    <g className={`${toneClass(tone)} arm`} style={at(base[0], base[1], { opacity })}>
      <path d="M-30 0h60l-8 -16h-44z" className="a-fill-soft a-stroke" strokeWidth={2} strokeLinejoin="round" />
      <g className="a-t" style={{ transform: `translate(0px, -16px) rotate(${round(a1)}deg)`, ...lag(0) }}>
        <line x1={0} y1={0} x2={0} y2={-l1} className="a-stroke arm-link" strokeWidth={12} strokeLinecap="round" />
        <circle r={9} className="a-fill-surface a-stroke" strokeWidth={2.5} />
        <g className="a-t" style={{ transform: `translate(0px, ${-l1}px) rotate(${round(a2)}deg)`, ...lag(30) }}>
          <line x1={0} y1={0} x2={0} y2={-l2} className="a-stroke arm-link" strokeWidth={10} strokeLinecap="round" />
          <circle r={8} className="a-fill-surface a-stroke" strokeWidth={2.5} />
          <g className="a-t" style={{ transform: `translate(0px, ${-l2}px) rotate(${round(a3)}deg)`, ...lag(60) }}>
            <g style={{ transform: "rotate(180deg)" }}>
              <Gripper open={open} tone={tone} delay={(delay ?? 0) + 60} />
            </g>
          </g>
        </g>
      </g>
    </g>
  );
}

/**
 * The joint angles that put the fingertips at `target` with the gripper
 * pointing straight down, elbow up. Out-of-reach targets are clamped to the
 * edge of the reach.
 */
export function reach(
  base: [number, number],
  target: [number, number],
  lengths: [number, number] = [110, 100],
): [number, number, number] {
  const [l1, l2] = lengths;
  const shoulder: [number, number] = [base[0], base[1] - 16];
  const wrist: [number, number] = [target[0], target[1] - GRIPPER_REACH];
  const dx = wrist[0] - shoulder[0];
  const dy = wrist[1] - shoulder[1];
  const d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.001);
  const theta = (Math.atan2(dx, -dy) * 180) / Math.PI;
  const alpha = (Math.acos(Math.min(1, Math.max(-1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)))) * 180) / Math.PI;
  const phi = (Math.acos(Math.min(1, Math.max(-1, (l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2)))) * 180) / Math.PI;
  const a1 = theta - alpha;
  const a2 = 180 - phi;
  const a3 = 180 - a1 - a2;
  return [round(a1), round(a2), round(a3)];
}

export type ThingKind = "cube" | "can" | "nut" | "tee";

export interface ThingProps extends Animated {
  kind: ThingKind;
  /** Centre of the object's base on the table. */
  x: number;
  y: number;
  tone?: Tone;
  /** Object side, about. Default 30. */
  size?: number;
  /** Ring it with the highlighter: the object the instruction names. */
  active?: boolean;
}

/**
 * One of the task's objects, standing on the table at (x, y): the red cube,
 * the green can, the blue hex nut, the yellow T block. Colour by role (the
 * named object in `action`, others `muted`), and always label which is which.
 */
export function Thing({ kind, x, y, tone = "muted", size = 30, active = false, opacity, delay }: ThingProps) {
  const s = size;
  const shape =
    kind === "cube" ? (
      <rect x={-s / 2} y={-s} width={s} height={s} rx={4} />
    ) : kind === "can" ? (
      <rect x={-s * 0.4} y={-s * 1.15} width={s * 0.8} height={s * 1.15} rx={s * 0.3} />
    ) : kind === "nut" ? (
      <path
        d={`M${-s / 2} ${-s / 2}L${-s / 4} ${-s}H${s / 4}L${s / 2} ${-s / 2}L${s / 4} 0H${-s / 4}Z`}
        strokeLinejoin="round"
      />
    ) : (
      <path d={`M${-s * 0.6} ${-s}H${s * 0.6}V${-s * 0.66}H${s * 0.18}V0H${-s * 0.18}V${-s * 0.66}H${-s * 0.6}Z`} strokeLinejoin="round" />
    );
  return (
    <g className={`a-t ${toneClass(tone)} thing ${active ? "thing-active" : ""}`} style={at(x, y, { opacity, delay })}>
      {active ? <ellipse className="thing-ring" cx={0} cy={2} rx={s * 0.85} ry={6} /> : null}
      <g className="a-fill-soft a-stroke" strokeWidth={2}>
        {shape}
      </g>
    </g>
  );
}
