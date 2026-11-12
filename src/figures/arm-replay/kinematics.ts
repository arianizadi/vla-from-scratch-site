/**
 * Forward kinematics of the Franka Emika Panda, and the shapes of the scene.
 *
 * The arm is drawn from the seven recorded joint angles alone, with the
 * published Denavit-Hartenberg parameters of the Panda (Craig's modified
 * convention, as in Franka's documentation). The point between the fingertips
 * (the TCP) lands within a few millimetres of the recorded gripper position,
 * which the files round to the millimetre: the drawing is the robot's real
 * pose, not an animation of the path.
 *
 * Everything is in the robot's frame, in metres: the origin is the base on
 * the table top, x away from the base over the table, y to the robot's left,
 * z up. No measured result is in this file: these are the dimensions of the
 * robot, the table and the objects of the simulated scene.
 */

/** A 4x4 homogeneous transform, row-major. */
export type Mat4 = number[];
export type Vec3 = [number, number, number];

/** Modified DH parameters of joints 1 to 7: a (m), d (m), alpha (rad). */
const PANDA_DH: readonly (readonly [number, number, number])[] = [
  [0, 0.333, 0],
  [0, 0, -Math.PI / 2],
  [0, 0.316, Math.PI / 2],
  [0.0825, 0, Math.PI / 2],
  [-0.0825, 0.384, -Math.PI / 2],
  [0, 0, Math.PI / 2],
  [0.088, 0, Math.PI / 2],
];

/** Joint 7 to the flange, along its axis. */
const FLANGE_D = 0.107;
/** The hand is mounted turned by -45 degrees about the flange axis. */
const HAND_TURN = -Math.PI / 4;
/** Flange to the point between the fingertips. */
export const TCP_D = 0.1034;
/** Flange to the base of the fingers. */
export const FINGER_BASE_D = 0.0584;
/** Full opening of the Panda's fingers. */
export const MAX_OPENING = 0.08;

const IDENTITY: Mat4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

function multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Array<number>(16);
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      let sum = 0;
      for (let k = 0; k < 4; k += 1) sum += a[row * 4 + k] * b[k * 4 + column];
      out[row * 4 + column] = sum;
    }
  }
  return out;
}

/** RotX(alpha) TransX(a): the part of a modified DH step before the joint turns. */
function beforeJoint(a: number, alpha: number): Mat4 {
  const ca = Math.cos(alpha);
  const sa = Math.sin(alpha);
  return [1, 0, 0, a, 0, ca, -sa, 0, 0, sa, ca, 0, 0, 0, 0, 1];
}

/** RotZ(theta) TransZ(d): the joint itself, and the offset along its axis. */
function atJoint(theta: number, d: number): Mat4 {
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  return [ct, -st, 0, 0, st, ct, 0, 0, 0, 0, 1, d, 0, 0, 0, 1];
}

const origin = (m: Mat4): Vec3 => [m[3], m[7], m[11]];
const zAxis = (m: Mat4): Vec3 => [m[2], m[6], m[10]];

export interface ArmPose {
  /**
   * The points the links run through, from the base to the flange: each
   * joint's frame, with the corner of the two offset joints in between. Two
   * neighbours are never the same point.
   */
  chain: Vec3[];
  /** Each joint's centre and the axis it turns about. */
  joints: { at: Vec3; axis: Vec3 }[];
  /** The hand's frame (row-major): z along the fingers, y the closing axis. */
  hand: Mat4;
  /** The point between the fingertips. */
  tcp: Vec3;
}

