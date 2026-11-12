/**
 * The arithmetic of the "rotary" figure. Nothing here draws.
 *
 * The toy is the one of the chapter: one pair of a head's numbers, turning
 * 1 radian per position, with query and key both (1, 0) before they are
 * turned. The angle of a token is then its position, in radians, as the
 * position table holds it:
 *
 *   float32    holds every whole number of the table exactly
 *   bfloat16   keeps 8 significant bits, so a position is rounded to the
 *              nearest number that fits (a tie goes to the even significand)
 *
 * The size of the table, the number of significant bits, the count of distinct
 * positions and the counts for the two policies come from the lab notebook
 * (src/data/notebook.ts). The count is also made here, by rounding every
 * position; the figure only says so when the two agree.
 */

import { positionTable } from "@/data/notebook";

export type TableKind = "float32" | "bfloat16";

/** Positions in the table (2048), and the last of them. */
export const TABLE_SIZE: number = positionTable.positions;
export const LAST_POSITION = TABLE_SIZE - 1;

/** Significant bits of the half-precision format the old table was computed in. */
export const SIGNIFICANT_BITS: number = positionTable.significantBits;

/**
 * The largest offset between query and key the figure offers, in positions.
 * Below pi, so that in float32 the angle from key to query is always the gap
 * the reader sees between the arrows; it still covers the chapter's rows at
 * -2 and -1. Rounding can still push the stored angle past pi; the dial then
 * draws the gap and says how many turns were dropped.
 */
export const MAX_OFFSET = 3;

/** Where the figure starts: the first row of the chapter's table. */
export const START = { query: 3, offset: -2 } as const;

/** How far Play moves the pair: to the second row of the chapter's table. */
export const SWEEP = 10;

/**
 * A whole number rounded to `bits` significant binary digits, to nearest, a
 * tie going to the even significand: what casting a float32 to a narrower
 * float does. Exact for the whole numbers of the table.
 */
export function roundToBits(position: number, bits: number): number {
  if (position < 2 ** bits) return position;
  const exponent = 31 - Math.clz32(position);
  const step = 2 ** (exponent - bits + 1);
  const below = Math.floor(position / step) * step;
  const twice = (position - below) * 2;
  if (twice < step) return below;
  if (twice > step) return below + step;
  return (below / step) % 2 === 0 ? below : below + step;
}

const POSITIONS = Array.from({ length: TABLE_SIZE }, (_, position) => position);

/** What bfloat16 keeps of each position. */
const ROUNDED: readonly number[] = POSITIONS.map((position) => roundToBits(position, SIGNIFICANT_BITS));

/** The position as the table holds it; its angle in radians in this toy. */
export function stored(position: number, table: TableKind): number {
  if (table === "float32") return Math.fround(position);
  return ROUNDED[position] ?? roundToBits(position, SIGNIFICANT_BITS);
}

// ---------------------------------------------------------------- how many positions stay distinct

/** The lab notebook's count: 641 distinct positions out of 2048. */
export const MEASURED_DISTINCT: number = positionTable.distinct;

/** Whether rounding every position here leaves the number the notebook reports. */
export const COUNT_REPRODUCED = new Set(ROUNDED).size === MEASURED_DISTINCT;

/** Distinct positions under float32, counted here: all of them. */
export const DISTINCT_FLOAT32 = new Set(POSITIONS.map((position) => Math.fround(position))).size;

/** The notebook section the numbers come from. */
export const NOTEBOOK_SECTION: string = positionTable.section;

// ---------------------------------------------------------------- blocks: positions that share a rotation

export interface Block {
  /** The position bfloat16 holds for all of them. */
  value: number;
  /** First and last position rounded to it. */
  from: number;
  to: number;
}

const BLOCKS: Block[] = [];
const BLOCK_OF: number[] = [];
for (const position of POSITIONS) {
  const last = BLOCKS[BLOCKS.length - 1];
  if (last && last.value === ROUNDED[position]) last.to = position;
  else BLOCKS.push({ value: ROUNDED[position], from: position, to: position });
  BLOCK_OF.push(BLOCKS.length - 1);
}

