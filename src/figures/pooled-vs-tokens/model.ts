/**
 * The toy behind the drawing, and the measured comparison that goes with it.
 *
 * The toy. A camera frame is cut into patches as the ViT of the pick-up
 * policies cuts it. A token here is its patch's pixels as they are, one number
 * per pixel: 0 where the pixel shows the table, 1 where it shows the cube. (A
 * real patch embedding passes those pixels through a learned linear layer, and
 * the encoder's blocks follow.) The pooled vector is the plain average of the
 * tokens, which for any linear patch embedding is the embedding of the average
 * patch. Nothing in the toy is measured. The patch size is the one chapter 21
 * gives for the patch-token ViT; the cube's outline, the median chapter 20
 * estimates for the front camera.
 *
 * The measurement. The two `pick_cube` rows of the lab notebook that differ
 * in what reaches the action head, read from the data module.
 */

import { formatInterval, formatSuccess } from "@/data/format";
import { MACHINES, TASKS } from "@/data/labels";
import { pickCube, setup, type PickCubeRow } from "@/data/notebook";

// ---------------------------------------------------------------- the frame and its patches

/** Side of a camera frame in pixels, as the policies receive it. */
export const FRAME_PX = setup.camera.pixels;
/**
 * Side of a patch in pixels: `patch_size` of the ViT in the patch-token
 * policies. A chapter-text constant, not a measurement, and not (yet) in the
 * data module: chapter 20, "Image 224 px, patch 16 px: 224 / 16 = 14 patches
 * per side", and chapter 21, "The ViT in dp_vit.yaml uses 16-pixel patches".
 */
export const PATCH_PX = 16;
/** Patches per side. */
export const GRID = FRAME_PX / PATCH_PX;
/** Tokens per frame: one per patch. */
export const TOKEN_COUNT = GRID * GRID;
/** Numbers in a token of the toy: one per pixel of its patch. */
export const TOKEN_WIDTH = PATCH_PX * PATCH_PX;

/**
 * The cube's outline in the frame, in pixels. A chapter-text constant, not a
 * measurement, and not (yet) in the data module: chapter 20 estimates the
 * cube at about one patch across, usually straddling a grid line in both
 * directions, "its whole outline about 16 by 18, roughly one patch" (median
 * 18 tall). If that estimate changes, change this with it.
 */
export const CUBE = { width: 16, height: 18 } as const;
/** How far below the outline's top the edge between the cube's top and front face is drawn. */
export const CUBE_EDGE = 6;

export interface Point {
  x: number;
  y: number;
}

/** The top-left corner of the cube's outline before the move, in frame pixels. */
export const BEFORE: Point = { x: 38, y: 122 };
/** Where the figure puts the cube: its first state, and where a played move ends. */
export const AFTER: Point = { x: 148, y: 70 };
/** The largest top-left corner that keeps the whole cube in the frame. */
export const LIMIT: Point = { x: FRAME_PX - CUBE.width, y: FRAME_PX - CUBE.height };

/** A position inside the frame, on whole pixels. */
export function clampToFrame(point: Point): Point {
  return {
    x: Math.min(LIMIT.x, Math.max(0, Math.round(point.x))),
    y: Math.min(LIMIT.y, Math.max(0, Math.round(point.y))),
  };
}

/** The point a share of the way from one place to another, on whole pixels. */
export function between(from: Point, to: Point, share: number): Point {
  return clampToFrame({ x: from.x + (to.x - from.x) * share, y: from.y + (to.y - from.y) * share });
}

export const samePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y;

// ---------------------------------------------------------------- tokens