/** The pose of every part of the arm for seven joint angles. */
export function pandaPose(q: readonly number[]): ArmPose {
  let frame = IDENTITY;
  const chain: Vec3[] = [[0, 0, 0]];
  const joints: { at: Vec3; axis: Vec3 }[] = [];
  const push = (point: Vec3) => {
    const last = chain[chain.length - 1];
    if (Math.hypot(point[0] - last[0], point[1] - last[1], point[2] - last[2]) > 1e-6) chain.push(point);
  };

  PANDA_DH.forEach(([a, d, alpha], index) => {
    const corner = multiply(frame, beforeJoint(a, alpha));
    push(origin(corner));
    frame = multiply(corner, atJoint(q[index] ?? 0, d));
    push(origin(frame));
    // The joint turns about its frame's z axis; the housing sits on that axis at the frame's origin.
    joints.push({ at: origin(frame), axis: zAxis(frame) });
  });

  const flange = multiply(frame, atJoint(0, FLANGE_D));
  push(origin(flange));
  const hand = multiply(flange, atJoint(HAND_TURN, 0));
  const tcp = origin(multiply(hand, atJoint(0, TCP_D)));
  return { chain, joints, hand, tcp };
}

/** Linear interpolation between two arrays of the same length. */
export function mix(a: readonly number[], b: readonly number[], t: number): number[] {
  return a.map((value, index) => value + ((b[index] ?? value) - value) * t);
}

/** An angle interpolated the short way round. */
export function mixAngle(a: number, b: number, t: number): number {
  let delta = b - a;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  return a + delta * t;
}

// ---------------------------------------------------------------- the scene

/** The table top, z = 0: its extent in x and y. */
export const TABLE = { x: [-0.05, 0.75], y: [-0.6, 0.6] } as const;

/**
 * What a named view frames: the part of the table the objects are placed on,
 * and the arm above it up to the elbow. The base and the shoulder may be cut.
 */
export const FRAME_BOX = { min: [0.04, -0.26, 0] as Vec3, max: [0.7, 0.26, 0.6] as Vec3 };

/** What the view from above frames: the part of the table the objects are placed on. */
export const PLAN_BOX = { min: [0.28, -0.3, 0] as Vec3, max: [0.72, 0.3, 0] as Vec3 };

/**
 * The direction the front camera of the simulated scene looks from (its
 * position minus the point it looks at): the view the policy has of the table.
 */
export const FRONT_CAMERA_DIRECTION: Vec3 = [1.15 - 0.42, -0.55 - 0, 0.62 - 0.1];

/**
 * The simple solids the objects are drawn as, with the dimensions of the
 * simulated scene's objects: the collision boxes and cylinders, except the hex
 * nut, which the simulator collides as a cylinder and which is drawn as the
 * hexagonal prism of its visual mesh (23 mm from the centre to a flat, without
 * its bore). Each part is placed relative to the object's origin, which the
 * rollout's poses give.
 */
export type ObjectPart =
  | { kind: "box"; size: Vec3; offset: Vec3 }
  | { kind: "prism"; radius: number; height: number; sides: number; offset: Vec3 };

export const OBJECT_SHAPES: Record<"cube" | "can" | "hex" | "tblock", ObjectPart[]> = {
  cube: [{ kind: "box", size: [0.045, 0.045, 0.045], offset: [0, 0, 0] }],
  can: [{ kind: "prism", radius: 0.023, height: 0.084, sides: 32, offset: [0, 0, 0] }],
  hex: [{ kind: "prism", radius: 0.023 / Math.cos(Math.PI / 6), height: 0.04, sides: 6, offset: [0, 0, 0] }],
  tblock: [
    { kind: "box", size: [0.03, 0.03, 0.045], offset: [0, 0, 0] },
    { kind: "box", size: [0.07, 0.03, 0.015], offset: [0, 0, 0.03] },
  ],
};

/** Height of the top of each object above its origin, for placing its label. */
export const OBJECT_TOP: Record<"cube" | "can" | "hex" | "tblock", number> = {
  cube: 0.0225,
  can: 0.042,
  hex: 0.02,
  tblock: 0.0375,
};

/** Horizontal distance between two points, in metres. */
export function planDistance(a: readonly number[], b: readonly number[]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}