/** The blocks that touch positions `first` to `last`, in order. */
export function blocksBetween(first: number, last: number): Block[] {
  const from = Math.max(0, Math.ceil(first));
  const to = Math.min(LAST_POSITION, Math.floor(last));
  if (from > to) return [];
  return BLOCKS.slice(BLOCK_OF[from], BLOCK_OF[to] + 1);
}

/** How many positions share the rotation of this one under bfloat16. */
export function blockSize(position: number): number {
  const block = BLOCKS[BLOCK_OF[position]];
  return block ? block.to - block.from + 1 : 1;
}

// ---------------------------------------------------------------- zones: how far apart the stored positions are

export interface Zone {
  from: number;
  to: number;
  /** Distance between neighbouring positions the table can hold: 1, 2, 4, 8. */
  gap: number;
  /** What the table holds there, in the notebook's words. */
  holds: string;
}

function holdsText(from: number, gap: number): string {
  if (gap === 1) return "every position";
  const noted = positionTable.collapse.find((entry) => entry.above === from - 1);
  if (noted) return noted.onto;
  return gap === 2 ? "even numbers" : `multiples of ${gap}`;
}

/** Stretches of the table with the same gap, found by walking the rounded positions. */
export const ZONES: Zone[] = (() => {
  const values = [...new Set(ROUNDED)].sort((a, b) => a - b);
  const zones: Zone[] = [];
  let index = 0;
  for (const position of POSITIONS) {
    while (values[index] < position) index += 1;
    const gap = index === 0 ? 1 : values[index] - values[index - 1];
    const last = zones[zones.length - 1];
    if (last && last.gap === gap) last.to = position;
    else zones.push({ from: position, to: position, gap, holds: "" });
  }
  return zones.map((zone) => ({ ...zone, holds: holdsText(zone.from, zone.gap) }));
})();

export function zoneOf(position: number): Zone {
  return ZONES.find((zone) => position <= zone.to) ?? ZONES[ZONES.length - 1];
}

// ---------------------------------------------------------------- the two policies

export interface Landmark {
  id: "noHistory" | "history";
  /** "Policy without history". */
  policy: string;
  /** "No history": the band's label in the chart. */
  short: string;
  /** First and last position of its action-step tokens. */
  first: number;
  last: number;
  /** How many tokens that is, and how many positions they shared under the old table. */
  tokens: number;
  shared: number;
  /** A query and a key two positions apart that the old table turned alike. */
  query: number;
  key: number;
}

