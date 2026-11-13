/**
 * A toy loss valley and a walk down it, computed. The loss is u², where u
 * stands for the model's numbers squeezed onto one axis. Each update moves u
 * against the slope (2u) by a step size that starts small, grows, then shrinks
 * again: the shape of a warm-up followed by a slow decay. Toy numbers only.
 */

/** Step sizes of the seven updates: small, big, small. */
export const STEP_SIZES = [0.04, 0.06, 0.25, 0.3, 0.2, 0.12, 0.06];

const START = -0.95;

/** u after 0, 1, ... 7 updates. */
export const WALK: number[] = STEP_SIZES.reduce<number[]>(
  (walk, size) => {
    const u = walk[walk.length - 1];
    walk.push(Math.round((u - size * 2 * u) * 1000) / 1000);
    return walk;
  },
  [START],
);

/** Drawing: u from -1 to 1 maps to x 50..430; loss 0..1 maps to y 230..62. */
export const toX = (u: number) => Math.round((240 + u * 190) * 10) / 10;
export const toY = (u: number) => Math.round((230 - 168 * u * u) * 10) / 10;

/** The valley as an SVG path. */
export const VALLEY = Array.from({ length: 41 }, (_, index) => {
  const u = -1 + index / 20;
  return `${index === 0 ? "M" : "L"}${toX(u)} ${toY(u)}`;
}).join("");

/** Which updates have happened by each animation step. */
export const UPDATES_BY_STEP = [0, 0, 2, 4, 7];