/** The part of the cube that lies in one patch, in frame pixels. */
export interface Piece {
  /** Index of the patch's token: row by row from the top left, 0 to 195. */
  token: number;
  column: number;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The cube cut along the patch grid: one piece for every patch it touches. */
export function piecesAt(at: Point): Piece[] {
  const pieces: Piece[] = [];
  const lastColumn = Math.floor((at.x + CUBE.width - 1) / PATCH_PX);
  const lastRow = Math.floor((at.y + CUBE.height - 1) / PATCH_PX);
  for (let row = Math.floor(at.y / PATCH_PX); row <= lastRow; row += 1) {
    for (let column = Math.floor(at.x / PATCH_PX); column <= lastColumn; column += 1) {
      const x = Math.max(at.x, column * PATCH_PX);
      const y = Math.max(at.y, row * PATCH_PX);
      pieces.push({
        token: row * GRID + column,
        column,
        row,
        x,
        y,
        width: Math.min(at.x + CUBE.width, (column + 1) * PATCH_PX) - x,
        height: Math.min(at.y + CUBE.height, (row + 1) * PATCH_PX) - y,
      });
    }
  }
  return pieces;
}

/** What a token's numbers are, as text: where in its own patch the piece of cube lies. */
function content(piece: Piece): string {
  return [piece.x - piece.column * PATCH_PX, piece.y - piece.row * PATCH_PX, piece.width, piece.height].join(",");
}

// ---------------------------------------------------------------- the pooled vector

/**
 * The pooled vector, up to its scale: for each pixel position inside a patch,
 * how many of the frame's patches show the cube there. The average of the
 * tokens is this count divided by the number of tokens. Row by row, like a
 * token: index `row * PATCH_PX + column`.
 */
export function averagePatch(at: Point): number[] {
  const columns = new Array<number>(PATCH_PX).fill(0);
  const rows = new Array<number>(PATCH_PX).fill(0);
  for (let x = at.x; x < at.x + CUBE.width; x += 1) columns[x % PATCH_PX] += 1;
  for (let y = at.y; y < at.y + CUBE.height; y += 1) rows[y % PATCH_PX] += 1;
  return rows.flatMap((inRow) => columns.map((inColumn) => inRow * inColumn));
}

/**
 * How much the pooled vector is drawn magnified so that its largest value
 * fills the scale: the number of tokens over the largest count. The cube's
 * outline never changes size, so neither does this.
 */
export const POOLED_MAGNIFICATION = TOKEN_COUNT / Math.max(...averagePatch(BEFORE));

/** The values present in a pooled vector, as numerators over TOKEN_COUNT, smallest first, zero left out. */
export function pooledValues(counts: readonly number[]): number[] {
  return [...new Set(counts.filter((count) => count > 0))].sort((a, b) => a - b);
}

// ---------------------------------------------------------------- how many places look the same

/**
 * Both representations split along the two axes: which pixels of the frame a
 * cube covers across depends on its x only, down on its y only. So two places
 * of the cube give the same tokens when they agree on what each gives along
 * x and along y, and the same for the pooled vector (the outer product of how
 * often each pixel row and pixel column of a patch is covered).
 */

/** What the tokens hold along one axis: for each patch the cube's span touches, where in it the span lies. */
function tokenAxis(start: number, length: number): string {
  const parts: string[] = [];
  for (let patch = Math.floor(start / PATCH_PX); patch * PATCH_PX < start + length; patch += 1) {
    const from = Math.max(start, patch * PATCH_PX);
    const to = Math.min(start + length, (patch + 1) * PATCH_PX);
    parts.push(`${patch}:${from - patch * PATCH_PX}-${to - patch * PATCH_PX}`);
  }
  return parts.join(" ");
}

/** What the pooled vector holds along one axis: how often each pixel line of a patch is covered. */
function pooledAxis(start: number, length: number): string {
  const lines = new Array<number>(PATCH_PX).fill(0);
  for (let at = start; at < start + length; at += 1) lines[at % PATCH_PX] += 1;
  return lines.join(",");
}

/** Of all the places along one axis, how many give the same as `start`. */
function sameAlong(axis: (start: number, length: number) => string, start: number, length: number, limit: number) {
  const here = axis(start, length);
  let count = 0;
  for (let other = 0; other <= limit; other += 1) if (axis(other, length) === here) count += 1;
  return count;
}

/** Every place the whole cube can be in the frame, on whole pixels. */
export const ALL_PLACES = (LIMIT.x + 1) * (LIMIT.y + 1);

/** How many places of the cube in the frame give exactly these tokens. */
export function placesWithSameTokens(at: Point): number {
  return sameAlong(tokenAxis, at.x, CUBE.width, LIMIT.x) * sameAlong(tokenAxis, at.y, CUBE.height, LIMIT.y);
}

/** How many places of the cube in the frame give exactly this pooled vector. */
export function placesWithSamePooled(at: Point): number {
  return sameAlong(pooledAxis, at.x, CUBE.width, LIMIT.x) * sameAlong(pooledAxis, at.y, CUBE.height, LIMIT.y);
}

/** The cube moved by one whole patch across and one down, each way that keeps it in the frame. */
export function onePatchOver(at: Point): Point {
  return {
    x: at.x + PATCH_PX <= LIMIT.x ? at.x + PATCH_PX : at.x - PATCH_PX,
    y: at.y + PATCH_PX <= LIMIT.y ? at.y + PATCH_PX : at.y - PATCH_PX,
  };
}

// ---------------------------------------------------------------- what a move changes

export interface Change {
  /** The cube is not where it was. */
  moved: boolean;
  /** Tokens that held a piece of the cube before the move, in order. */
  heldBefore: number[];
  /** Tokens that hold a piece of it now, in order. */
  holdNow: number[];
  /** Tokens whose numbers differ from before. */
  changed: number[];
  /** How many numbers of all the tokens together differ from before: pixels that turned from table to cube or back. */
  tokenNumbers: number;
  /** Positions in the pooled vector whose value differs from before, row by row. */
  pooledChanged: number[];
  /**
   * The largest change of any one of the pooled vector's numbers, as a
   * numerator over TOKEN_COUNT: 1 means one part in 196 of the difference
   * between table and cube. A token's numbers change by the whole of it.
   */
  pooledStep: number;
}

/** Pixels the cube covers at one place and not at the other, counted both ways. */
function pixelsChanged(before: Point, now: Point): number {
  const across = Math.max(0, Math.min(before.x, now.x) + CUBE.width - Math.max(before.x, now.x));
  const down = Math.max(0, Math.min(before.y, now.y) + CUBE.height - Math.max(before.y, now.y));
  return 2 * (CUBE.width * CUBE.height - across * down);
}

/** What differs in the two representations between the cube's place before the move and its place now. */
export function compare(before: Point, now: Point): Change {
  const was = new Map(piecesAt(before).map((piece) => [piece.token, content(piece)]));
  const is = new Map(piecesAt(now).map((piece) => [piece.token, content(piece)]));
  const changed = [...new Set([...was.keys(), ...is.keys()])]
    .filter((token) => was.get(token) !== is.get(token))
    .sort((a, b) => a - b);

  const pooledBefore = averagePatch(before);
  const pooledNow = averagePatch(now);
  const pooledChanged: number[] = [];
  let pooledStep = 0;
  pooledNow.forEach((count, index) => {
    const difference = Math.abs(count - pooledBefore[index]);
    if (difference > 0) pooledChanged.push(index);
    if (difference > pooledStep) pooledStep = difference;
  });

  return {
    moved: !samePoint(before, now),
    heldBefore: [...was.keys()],
    holdNow: [...is.keys()],
    changed,
    tokenNumbers: pixelsChanged(before, now),
    pooledChanged,
    pooledStep,
  };
}

// ---------------------------------------------------------------- words

/** "65", "65 and 66", "65, 66, 79 and 80". */
export function listed(values: readonly (number | string)[]): string {
  if (values.length <= 1) return values.join("");
  return `${values.slice(0, -1).join(", ")} and ${values[values.length - 1]}`;
}

/** A count with thousands separated, the same on the server and in every browser: "50,176". */
export const grouped = (value: number) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** Where the cube is against where it was: "110 px right of and 52 px above where it was". */
export function displacement(before: Point, now: Point): string {
  const across = now.x - before.x;
  const down = now.y - before.y;
  const parts: string[] = [];
  if (across !== 0) parts.push(`${Math.abs(across)} px ${across > 0 ? "right of" : "left of"}`);
  if (down !== 0) parts.push(`${Math.abs(down)} px ${down > 0 ? "below" : "above"}`);
  return parts.length > 0 ? `${parts.join(" and ")} where it was` : "where it was";
}

/** The share of a number's range by which the pooled vector moved at most: "1/196". */
export function pooledShare(change: Change): string {
  return `${change.pooledStep}/${TOKEN_COUNT}`;
}

/** Numbers in all the tokens of one frame together. */
export const ALL_TOKEN_NUMBERS = TOKEN_COUNT * TOKEN_WIDTH;

/** What the move did to the tokens, in one sentence. */
export function tokensSentence(change: Change): string {
  const holders = `${change.holdNow.length === 1 ? "Token" : "Tokens"} ${listed(change.holdNow)} ${change.holdNow.length === 1 ? "holds" : "hold"} the cube`;
  if (!change.moved) return `${holders}.`;
  return `${holders} now. ${change.changed.length} of the ${TOKEN_COUNT} tokens changed: ${grouped(change.tokenNumbers)} of the ${grouped(ALL_TOKEN_NUMBERS)} numbers in all the tokens, each from table to cube or back.`;
}

/** "place of the cube gives" or "places of the cube give", to follow a count. */
export const placesGive = (count: number) => (count === 1 ? "place of the cube gives" : "places of the cube give");

/** "1 place of the cube gives", "2,717 places of the cube give". */
export const placesOfTheCube = (count: number) => `${grouped(count)} ${placesGive(count)}`;

/** What the move did to the pooled vector, and what the vector can tell apart, in one or two sentences. */
export function pooledSentence(change: Change, now: Point): string {
  const pooled = placesWithSamePooled(now);
  const same =
    pooled === 1
      ? `${placesOfTheCube(pooled)} this exact pooled vector.`
      : `${placesOfTheCube(pooled)} this exact pooled vector, so it cannot say where the cube is.`;
  if (!change.moved) return same;
  if (change.pooledChanged.length === 0)
    return `The pooled vector is exactly what it was: not one of its numbers moved. ${same}`;
  return `In the pooled vector ${change.pooledChanged.length} of ${TOKEN_WIDTH} numbers moved, each by ${pooledShare(change)} of the step from table to cube: only where the cube sits inside its patch can change the pooled vector, never which patch it is in.`;
}

/** The state of the figure in two or three sentences, for the visible status line. */
export function statusSentence(before: Point, now: Point, change: Change): string {
  if (!change.moved) return `The cube is where it was. ${tokensSentence(change)} ${pooledSentence(change, now)}`;
  return `The cube is ${displacement(before, now)}. ${tokensSentence(change)} ${pooledSentence(change, now)}`;
}

/** The same state in one short sentence, for screen readers: announced once the cube has stopped. */
export function announcedSentence(change: Change, now: Point): string {
  const pooled = placesWithSamePooled(now);
  const tokens = change.moved
    ? `Tokens: ${change.changed.length} of ${TOKEN_COUNT} changed.`
    : `Tokens: ${change.holdNow.length} of ${TOKEN_COUNT} hold the cube.`;
  const vector = change.moved
    ? `Pooled vector: ${change.pooledChanged.length} of ${TOKEN_WIDTH} numbers changed`
    : "Pooled vector";
  return `${tokens} ${vector}; ${placesOfTheCube(pooled)} it.`;
}

/** What the drawing shows, for readers who cannot see it. */
export const DRAWING_DESCRIPTION = `A camera frame of ${FRAME_PX} by ${FRAME_PX} pixels holds one cube and is cut into ${GRID} by ${GRID} patches of ${PATCH_PX} pixels. Each patch becomes one token, ${TOKEN_COUNT} in all, and only the tokens of the patches the cube touches hold any of it. On one path all ${TOKEN_COUNT} tokens reach the action head. On the other they are averaged into one pooled vector of ${TOKEN_WIDTH} numbers, and only that vector reaches the action head; in it the cube's pixels are folded into one patch-sized square at a ${TOKEN_COUNT}th of their strength, which keeps how the cube straddles the grid lines and loses which patches it is in, so many places of the cube give the same pooled vector. Every count is per image: a policy that gets several images at a step tokenises or pools each one on its own.`;

// ---------------------------------------------------------------- the measured comparison

export interface MeasuredResult {
  /** What the action head of this policy received. */
  reaches: string;
  /** The policy, as the lab notebook describes it. */
  policy: string;
  /** Parameters in millions. */
  parametersM: number;
  /** "15/50 = 30%". */
  success: string;
  /** "19-44%". */
  interval: string;
  /** Success, and the ends of its 95% interval, between 0 and 1. */
  rate: number;
  low: number;
  high: number;
}

export interface Measured {
  tokens: MeasuredResult;
  pooled: MeasuredResult;
  /** What the two rows have in common. */
  task: string;
  taskLabel: string;
  machine: string;
  demos: number;
  samples: string;
  episodes: number;
  /** The notebook heading the rows are under, without its code marks. */
  section: string;
}

function result(row: PickCubeRow, reaches: string): MeasuredResult {
  const policy = pickCube.policies[row.policy];
  return {
    reaches,
    policy: policy.label,
    parametersM: policy.parametersM,
    success: formatSuccess(row),
    interval: formatInterval([row.interval[0] / 100, row.interval[1] / 100]),
    rate: row.successes / row.episodes,
    low: row.interval[0] / 100,
    high: row.interval[1] / 100,
  };
}

/**
 * The pooled policy and the patch-token policy trained on the same
 * demonstrations for the same number of samples. Null if the notebook no
 * longer has such a pair; the figure then shows the drawing alone.
 */
export const MEASURED: Measured | null = (() => {
  const pooled = pickCube.rows.find((row) => row.policy === "clip_pooled");
  const tokens = pickCube.rows.find(
    (row) => row.policy === "dp_vit" && row.demos === pooled?.demos && row.samples === pooled?.samples,
  );
  if (!pooled || !tokens || pooled.episodes !== tokens.episodes) return null;
  return {
    tokens: result(tokens, "Every patch a token"),
    pooled: result(pooled, "One pooled vector per image"),
    task: TASKS.pick_cube.description,
    taskLabel: TASKS.pick_cube.label,
    machine: MACHINES[pickCube.machine].label,
    demos: pooled.demos,
    samples: pooled.samples,
    episodes: pooled.episodes,
    section: pickCube.section.replaceAll("`", ""),
  };
})();