/** A whole-number field of a data-module entry, if it is there. */
function numberField(source: object, key: string): number | undefined {
  const value = (source as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isInteger(value) ? value : undefined;
}

/**
 * Where the action-step tokens of the two policies sit. The first and last
 * position come from the lab notebook (src/data/notebook.ts) where it exports
 * them; otherwise from the chapter ("The position table under bfloat16"),
 * which is the fallback below. How many tokens they are and how many positions
 * they shared always come from the notebook, and a range is only shown when
 * rounding it here gives the notebook's counts, so a stale fallback hides the
 * landmark rather than showing something false.
 */
const ACTION_STEPS = [
  { id: "noHistory", policy: "Policy without history", short: "No history", chapterFirst: 426, noted: positionTable.noHistory },
  { id: "history", policy: "Policy with history", short: "History", chapterFirst: 819, noted: positionTable.history },
] as const;

export const LANDMARKS: Landmark[] = ACTION_STEPS.flatMap((step) => {
  const first = numberField(step.noted, "firstActionPosition") ?? step.chapterFirst;
  const last = numberField(step.noted, "lastActionPosition") ?? first + step.noted.actionTokens - 1;
  const entry = { ...step, first, last };
  if (first < 0 || last > LAST_POSITION || last < first) return [];
  const range = POSITIONS.slice(entry.first, entry.last + 1);
  const shared = new Set(range.map((position) => ROUNDED[position])).size;
  if (range.length !== entry.noted.actionTokens || shared !== entry.noted.positionsShared) return [];
  const query = range.find(
    (position) => position - START.offset <= entry.last && ROUNDED[position] === ROUNDED[position - START.offset],
  );
  if (query === undefined) return [];
  return [
    {
      id: entry.id,
      policy: entry.policy,
      short: entry.short,
      first: entry.first,
      last: entry.last,
      tokens: entry.noted.actionTokens,
      shared: entry.noted.positionsShared,
      query,
      key: query - START.offset,
    },
  ];
});

// ---------------------------------------------------------------- the pair

/** A query and a key: where they are, and where the table says they are. */
export interface Pose {
  /** Position of the query and of the key. */
  query: number;
  key: number;
  /** The same as the selected table holds them: their angles, in radians. */
  storedQuery: number;
  storedKey: number;
}

export function poseOf(query: number, offset: number, table: TableKind): Pose {
  const key = query - offset;
  return { query, key, storedQuery: stored(query, table), storedKey: stored(key, table) };
}

/** The attention score of the toy: the dot product of two unit vectors `offset` radians apart. */
export function score(offset: number): number {
  return Math.cos(offset);
}

/** The query positions that keep the key inside the table, for an offset. */
export function queryRange(offset: number): [number, number] {
  return [Math.max(0, offset), Math.min(LAST_POSITION, LAST_POSITION + offset)];
}

export function clamp(value: number, low: number, high: number): number {
  return Math.min(Math.max(value, low), high);
}

// ---------------------------------------------------------------- numbers as text

const MINUS = "−";

/** A whole number with a true minus sign: -2 reads "−2". */
export function whole(value: number): string {
  return value < 0 ? `${MINUS}${Math.abs(value)}` : String(value);
}

/** A score with three decimals, as the chapter prints it: "−0.416". Never "−0.000". */
export function decimals(value: number, digits = 3): string {
  const text = Math.abs(value).toFixed(digits);
  return value < 0 && Number(text) !== 0 ? `${MINUS}${text}` : text;
}

// ---------------------------------------------------------------- the turned vector

/** The toy's unit vector (1, 0) turned by `angle` radians: (cos, sin). */
export function turned(angle: number): Point2 {
  return [Math.cos(angle), Math.sin(angle)];
}

export type Point2 = readonly [number, number];

/** A vector as the chapter prints it: "(−0.990, 0.141)". */
export function vectorText([x, y]: Point2): string {
  return `(${decimals(x)}, ${decimals(y)})`;
}

// ---------------------------------------------------------------- distinct positions up to a position

/**
 * How many distinct values the table holds for positions 0 to `position`,
 * under each format. Counted from the rounded positions, so the last entry of
 * the bfloat16 count is the number compared with the notebook above.
 */
const DISTINCT_UP_TO: readonly number[] = (() => {
  const counts: number[] = [];
  let distinct = 0;
  let previous = Number.NaN;
  for (const position of POSITIONS) {
    if (ROUNDED[position] !== previous) distinct += 1;
    previous = ROUNDED[position];
    counts.push(distinct);
  }
  return counts;
})();

export function distinctUpTo(position: number, table: TableKind): number {
  if (table === "float32") return position + 1;
  return DISTINCT_UP_TO[position] ?? 0;
}

/**
 * The corners of the bfloat16 count, position against distinct values: one
 * point at each end of each zone. Inside a zone the count climbs one value
 * every `gap` positions, which at the scale of the whole table is a straight
 * line between these points.
 */
export const DISTINCT_CORNERS: readonly Point2[] = [
  [0, distinctUpTo(0, "bfloat16")],
  ...ZONES.map((zone): Point2 => [zone.to, distinctUpTo(zone.to, "bfloat16")]),
];
